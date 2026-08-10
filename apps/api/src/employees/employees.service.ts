import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { accessibleBranchIds } from '../common/scope/branch-scope.util';
import type { AuthenticatedUser } from '../common/types/authenticated-request';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';
import type { ListEmployeesQueryDto } from './dto/list-employees.dto';

const employeeSelect = {
  id: true,
  employeeNumber: true,
  firstName: true,
  lastName: true,
  displayName: true,
  jobTitle: true,
  photoObjectKey: true,
  hireDate: true,
  active: true,
  baseSalaryCents: true,
  primaryBranchId: true,
  createdAt: true,
  primaryBranch: { select: { id: true, name: true, code: true } },
  additionalBranches: {
    select: { branch: { select: { id: true, name: true, code: true } } },
  },
} satisfies Prisma.EmployeeSelect;

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, query: ListEmployeesQueryDto) {
    const scopeIds = accessibleBranchIds(user);
    if (query.branchId && scopeIds && !scopeIds.includes(query.branchId)) {
      // Sucursal fuera del alcance del usuario: se responde como lista vacía
      // en vez de 403, para no confirmar/negar la existencia del recurso.
      return [];
    }

    const branchFilter = query.branchId ? [query.branchId] : scopeIds;

    const where: Prisma.EmployeeWhereInput = {
      organizationId: user.organizationId,
      ...(query.active !== undefined ? { active: query.active } : {}),
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
      ...(query.search
        ? {
            AND: [
              {
                OR: [
                  {
                    firstName: { contains: query.search, mode: 'insensitive' },
                  },
                  { lastName: { contains: query.search, mode: 'insensitive' } },
                  {
                    displayName: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    employeeNumber: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };

    return this.prisma.employee.findMany({
      where,
      select: employeeSelect,
      orderBy: { displayName: 'asc' },
    });
  }

  async get(user: AuthenticatedUser, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: user.organizationId },
      select: employeeSelect,
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado.');
    this.assertVisible(user, employee);
    return employee;
  }

  async create(organizationId: string, dto: CreateEmployeeDto) {
    await this.assertBranchesBelongToOrg(organizationId, [
      dto.primaryBranchId,
      ...(dto.additionalBranchIds ?? []),
    ]);

    const displayName =
      dto.displayName?.trim() || `${dto.firstName} ${dto.lastName}`.trim();

    try {
      return await this.prisma.employee.create({
        data: {
          organizationId,
          employeeNumber: dto.employeeNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          displayName,
          jobTitle: dto.jobTitle,
          hireDate: dto.hireDate,
          baseSalaryCents: dto.baseSalaryCents,
          primaryBranchId: dto.primaryBranchId,
          additionalBranches: dto.additionalBranchIds?.length
            ? {
                create: dto.additionalBranchIds
                  .filter((id) => id !== dto.primaryBranchId)
                  .map((branchId) => ({ branchId })),
              }
            : undefined,
        },
        select: employeeSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un empleado con ese número de empleado.',
        );
      }
      throw error;
    }
  }

  async update(
    organizationId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ) {
    await this.assertBelongsToOrg(organizationId, employeeId);

    const branchIdsToCheck = [
      ...(dto.primaryBranchId ? [dto.primaryBranchId] : []),
      ...(dto.additionalBranchIds ?? []),
    ];
    if (branchIdsToCheck.length) {
      await this.assertBranchesBelongToOrg(organizationId, branchIdsToCheck);
    }

    const displayName =
      dto.displayName?.trim() ||
      (dto.firstName && dto.lastName
        ? `${dto.firstName} ${dto.lastName}`.trim()
        : undefined);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.additionalBranchIds) {
          await tx.employeeBranch.deleteMany({ where: { employeeId } });
          const primaryId = dto.primaryBranchId;
          const toCreate = dto.additionalBranchIds.filter(
            (id) => id !== primaryId,
          );
          if (toCreate.length > 0) {
            await tx.employeeBranch.createMany({
              data: toCreate.map((branchId) => ({ employeeId, branchId })),
            });
          }
        }
        return tx.employee.update({
          where: { id: employeeId },
          data: {
            employeeNumber: dto.employeeNumber,
            firstName: dto.firstName,
            lastName: dto.lastName,
            displayName,
            jobTitle: dto.jobTitle,
            hireDate: dto.hireDate,
            baseSalaryCents: dto.baseSalaryCents,
            primaryBranchId: dto.primaryBranchId,
            active: dto.active,
          },
          select: employeeSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un empleado con ese número de empleado.',
        );
      }
      throw error;
    }
  }

  async setActive(organizationId: string, employeeId: string, active: boolean) {
    await this.assertBelongsToOrg(organizationId, employeeId);
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { active },
      select: employeeSelect,
    });
  }

  private assertVisible(
    user: AuthenticatedUser,
    employee: {
      primaryBranchId: string;
      additionalBranches: { branch: { id: string } }[];
    },
  ) {
    if (user.branchIds === 'ALL') return;
    const accessible = new Set(user.branchIds);
    const employeeBranchIds = [
      employee.primaryBranchId,
      ...employee.additionalBranches.map((b) => b.branch.id),
    ];
    const visible = employeeBranchIds.some((id) => accessible.has(id));
    if (!visible) throw new NotFoundException('Empleado no encontrado.');
  }

  private async assertBelongsToOrg(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado.');
  }

  private async assertBranchesBelongToOrg(
    organizationId: string,
    branchIds: string[],
  ) {
    const uniqueIds = [...new Set(branchIds)];
    if (uniqueIds.length === 0) return;
    const count = await this.prisma.branch.count({
      where: { id: { in: uniqueIds }, organizationId },
    });
    if (count !== uniqueIds.length) {
      throw new BadRequestException(
        'Una o más sucursales no pertenecen a este negocio.',
      );
    }
  }
}
