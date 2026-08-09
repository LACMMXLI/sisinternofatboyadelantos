import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { roleHasCapability } from '@libreta/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from '../employees/employees.service';
import { accessibleBranchIds } from '../common/scope/branch-scope.util';
import { PayrollPdfService } from './payroll-pdf.service';
import type { AuthenticatedUser } from '../common/types/authenticated-request';
import type { PrepareBatchDto } from './dto/prepare-batch.dto';
import type { ListBatchesQueryDto } from './dto/list-batches.dto';
import type { UpdateBatchItemDto } from './dto/update-batch-item.dto';
import type { ReopenBatchDto } from './dto/reopen-batch.dto';

const PERIOD_LABEL_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
});

const batchSelect = {
  id: true,
  organizationId: true,
  periodId: true,
  branchId: true,
  status: true,
  version: true,
  createdByUserId: true,
  reviewedByUserId: true,
  lockedAt: true,
  appliedAt: true,
  closedAt: true,
  reopenedAt: true,
  reopenReason: true,
  totalPlannedCents: true,
  totalAppliedCents: true,
  createdAt: true,
  period: {
    select: {
      id: true,
      frequency: true,
      startsAt: true,
      endsAt: true,
      payDate: true,
      status: true,
    },
  },
  branch: { select: { id: true, name: true, code: true } },
  items: {
    select: {
      id: true,
      employeeId: true,
      balanceAtPrepCents: true,
      plannedAmountCents: true,
      appliedAmountCents: true,
      balanceAfterCents: true,
      ledgerMovementId: true,
      employee: {
        select: {
          id: true,
          displayName: true,
          employeeNumber: true,
          jobTitle: true,
          primaryBranch: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.PayrollBatchSelect;

type BatchWithItems = Prisma.PayrollBatchGetPayload<{
  select: typeof batchSelect;
}>;

/**
 * Preparación y aplicación de nómina (§Fase 5). No calcula sueldo/ISR/IMSS:
 * solo prepara y aplica el descuento de saldos pendientes del ledger contra
 * un periodo, con asignación FIFO trazable (`SettlementAllocation`) y
 * reapertura auditada.
 */
@Injectable()
export class PayrollBatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
    private readonly payrollPdfService: PayrollPdfService,
  ) {}

  async prepare(user: AuthenticatedUser, dto: PrepareBatchDto) {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: dto.periodId, organizationId: user.organizationId },
    });
    if (!period) throw new NotFoundException('Periodo no encontrado.');
    if (period.status !== 'OPEN') {
      throw new BadRequestException('El periodo no está abierto.');
    }

    if (dto.branchId) {
      const scopeIds = accessibleBranchIds(user);
      if (scopeIds && !scopeIds.includes(dto.branchId)) {
        throw new ForbiddenException('No tienes acceso a esta sucursal.');
      }
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, organizationId: user.organizationId },
      });
      if (!branch) throw new NotFoundException('Sucursal no encontrada.');
    }

    const existingActive = await this.prisma.payrollBatch.findFirst({
      where: {
        organizationId: user.organizationId,
        periodId: dto.periodId,
        branchId: dto.branchId ?? null,
        status: { not: 'CLOSED' },
      },
    });
    if (existingActive) {
      throw new BadRequestException(
        'Ya existe un lote activo para este periodo y sucursal.',
      );
    }

    const employees = await this.employeesService.list(user, {
      active: true,
      branchId: dto.branchId,
    });

    const items: { employeeId: string; balanceCents: number }[] = [];
    for (const employee of employees) {
      const balance = await this.getEmployeeBalance(
        user.organizationId,
        employee.id,
      );
      if (balance > 0)
        items.push({ employeeId: employee.id, balanceCents: balance });
    }
    const totalPlannedCents = items.reduce((sum, i) => sum + i.balanceCents, 0);

    return this.prisma.payrollBatch.create({
      data: {
        organizationId: user.organizationId,
        periodId: dto.periodId,
        branchId: dto.branchId,
        createdByUserId: user.userId,
        totalPlannedCents,
        items: {
          create: items.map((i) => ({
            employeeId: i.employeeId,
            balanceAtPrepCents: i.balanceCents,
            plannedAmountCents: i.balanceCents,
          })),
        },
      },
      select: batchSelect,
    });
  }

  async list(user: AuthenticatedUser, query: ListBatchesQueryDto) {
    this.assertPayrollCapability(user);
    const scopeIds = accessibleBranchIds(user);
    if (query.branchId && scopeIds && !scopeIds.includes(query.branchId)) {
      return [];
    }
    const branchFilter = query.branchId ? [query.branchId] : scopeIds;

    return this.prisma.payrollBatch.findMany({
      where: {
        organizationId: user.organizationId,
        ...(query.periodId ? { periodId: query.periodId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(branchFilter ? { branchId: { in: branchFilter } } : {}),
      },
      select: batchSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(user: AuthenticatedUser, batchId: string) {
    this.assertPayrollCapability(user);
    return this.getOwnedBatch(user, batchId);
  }

  async exportPdf(user: AuthenticatedUser, batchId: string) {
    this.assertPayrollCapability(user);
    const batch = await this.getOwnedBatch(user, batchId);
    return this.payrollPdfService.generate(user.organizationId, batch);
  }

  async updateItem(
    user: AuthenticatedUser,
    batchId: string,
    itemId: string,
    dto: UpdateBatchItemDto,
  ) {
    const batch = await this.getOwnedBatch(user, batchId);
    if (!['DRAFT', 'REOPENED'].includes(batch.status)) {
      throw new BadRequestException(
        'Solo se pueden editar montos en lotes en borrador o reabiertos.',
      );
    }
    const item = batch.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Renglón no encontrado.');
    if (dto.plannedAmountCents > item.balanceAtPrepCents) {
      throw new BadRequestException(
        'El monto planeado no puede superar el saldo al preparar el lote.',
      );
    }

    await this.prisma.payrollBatchItem.update({
      where: { id: itemId },
      data: { plannedAmountCents: dto.plannedAmountCents },
    });
    const totalPlannedCents = batch.items.reduce(
      (sum, i) =>
        sum + (i.id === itemId ? dto.plannedAmountCents : i.plannedAmountCents),
      0,
    );
    await this.prisma.payrollBatch.update({
      where: { id: batchId },
      data: { totalPlannedCents },
    });
    return this.getOwnedBatch(user, batchId);
  }

  async submit(user: AuthenticatedUser, batchId: string) {
    const batch = await this.getOwnedBatch(user, batchId);
    if (!['DRAFT', 'REOPENED'].includes(batch.status)) {
      throw new BadRequestException(
        'Solo se pueden enviar a revisión lotes en borrador o reabiertos.',
      );
    }
    if (batch.items.length === 0) {
      throw new BadRequestException('El lote no tiene renglones que aplicar.');
    }
    return this.prisma.payrollBatch.update({
      where: { id: batchId },
      data: { status: 'UNDER_REVIEW' },
      select: batchSelect,
    });
  }

  async lock(user: AuthenticatedUser, batchId: string) {
    const batch = await this.getOwnedBatch(user, batchId);
    if (batch.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(
        'Solo se pueden bloquear lotes en revisión.',
      );
    }
    return this.prisma.payrollBatch.update({
      where: { id: batchId },
      data: {
        status: 'LOCKED',
        reviewedByUserId: user.userId,
        lockedAt: new Date(),
      },
      select: batchSelect,
    });
  }

  async apply(user: AuthenticatedUser, batchId: string) {
    const batch = await this.getOwnedBatch(user, batchId);
    if (batch.status !== 'LOCKED') {
      throw new BadRequestException('Solo se pueden aplicar lotes bloqueados.');
    }

    const category = await this.prisma.movementCategory.findFirst({
      where: {
        organizationId: user.organizationId,
        code: 'PAYROLL_DEDUCTION',
        direction: 'CREDIT',
      },
    });
    if (!category) {
      throw new BadRequestException(
        'Falta la categoría del sistema "PAYROLL_DEDUCTION" (aplicado en nómina). Corre el seed o créala.',
      );
    }
    const periodLabel = this.periodLabel(batch.period);

    return this.prisma.$transaction(async (tx) => {
      // Reclamo atómico: si otra request ya movió el lote de LOCKED a otro
      // estado, count === 0 y se rechaza — evita aplicar dos veces en
      // requests concurrentes (§Fase 5).
      const claim = await tx.payrollBatch.updateMany({
        where: { id: batchId, status: 'LOCKED' },
        data: { status: 'APPLIED', appliedAt: new Date() },
      });
      if (claim.count === 0) {
        throw new ConflictException(
          'El lote ya fue aplicado o cambió de estado.',
        );
      }

      let totalAppliedCents = 0;
      for (const item of batch.items) {
        if (item.plannedAmountCents <= 0) continue;

        const branchId =
          batch.branchId ?? (await this.primaryBranchFor(tx, item.employeeId));
        const credit = await tx.ledgerMovement.create({
          data: {
            organizationId: user.organizationId,
            branchId,
            employeeId: item.employeeId,
            categoryId: category.id,
            direction: 'CREDIT',
            amountCents: item.plannedAmountCents,
            concept: `Aplicado en nómina (${periodLabel})`,
            occurredAt: new Date(),
            status: 'POSTED',
            createdByUserId: user.userId,
            idempotencyKey: `payroll:${batchId}:${item.employeeId}`,
            source: 'PAYROLL',
          },
        });

        await tx.payrollBatchItem.update({
          where: { id: item.id },
          data: {
            ledgerMovementId: credit.id,
            appliedAmountCents: item.plannedAmountCents,
            balanceAfterCents:
              item.balanceAtPrepCents - item.plannedAmountCents,
          },
        });

        await this.allocateFifo(
          tx,
          user.organizationId,
          item.employeeId,
          batchId,
          credit.id,
          item.plannedAmountCents,
        );

        totalAppliedCents += item.plannedAmountCents;
      }

      const updated = await tx.payrollBatch.update({
        where: { id: batchId },
        data: { totalAppliedCents },
        select: batchSelect,
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorUserId: user.userId,
          action: 'payroll.apply',
          entityType: 'PayrollBatch',
          entityId: batchId,
          afterSnapshot: JSON.parse(
            JSON.stringify(updated),
          ) as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  async close(user: AuthenticatedUser, batchId: string) {
    const batch = await this.getOwnedBatch(user, batchId);
    if (batch.status !== 'APPLIED') {
      throw new BadRequestException('Solo se pueden cerrar lotes aplicados.');
    }
    const updated = await this.prisma.payrollBatch.update({
      where: { id: batchId },
      data: { status: 'CLOSED', closedAt: new Date() },
      select: batchSelect,
    });
    await this.audit(user, 'payroll.close', batchId, updated);
    return updated;
  }

  async reopen(user: AuthenticatedUser, batchId: string, dto: ReopenBatchDto) {
    const batch = await this.getOwnedBatch(user, batchId);
    if (batch.status !== 'CLOSED') {
      throw new BadRequestException('Solo se pueden reabrir lotes cerrados.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of batch.items) {
        if (!item.ledgerMovementId) continue;
        const movement = await tx.ledgerMovement.findUnique({
          where: { id: item.ledgerMovementId },
        });
        // Mismo principio que LedgerService.reverse(): el saldo excluye lo
        // que no está POSTED, así que pasar a REVERSED basta para
        // restaurarlo — no se crea un movimiento espejo adicional.
        if (movement && movement.status === 'POSTED') {
          await tx.ledgerMovement.update({
            where: { id: movement.id },
            data: { status: 'REVERSED', reversalReason: dto.reason },
          });
        }
        await tx.payrollBatchItem.update({
          where: { id: item.id },
          data: {
            ledgerMovementId: null,
            appliedAmountCents: 0,
            balanceAfterCents: null,
          },
        });
      }

      const updated = await tx.payrollBatch.update({
        where: { id: batchId },
        data: {
          status: 'REOPENED',
          reopenedAt: new Date(),
          reopenReason: dto.reason,
          totalAppliedCents: 0,
        },
        select: batchSelect,
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorUserId: user.userId,
          action: 'payroll.reopen',
          entityType: 'PayrollBatch',
          entityId: batchId,
          reason: dto.reason,
          afterSnapshot: JSON.parse(
            JSON.stringify(updated),
          ) as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  private async allocateFifo(
    tx: Prisma.TransactionClient,
    organizationId: string,
    employeeId: string,
    batchId: string,
    creditMovementId: string,
    amountCents: number,
  ) {
    let remaining = amountCents;
    const charges = await tx.ledgerMovement.findMany({
      where: {
        organizationId,
        employeeId,
        direction: 'CHARGE',
        status: 'POSTED',
      },
      orderBy: { occurredAt: 'asc' },
      include: { sourceAllocations: { select: { allocatedCents: true } } },
    });
    for (const charge of charges) {
      if (remaining <= 0) break;
      const alreadyAllocated = charge.sourceAllocations.reduce(
        (sum, a) => sum + a.allocatedCents,
        0,
      );
      const available = charge.amountCents - alreadyAllocated;
      if (available <= 0) continue;
      const allocate = Math.min(available, remaining);
      await tx.settlementAllocation.create({
        data: {
          batchId,
          sourceMovementId: charge.id,
          creditMovementId,
          allocatedCents: allocate,
        },
      });
      remaining -= allocate;
    }
  }

  private async primaryBranchFor(
    tx: Prisma.TransactionClient,
    employeeId: string,
  ): Promise<string> {
    const employee = await tx.employee.findUniqueOrThrow({
      where: { id: employeeId },
      select: { primaryBranchId: true },
    });
    return employee.primaryBranchId;
  }

  private async getEmployeeBalance(
    organizationId: string,
    employeeId: string,
  ): Promise<number> {
    const rows = await this.prisma.ledgerMovement.groupBy({
      by: ['direction'],
      where: { organizationId, employeeId, status: 'POSTED' },
      _sum: { amountCents: true },
    });
    const charge =
      rows.find((r) => r.direction === 'CHARGE')?._sum.amountCents ?? 0;
    const credit =
      rows.find((r) => r.direction === 'CREDIT')?._sum.amountCents ?? 0;
    return charge - credit;
  }

  private periodLabel(period: { startsAt: Date; endsAt: Date }): string {
    return `${PERIOD_LABEL_FORMAT.format(period.startsAt)} - ${PERIOD_LABEL_FORMAT.format(period.endsAt)}`;
  }

  private async audit(
    user: AuthenticatedUser,
    action: string,
    entityId: string,
    after: unknown,
  ) {
    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorUserId: user.userId,
        action,
        entityType: 'PayrollBatch',
        entityId,
        afterSnapshot: JSON.parse(
          JSON.stringify(after),
        ) as Prisma.InputJsonValue,
      },
    });
  }

  private async getOwnedBatch(
    user: AuthenticatedUser,
    batchId: string,
  ): Promise<BatchWithItems> {
    const batch = await this.prisma.payrollBatch.findFirst({
      where: { id: batchId, organizationId: user.organizationId },
      select: batchSelect,
    });
    if (!batch) throw new NotFoundException('Lote no encontrado.');
    const scopeIds = accessibleBranchIds(user);
    if (scopeIds && (!batch.branchId || !scopeIds.includes(batch.branchId))) {
      throw new NotFoundException('Lote no encontrado.');
    }
    return batch;
  }

  private assertPayrollCapability(user: AuthenticatedUser): void {
    const allowed =
      roleHasCapability(user.role, 'payroll.prepare') ||
      roleHasCapability(user.role, 'payroll.apply') ||
      roleHasCapability(user.role, 'payroll.close') ||
      roleHasCapability(user.role, 'payroll.reopen');
    if (!allowed) {
      throw new ForbiddenException('No tienes permiso para consultar nómina.');
    }
  }
}
