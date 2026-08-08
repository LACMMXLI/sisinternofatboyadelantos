import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { accessibleBranchIds } from '../common/scope/branch-scope.util';
import type { AuthenticatedUser } from '../common/types/authenticated-request';
import type { CreateBranchDto } from './dto/create-branch.dto';
import type { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser) {
    const ids = accessibleBranchIds(user);
    return this.prisma.branch.findMany({
      where: {
        organizationId: user.organizationId,
        ...(ids ? { id: { in: ids } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(organizationId: string, dto: CreateBranchDto) {
    try {
      return await this.prisma.branch.create({
        data: {
          organizationId,
          code: dto.code,
          name: dto.name,
          address: dto.address,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una sucursal con ese código.');
      }
      throw error;
    }
  }

  async update(organizationId: string, branchId: string, dto: UpdateBranchDto) {
    await this.assertBelongsToOrg(organizationId, branchId);
    try {
      return await this.prisma.branch.update({
        where: { id: branchId },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una sucursal con ese código.');
      }
      throw error;
    }
  }

  async setActive(organizationId: string, branchId: string, active: boolean) {
    await this.assertBelongsToOrg(organizationId, branchId);
    return this.prisma.branch.update({
      where: { id: branchId },
      data: { active },
    });
  }

  private async assertBelongsToOrg(organizationId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organizationId },
      select: { id: true },
    });
    if (!branch) throw new NotFoundException('Sucursal no encontrada.');
  }
}
