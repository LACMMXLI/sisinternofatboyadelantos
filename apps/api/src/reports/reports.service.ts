import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { accessibleBranchIds } from '../common/scope/branch-scope.util';
import type { AuthenticatedUser } from '../common/types/authenticated-request';
import type { ListReportMovementsQueryDto } from './dto/list-report-movements.dto';
import type { ListReportBalancesQueryDto } from './dto/list-report-balances.dto';

const movementSelect = {
  id: true,
  branchId: true,
  employeeId: true,
  categoryId: true,
  direction: true,
  amountCents: true,
  concept: true,
  occurredAt: true,
  status: true,
  branch: { select: { id: true, name: true, code: true } },
  employee: { select: { id: true, displayName: true, employeeNumber: true } },
  category: {
    select: { id: true, label: true, colorToken: true, iconName: true },
  },
  createdBy: { select: { id: true, displayName: true } },
} satisfies Prisma.LedgerMovementSelect;

type ReportMovement = Prisma.LedgerMovementGetPayload<{
  select: typeof movementSelect;
}>;

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Reportes (Fase 8): lecturas agregadas sobre el ledger, con el mismo
 * alcance por sucursal que el resto del sistema (§5) — nunca un endpoint
 * "de admin" que se salte el filtro. No calcula nómina, solo reporta lo que
 * ya existe en `LedgerMovement`.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMovements(
    user: AuthenticatedUser,
    query: ListReportMovementsQueryDto,
  ) {
    const scopeIds = accessibleBranchIds(user);
    if (query.branchId && scopeIds && !scopeIds.includes(query.branchId)) {
      return { items: [], totals: this.emptyTotals() };
    }
    const branchFilter = query.branchId ? [query.branchId] : scopeIds;

    const items = await this.prisma.ledgerMovement.findMany({
      where: this.buildWhere(user.organizationId, query, branchFilter),
      select: movementSelect,
      orderBy: { occurredAt: 'desc' },
    });

    return { items, totals: this.computeTotals(items) };
  }

  async exportMovementsCsv(
    user: AuthenticatedUser,
    query: ListReportMovementsQueryDto,
  ): Promise<Buffer> {
    const { items } = await this.listMovements(user, query);

    const header = [
      'Fecha',
      'Sucursal',
      'Empleado',
      'Número',
      'Categoría',
      'Dirección',
      'Monto (MXN)',
      'Estado',
      'Concepto',
      'Registró',
    ];
    const rows = items.map((m) => [
      DATE_FORMAT.format(m.occurredAt),
      m.branch.name,
      m.employee.displayName,
      m.employee.employeeNumber,
      m.category.label,
      m.direction === 'CHARGE' ? 'Cargo' : 'Abono',
      (m.amountCents / 100).toFixed(2),
      m.status,
      m.concept,
      m.createdBy?.displayName ?? '—',
    ]);

    return Buffer.from(this.toCsv([header, ...rows]), 'utf-8');
  }

  async balances(user: AuthenticatedUser, query: ListReportBalancesQueryDto) {
    const scopeIds = accessibleBranchIds(user);
    if (query.branchId && scopeIds && !scopeIds.includes(query.branchId)) {
      return [];
    }
    const branchFilter = query.branchId ? [query.branchId] : scopeIds;

    const employees = await this.prisma.employee.findMany({
      where: {
        organizationId: user.organizationId,
        active: true,
        ...(branchFilter
          ? {
              OR: [
                { primaryBranchId: { in: branchFilter } },
                {
                  additionalBranches: {
                    some: { branchId: { in: branchFilter } },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        displayName: true,
        employeeNumber: true,
        primaryBranch: { select: { id: true, name: true } },
      },
    });
    if (employees.length === 0) return [];

    // Una sola consulta agregada para todos los empleados en alcance — evita
    // el N+1 que sí es razonable en el frontend de la Libreta (documentado
    // en Fase 4) pero no tiene sentido repetir aquí, donde ya se listan
    // todos de una vez.
    const grouped = await this.prisma.ledgerMovement.groupBy({
      by: ['employeeId', 'direction'],
      where: {
        organizationId: user.organizationId,
        employeeId: { in: employees.map((e) => e.id) },
        status: 'POSTED',
      },
      _sum: { amountCents: true },
    });

    const balanceByEmployee = new Map<string, number>();
    for (const row of grouped) {
      const delta =
        row.direction === 'CHARGE'
          ? (row._sum.amountCents ?? 0)
          : -(row._sum.amountCents ?? 0);
      balanceByEmployee.set(
        row.employeeId,
        (balanceByEmployee.get(row.employeeId) ?? 0) + delta,
      );
    }

    return employees
      .map((e) => ({
        employeeId: e.id,
        displayName: e.displayName,
        employeeNumber: e.employeeNumber,
        branch: e.primaryBranch,
        balanceCents: balanceByEmployee.get(e.id) ?? 0,
      }))
      .sort((a, b) => b.balanceCents - a.balanceCents);
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  private buildWhere(
    organizationId: string,
    query: ListReportMovementsQueryDto,
    branchFilter: string[] | undefined,
  ): Prisma.LedgerMovementWhereInput {
    return {
      organizationId,
      ...(branchFilter ? { branchId: { in: branchFilter } } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            occurredAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
    };
  }

  private computeTotals(items: ReportMovement[]) {
    let chargeCents = 0;
    let creditCents = 0;
    const byCategory = new Map<
      string,
      { label: string; amountCents: number }
    >();

    for (const m of items) {
      if (m.status !== 'POSTED') continue;
      if (m.direction === 'CHARGE') chargeCents += m.amountCents;
      else creditCents += m.amountCents;

      const existing = byCategory.get(m.categoryId);
      const signedAmount =
        m.direction === 'CHARGE' ? m.amountCents : -m.amountCents;
      byCategory.set(m.categoryId, {
        label: m.category.label,
        amountCents: (existing?.amountCents ?? 0) + signedAmount,
      });
    }

    return {
      chargeCents,
      creditCents,
      netCents: chargeCents - creditCents,
      byCategory: [...byCategory.values()].sort(
        (a, b) => b.amountCents - a.amountCents,
      ),
    };
  }

  private emptyTotals() {
    return {
      chargeCents: 0,
      creditCents: 0,
      netCents: 0,
      byCategory: [] as { label: string; amountCents: number }[],
    };
  }

  /**
   * CSV con saneo contra "CSV injection" (§11): una celda que empieza con
   * =, +, - o @ puede ejecutarse como fórmula al abrir el archivo en Excel/
   * Sheets — se le antepone un apóstrofo para neutralizarla, igual que hace
   * Excel al importar CSV de fuentes no confiables.
   */
  private toCsv(rows: string[][]): string {
    return rows
      .map((row) =>
        row
          .map((cell) => {
            const raw = String(cell ?? '');
            const sanitized = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
            const escaped = sanitized.replace(/"/g, '""');
            return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
          })
          .join(','),
      )
      .join('\r\n');
  }
}
