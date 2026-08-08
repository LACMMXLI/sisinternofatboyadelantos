import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { generateTempPassword } from '../common/utils/temp-password.util';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

const userListSelect = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  role: true,
  active: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  branchAccess: {
    select: { branch: { select: { id: true, name: true, code: true } } },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: userListSelect,
      orderBy: { displayName: 'asc' },
    });
  }

  async create(organizationId: string, dto: CreateUserDto) {
    await this.assertBranchesBelongToOrg(organizationId, dto.branchIds);

    const tempPassword = generateTempPassword();
    const passwordHash = await argon2.hash(tempPassword);

    try {
      const user = await this.prisma.user.create({
        data: {
          organizationId,
          username: dto.username,
          email: dto.email,
          displayName: dto.displayName,
          role: dto.role,
          passwordHash,
          mustChangePassword: true,
          branchAccess:
            dto.role !== 'OWNER_ADMIN' && dto.branchIds?.length
              ? { create: dto.branchIds.map((branchId) => ({ branchId })) }
              : undefined,
        },
        select: userListSelect,
      });
      return { user, tempPassword };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un usuario con ese nombre de usuario.',
        );
      }
      throw error;
    }
  }

  async update(organizationId: string, userId: string, dto: UpdateUserDto) {
    await this.assertBelongsToOrg(organizationId, userId);
    if (dto.branchIds) {
      await this.assertBranchesBelongToOrg(organizationId, dto.branchIds);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.branchIds) {
        await tx.userBranch.deleteMany({ where: { userId } });
        if (dto.branchIds.length > 0) {
          await tx.userBranch.createMany({
            data: dto.branchIds.map((branchId) => ({ userId, branchId })),
          });
        }
      }
      return tx.user.update({
        where: { id: userId },
        data: {
          email: dto.email,
          displayName: dto.displayName,
          role: dto.role,
          active: dto.active,
        },
        select: userListSelect,
      });
    });
  }

  async setActive(
    organizationId: string,
    userId: string,
    active: boolean,
    actingUserId: string,
  ) {
    if (userId === actingUserId && !active) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta.');
    }
    await this.assertBelongsToOrg(organizationId, userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { active },
      select: userListSelect,
    });
    if (!active) {
      await this.revokeAllSessions(userId);
    }
    return user;
  }

  async resetPassword(organizationId: string, userId: string) {
    await this.assertBelongsToOrg(organizationId, userId);
    const tempPassword = generateTempPassword();
    const passwordHash = await argon2.hash(tempPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.revokeAllSessions(userId);
    return { tempPassword };
  }

  async logoutAll(organizationId: string, userId: string) {
    await this.assertBelongsToOrg(organizationId, userId);
    await this.revokeAllSessions(userId);
    return { success: true };
  }

  private async revokeAllSessions(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async assertBelongsToOrg(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
  }

  private async assertBranchesBelongToOrg(
    organizationId: string,
    branchIds?: string[],
  ) {
    if (!branchIds || branchIds.length === 0) return;
    const count = await this.prisma.branch.count({
      where: { id: { in: branchIds }, organizationId },
    });
    if (count !== branchIds.length) {
      throw new BadRequestException(
        'Una o más sucursales no pertenecen a este negocio.',
      );
    }
  }
}
