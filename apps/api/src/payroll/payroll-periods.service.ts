import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { roleHasCapability } from '@libreta/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/authenticated-request';
import type { CreatePeriodDto } from './dto/create-period.dto';

@Injectable()
export class PayrollPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreatePeriodDto) {
    if (dto.endsAt.getTime() <= dto.startsAt.getTime()) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la de inicio.',
      );
    }
    const overlapping = await this.prisma.payrollPeriod.findFirst({
      where: {
        organizationId: user.organizationId,
        startsAt: { lt: dto.endsAt },
        endsAt: { gt: dto.startsAt },
      },
    });
    if (overlapping) {
      throw new BadRequestException(
        'Ya existe un periodo de nómina que se traslapa con estas fechas.',
      );
    }
    return this.prisma.payrollPeriod.create({
      data: {
        organizationId: user.organizationId,
        frequency: dto.frequency,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        payDate: dto.payDate,
      },
    });
  }

  async list(user: AuthenticatedUser) {
    this.assertPayrollCapability(user);
    return this.prisma.payrollPeriod.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { startsAt: 'desc' },
    });
  }

  async close(user: AuthenticatedUser, periodId: string) {
    const period = await this.getOwned(user, periodId);
    if (period.status === 'CLOSED') {
      throw new BadRequestException('El periodo ya está cerrado.');
    }
    const unfinishedBatch = await this.prisma.payrollBatch.findFirst({
      where: {
        periodId,
        status: { notIn: ['APPLIED', 'CLOSED'] },
      },
    });
    if (unfinishedBatch) {
      throw new BadRequestException(
        'Hay lotes de este periodo que aún no están aplicados o cerrados.',
      );
    }
    return this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'CLOSED' },
    });
  }

  async getOwned(user: AuthenticatedUser, periodId: string) {
    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: periodId, organizationId: user.organizationId },
    });
    if (!period) throw new NotFoundException('Periodo no encontrado.');
    return period;
  }

  assertPayrollCapability(user: AuthenticatedUser): void {
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
