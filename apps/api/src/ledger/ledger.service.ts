import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  type MovementDirection,
  type MovementStatus,
} from '@prisma/client';
import { roleHasCapability } from '@libreta/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from '../employees/employees.service';
import { accessibleBranchIds } from '../common/scope/branch-scope.util';
import type { AuthenticatedUser } from '../common/types/authenticated-request';
import type { CreateMovementDto } from './dto/create-movement.dto';
import type { ListMovementsQueryDto } from './dto/list-movements.dto';
import type { RejectMovementDto } from './dto/reject-movement.dto';
import type { ReverseMovementDto } from './dto/reverse-movement.dto';
import type { ReplaceMovementDto } from './dto/replace-movement.dto';

const movementSelect = {
  id: true,
  employeeId: true,
  branchId: true,
  categoryId: true,
  direction: true,
  amountCents: true,
  concept: true,
  occurredAt: true,
  status: true,
  createdByUserId: true,
  approvedByUserId: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  idempotencyKey: true,
  source: true,
  originalMovementId: true,
  reversalReason: true,
  metadata: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      code: true,
      label: true,
      iconName: true,
      colorToken: true,
      direction: true,
    },
  },
  createdBy: { select: { id: true, displayName: true } },
  approvedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.LedgerMovementSelect;

const DEFAULT_APPROVAL_THRESHOLD_CENTS = 100_000;

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  // -------------------------------------------------------------------
  // Alta
  // -------------------------------------------------------------------

  async create(user: AuthenticatedUser, dto: CreateMovementDto) {
    // Idempotencia primero (§6): repetir la misma llave devuelve el mismo
    // efecto en vez de duplicar, sin importar si el resto del payload varió.
    const existing = await this.findByIdempotencyKey(
      user.organizationId,
      dto.idempotencyKey,
    );
    if (existing) return existing;

    const employee = await this.employeesService.get(user, dto.employeeId);
    const employeeBranchIds = [
      employee.primaryBranchId,
      ...employee.additionalBranches.map((b) => b.branch.id),
    ];
    if (!employeeBranchIds.includes(dto.branchId)) {
      throw new BadRequestException(
        'El empleado no pertenece a la sucursal indicada.',
      );
    }
    const scopeIds = accessibleBranchIds(user);
    if (scopeIds && !scopeIds.includes(dto.branchId)) {
      throw new ForbiddenException('No tienes acceso a esta sucursal.');
    }

    const category = await this.prisma.movementCategory.findFirst({
      where: {
        id: dto.categoryId,
        organizationId: user.organizationId,
        active: true,
      },
    });
    if (!category)
      throw new NotFoundException('Categoría no encontrada o inactiva.');
    if (category.requiresNote && !dto.note?.trim()) {
      throw new BadRequestException('Esta categoría requiere una nota.');
    }
    if (
      category.maxPerMovementCents != null &&
      dto.amountCents > category.maxPerMovementCents
    ) {
      throw new BadRequestException(
        'El monto excede el máximo permitido para esta categoría.',
      );
    }

    const now = new Date();
    const occurredAt = dto.occurredAt ?? now;
    if (occurredAt.getTime() > now.getTime() + 60_000) {
      throw new BadRequestException(
        'La fecha del movimiento no puede ser futura.',
      );
    }
    if (
      this.isBackdated(occurredAt, now) &&
      !roleHasCapability(user.role, 'movement.backdate')
    ) {
      throw new ForbiddenException(
        'No tienes permiso para registrar movimientos con fecha pasada.',
      );
    }

    const status = await this.resolveInitialStatus(
      user.organizationId,
      category,
      dto.amountCents,
    );

    try {
      const created = await this.prisma.ledgerMovement.create({
        data: {
          organizationId: user.organizationId,
          branchId: dto.branchId,
          employeeId: dto.employeeId,
          categoryId: dto.categoryId,
          direction: category.direction,
          amountCents: dto.amountCents,
          concept: dto.concept,
          occurredAt,
          status,
          createdByUserId: user.userId,
          idempotencyKey: dto.idempotencyKey,
          metadata: dto.note ? { note: dto.note } : undefined,
        },
        select: movementSelect,
      });
      await this.audit(this.prisma, user, 'movement.create', null, created);
      return created;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Condición de carrera: otra request con la misma llave ganó la
        // inserción entre nuestro chequeo y el create. Mismo efecto: se
        // devuelve el movimiento ya creado, no se duplica.
        const raced = await this.findByIdempotencyKey(
          user.organizationId,
          dto.idempotencyKey,
        );
        if (raced) return raced;
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Lectura (staff — alcance por sucursal)
  // -------------------------------------------------------------------

  async list(user: AuthenticatedUser, query: ListMovementsQueryDto) {
    this.assertStaffReadCapability(user);

    const scopeIds = accessibleBranchIds(user);
    if (query.employeeId) {
      await this.employeesService.get(user, query.employeeId);
    }
    if (query.branchId && scopeIds && !scopeIds.includes(query.branchId)) {
      return [];
    }
    const branchFilter = query.branchId ? [query.branchId] : scopeIds;

    return this.prisma.ledgerMovement.findMany({
      where: {
        organizationId: user.organizationId,
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
        ...(branchFilter ? { branchId: { in: branchFilter } } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.from || query.to
          ? {
              occurredAt: {
                ...(query.from ? { gte: query.from } : {}),
                ...(query.to ? { lte: query.to } : {}),
              },
            }
          : {}),
      },
      select: movementSelect,
      orderBy: { occurredAt: 'desc' },
    });
  }

  async summaryForEmployee(user: AuthenticatedUser, employeeId: string) {
    this.assertStaffReadCapability(user);
    await this.employeesService.get(user, employeeId);
    return this.computeSummary(user.organizationId, employeeId);
  }

  // -------------------------------------------------------------------
  // Autoservicio — nunca confía en un employeeId externo (§7)
  // -------------------------------------------------------------------

  async listForSelf(user: AuthenticatedUser) {
    const employeeId = this.requireOwnEmployeeId(user);
    return this.prisma.ledgerMovement.findMany({
      where: { organizationId: user.organizationId, employeeId },
      select: movementSelect,
      orderBy: { occurredAt: 'desc' },
    });
  }

  async summaryForSelf(user: AuthenticatedUser) {
    const employeeId = this.requireOwnEmployeeId(user);
    return this.computeSummary(user.organizationId, employeeId);
  }

  // -------------------------------------------------------------------
  // Aprobación / rechazo / reversa / reemplazo
  // -------------------------------------------------------------------

  async approve(user: AuthenticatedUser, movementId: string) {
    const movement = await this.getOwnedMovement(user, movementId);
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Solo se pueden aprobar movimientos pendientes de aprobación.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ledgerMovement.update({
        where: { id: movementId },
        data: {
          status: 'POSTED',
          approvedByUserId: user.userId,
          approvedAt: new Date(),
        },
        select: movementSelect,
      });
      await this.audit(tx, user, 'movement.approve', movement, updated);
      return updated;
    });
  }

  async reject(
    user: AuthenticatedUser,
    movementId: string,
    dto: RejectMovementDto,
  ) {
    const movement = await this.getOwnedMovement(user, movementId);
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Solo se pueden rechazar movimientos pendientes de aprobación.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ledgerMovement.update({
        where: { id: movementId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: dto.reason,
        },
        select: movementSelect,
      });
      await this.audit(tx, user, 'movement.reject', movement, updated);
      return updated;
    });
  }

  async reverse(
    user: AuthenticatedUser,
    movementId: string,
    dto: ReverseMovementDto,
  ) {
    const movement = await this.getOwnedMovement(user, movementId);
    if (movement.status !== 'POSTED') {
      throw new BadRequestException(
        'Solo se pueden revertir movimientos aplicados (POSTED).',
      );
    }

    // El saldo se calcula solo sobre movimientos POSTED (§6): basta con
    // sacar el original de ese estado para que el saldo se corrija solo.
    // NO se crea un movimiento opuesto adicional — eso restaría el monto
    // dos veces (una por excluir el original, otra por el nuevo abono/cargo
    // "espejo"). El registro linked de reversa/reemplazo real es el flujo
    // de `replace()`, que sí agrega una fila nueva.
    return this.prisma.$transaction(async (tx) => {
      const reversedOriginal = await tx.ledgerMovement.update({
        where: { id: movementId },
        data: { status: 'REVERSED', reversalReason: dto.reason },
        select: movementSelect,
      });
      await this.audit(
        tx,
        user,
        'movement.reverse',
        movement,
        reversedOriginal,
      );
      return reversedOriginal;
    });
  }

  async replace(
    user: AuthenticatedUser,
    movementId: string,
    dto: ReplaceMovementDto,
  ) {
    const movement = await this.getOwnedMovement(user, movementId);
    if (movement.status !== 'POSTED') {
      throw new BadRequestException(
        'Solo se pueden reemplazar movimientos aplicados (POSTED).',
      );
    }
    const existingReplacement = await this.findByIdempotencyKey(
      user.organizationId,
      dto.idempotencyKey,
    );
    if (existingReplacement) return existingReplacement;

    const category = await this.prisma.movementCategory.findFirst({
      where: {
        id: dto.categoryId,
        organizationId: user.organizationId,
        active: true,
      },
    });
    if (!category)
      throw new NotFoundException('Categoría no encontrada o inactiva.');
    if (category.requiresNote && !dto.note?.trim()) {
      throw new BadRequestException('Esta categoría requiere una nota.');
    }

    return this.prisma.$transaction(async (tx) => {
      const reversedOriginal = await tx.ledgerMovement.update({
        where: { id: movementId },
        data: { status: 'REVERSED', reversalReason: dto.reason },
        select: movementSelect,
      });
      const replacement = await tx.ledgerMovement.create({
        data: {
          organizationId: user.organizationId,
          branchId: movement.branchId,
          employeeId: movement.employeeId,
          categoryId: dto.categoryId,
          direction: category.direction,
          amountCents: dto.amountCents,
          concept: dto.concept,
          occurredAt: dto.occurredAt ?? new Date(),
          status: 'POSTED',
          createdByUserId: user.userId,
          idempotencyKey: dto.idempotencyKey,
          originalMovementId: movementId,
          metadata: dto.note ? { note: dto.note } : undefined,
        },
        select: movementSelect,
      });
      await this.audit(tx, user, 'movement.replace', movement, replacement);
      return { original: reversedOriginal, replacement };
    });
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  private async computeSummary(organizationId: string, employeeId: string) {
    const posted = await this.prisma.ledgerMovement.groupBy({
      by: ['direction'],
      where: { organizationId, employeeId, status: 'POSTED' },
      _sum: { amountCents: true },
    });
    const balanceCents = this.netCents(posted);

    const pending = await this.prisma.ledgerMovement.groupBy({
      by: ['direction'],
      where: { organizationId, employeeId, status: 'PENDING_APPROVAL' },
      _sum: { amountCents: true },
    });
    const pendingApprovalCents = this.netCents(pending);

    const byCategory = await this.prisma.ledgerMovement.groupBy({
      by: ['categoryId'],
      where: {
        organizationId,
        employeeId,
        status: 'POSTED',
        direction: 'CHARGE',
      },
      _sum: { amountCents: true },
    });
    const categories = byCategory.length
      ? await this.prisma.movementCategory.findMany({
          where: { id: { in: byCategory.map((c) => c.categoryId) } },
          select: { id: true, label: true, colorToken: true, iconName: true },
        })
      : [];
    const breakdown = byCategory
      .map((c) => {
        const category = categories.find((cat) => cat.id === c.categoryId);
        if (!category) return null;
        return {
          categoryId: category.id,
          label: category.label,
          colorToken: category.colorToken,
          iconName: category.iconName,
          amountCents: c._sum.amountCents ?? 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.amountCents - a.amountCents);

    return { balanceCents, pendingApprovalCents, breakdown };
  }

  private netCents(
    rows: {
      direction: MovementDirection;
      _sum: { amountCents: number | null };
    }[],
  ) {
    const charge =
      rows.find((r) => r.direction === 'CHARGE')?._sum.amountCents ?? 0;
    const credit =
      rows.find((r) => r.direction === 'CREDIT')?._sum.amountCents ?? 0;
    return charge - credit;
  }

  private async resolveInitialStatus(
    organizationId: string,
    category: {
      requiresApproval: boolean;
      approvalThresholdCents: number | null;
    },
    amountCents: number,
  ): Promise<MovementStatus> {
    if (category.requiresApproval) return 'PENDING_APPROVAL';
    if (category.approvalThresholdCents != null) {
      return amountCents > category.approvalThresholdCents
        ? 'PENDING_APPROVAL'
        : 'POSTED';
    }
    const settings = await this.prisma.organizationSettings.findUnique({
      where: { organizationId },
      select: { approvalThresholdCents: true },
    });
    const orgThreshold =
      settings?.approvalThresholdCents ?? DEFAULT_APPROVAL_THRESHOLD_CENTS;
    return amountCents > orgThreshold ? 'PENDING_APPROVAL' : 'POSTED';
  }

  private isBackdated(occurredAt: Date, now: Date): boolean {
    return (
      this.startOfUtcDay(occurredAt).getTime() <
      this.startOfUtcDay(now).getTime()
    );
  }

  private startOfUtcDay(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private requireOwnEmployeeId(user: AuthenticatedUser): string {
    if (!user.employeeId) {
      throw new NotFoundException('Tu usuario no tiene un empleado vinculado.');
    }
    return user.employeeId;
  }

  private assertStaffReadCapability(user: AuthenticatedUser): void {
    const allowed =
      roleHasCapability(user.role, 'movement.read.branch') ||
      roleHasCapability(user.role, 'movement.read.all');
    if (!allowed) {
      throw new ForbiddenException(
        'No tienes permiso para consultar movimientos.',
      );
    }
  }

  private async getOwnedMovement(user: AuthenticatedUser, movementId: string) {
    const movement = await this.prisma.ledgerMovement.findFirst({
      where: { id: movementId, organizationId: user.organizationId },
    });
    if (!movement) throw new NotFoundException('Movimiento no encontrado.');
    const scopeIds = accessibleBranchIds(user);
    if (scopeIds && !scopeIds.includes(movement.branchId)) {
      throw new NotFoundException('Movimiento no encontrado.');
    }
    return movement;
  }

  private findByIdempotencyKey(organizationId: string, idempotencyKey: string) {
    return this.prisma.ledgerMovement.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId, idempotencyKey },
      },
      select: movementSelect,
    });
  }

  private async audit(
    tx: Prisma.TransactionClient | PrismaService,
    user: AuthenticatedUser,
    action: string,
    before: unknown,
    after: unknown,
  ) {
    await tx.auditLog.create({
      data: {
        organizationId: user.organizationId,
        actorUserId: user.userId,
        action,
        entityType: 'LedgerMovement',
        entityId: (after as { id: string }).id,
        beforeSnapshot: before
          ? (JSON.parse(JSON.stringify(before)) as Prisma.InputJsonValue)
          : undefined,
        afterSnapshot: JSON.parse(
          JSON.stringify(after),
        ) as Prisma.InputJsonValue,
      },
    });
  }
}
