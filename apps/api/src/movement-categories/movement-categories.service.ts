import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateMovementCategoryDto } from './dto/create-movement-category.dto';
import type { UpdateMovementCategoryDto } from './dto/update-movement-category.dto';
import type { ListMovementCategoriesQueryDto } from './dto/list-movement-categories.dto';

@Injectable()
export class MovementCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: ListMovementCategoriesQueryDto) {
    return this.prisma.movementCategory.findMany({
      where: {
        organizationId,
        ...(query.includeInactive ? {} : { active: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async create(organizationId: string, dto: CreateMovementCategoryDto) {
    try {
      return await this.prisma.movementCategory.create({
        data: {
          organizationId,
          code: dto.code,
          label: dto.label,
          direction: dto.direction,
          iconName: dto.iconName,
          colorToken: dto.colorToken,
          sortOrder: dto.sortOrder ?? 0,
          requiresNote: dto.requiresNote ?? false,
          requiresEvidence: dto.requiresEvidence ?? false,
          requiresApproval: dto.requiresApproval ?? false,
          approvalThresholdCents: dto.approvalThresholdCents,
          dailyLimitCents: dto.dailyLimitCents,
          weeklyLimitCents: dto.weeklyLimitCents,
          maxPerMovementCents: dto.maxPerMovementCents,
          system: false,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una categoría con ese código.');
      }
      throw error;
    }
  }

  async update(
    organizationId: string,
    categoryId: string,
    dto: UpdateMovementCategoryDto,
  ) {
    await this.assertBelongsToOrg(organizationId, categoryId);
    try {
      return await this.prisma.movementCategory.update({
        where: { id: categoryId },
        data: {
          code: dto.code,
          label: dto.label,
          iconName: dto.iconName,
          colorToken: dto.colorToken,
          sortOrder: dto.sortOrder,
          requiresNote: dto.requiresNote,
          requiresEvidence: dto.requiresEvidence,
          requiresApproval: dto.requiresApproval,
          approvalThresholdCents: dto.approvalThresholdCents,
          dailyLimitCents: dto.dailyLimitCents,
          weeklyLimitCents: dto.weeklyLimitCents,
          maxPerMovementCents: dto.maxPerMovementCents,
          active: dto.active,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una categoría con ese código.');
      }
      throw error;
    }
  }

  async setActive(organizationId: string, categoryId: string, active: boolean) {
    const category = await this.assertBelongsToOrg(organizationId, categoryId);
    if (category.system && !active) {
      throw new BadRequestException(
        'Las categorías del sistema no se pueden desactivar.',
      );
    }
    return this.prisma.movementCategory.update({
      where: { id: categoryId },
      data: { active },
    });
  }

  private async assertBelongsToOrg(organizationId: string, categoryId: string) {
    const category = await this.prisma.movementCategory.findFirst({
      where: { id: categoryId, organizationId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada.');
    return category;
  }
}
