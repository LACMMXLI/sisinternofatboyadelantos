import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from './tokens.service';
import type { AccessTokenPayload } from './token-payload';
import type { Role } from '@libreta/shared';
import type { LoginDto } from './dto/login.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { QuickUnlockDto } from './dto/quick-unlock.dto';

const GENERIC_LOGIN_ERROR = 'Usuario o contraseña incorrectos.';

export interface SessionUserView {
  id: string;
  displayName: string;
  username: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  mustChangePassword: boolean;
  employeeId: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findFirst({
      where: {
        active: true,
        OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }],
      },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const passwordOk = await argon2
      .verify(user.passwordHash, dto.password)
      .catch(() => false);
    if (!passwordOk) {
      throw new UnauthorizedException(GENERIC_LOGIN_ERROR);
    }

    const branchIds = await this.resolveBranchIds(user.id, user.role);
    const employeeId = await this.resolveEmployeeId(user.id);

    const accessToken = await this.issueAccessToken({
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      branchIds,
      employeeId,
    });
    await this.issueRefreshSession(user.id, res);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      user: this.toSessionView(user, user.organization.name, employeeId),
    };
  }

  async refresh(refreshTokenCookie: string | undefined, res: Response) {
    if (!refreshTokenCookie) {
      throw new UnauthorizedException(
        'Sesión expirada. Inicia sesión de nuevo.',
      );
    }

    const tokenHash = this.tokens.hashRefreshToken(refreshTokenCookie);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      this.tokens.clearRefreshCookie(res);
      throw new UnauthorizedException(
        'Sesión expirada. Inicia sesión de nuevo.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: { organization: true },
    });

    if (!user || !user.active) {
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      this.tokens.clearRefreshCookie(res);
      throw new UnauthorizedException(
        'Sesión expirada. Inicia sesión de nuevo.',
      );
    }

    // Rotación: revoca la sesión usada y emite una nueva enlazada.
    const newSessionId = await this.rotateRefreshSession(
      session.id,
      user.id,
      res,
    );
    this.logger.debug(
      `Refresh rotado para usuario ${user.id} (sesión ${newSessionId}).`,
    );

    const branchIds = await this.resolveBranchIds(user.id, user.role);
    const employeeId = await this.resolveEmployeeId(user.id);

    const accessToken = await this.issueAccessToken({
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      branchIds,
      employeeId,
    });

    return {
      accessToken,
      user: this.toSessionView(user, user.organization.name, employeeId),
    };
  }

  async logout(refreshTokenCookie: string | undefined, res: Response) {
    if (refreshTokenCookie) {
      const tokenHash = this.tokens.hashRefreshToken(refreshTokenCookie);
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.tokens.clearRefreshCookie(res);
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async me(userId: string): Promise<SessionUserView> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { organization: true },
    });
    const employeeId = await this.resolveEmployeeId(userId);
    return this.toSessionView(user, user.organization.name, employeeId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const currentOk = await argon2
      .verify(user.passwordHash, dto.currentPassword)
      .catch(() => false);
    if (!currentOk) {
      throw new UnauthorizedException('La contraseña actual no es correcta.');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    return { success: true };
  }

  async quickUnlock(
    refreshTokenCookie: string | undefined,
    dto: QuickUnlockDto,
    res: Response,
  ) {
    if (!refreshTokenCookie) {
      throw new UnauthorizedException(
        'Este dispositivo no tiene una sesión previa válida.',
      );
    }
    const tokenHash = this.tokens.hashRefreshToken(refreshTokenCookie);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Este dispositivo no tiene una sesión previa válida.',
      );
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: { organization: true },
    });

    if (!user.active) {
      throw new UnauthorizedException('Cuenta desactivada.');
    }
    if (!user.pinHash) {
      throw new ForbiddenException('Este usuario no tiene un PIN configurado.');
    }

    const pinOk = await argon2.verify(user.pinHash, dto.pin).catch(() => false);
    if (!pinOk) {
      throw new UnauthorizedException('PIN incorrecto.');
    }

    // Rota también el refresh token en cada desbloqueo rápido (defensa en
    // profundidad: igual que un refresh normal).
    await this.rotateRefreshSession(session.id, user.id, res);

    const branchIds = await this.resolveBranchIds(user.id, user.role);
    const employeeId = await this.resolveEmployeeId(user.id);
    const accessToken = await this.issueAccessToken({
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      branchIds,
      employeeId,
    });

    return {
      accessToken,
      user: this.toSessionView(user, user.organization.name, employeeId),
    };
  }

  private async issueAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.tokens.signAccessToken(payload);
  }

  private async issueRefreshSession(
    userId: string,
    res: Response,
  ): Promise<string> {
    const { token, tokenHash, expiresAt } = this.tokens.generateRefreshToken();
    const session = await this.prisma.refreshSession.create({
      data: { userId, tokenHash, expiresAt },
    });
    this.tokens.setRefreshCookie(res, token, expiresAt);
    return session.id;
  }

  private async rotateRefreshSession(
    oldSessionId: string,
    userId: string,
    res: Response,
  ): Promise<string> {
    const { token, tokenHash, expiresAt } = this.tokens.generateRefreshToken();
    const [, newSession] = await this.prisma.$transaction([
      this.prisma.refreshSession.update({
        where: { id: oldSessionId },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshSession.create({
        data: { userId, tokenHash, expiresAt },
      }),
    ]);
    await this.prisma.refreshSession.update({
      where: { id: oldSessionId },
      data: { replacedById: newSession.id },
    });
    this.tokens.setRefreshCookie(res, token, expiresAt);
    return newSession.id;
  }

  private async resolveBranchIds(
    userId: string,
    role: Role,
  ): Promise<string[] | 'ALL'> {
    if (role === 'OWNER_ADMIN') return 'ALL';
    const access = await this.prisma.userBranch.findMany({
      where: { userId },
      select: { branchId: true },
    });
    return access.map((a) => a.branchId);
  }

  private async resolveEmployeeId(userId: string): Promise<string | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
    return employee?.id ?? null;
  }

  private toSessionView(
    user: {
      id: string;
      displayName: string;
      username: string;
      role: Role;
      organizationId: string;
      mustChangePassword: boolean;
    },
    organizationName: string,
    employeeId: string | null = null,
  ): SessionUserView {
    return {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
      organizationId: user.organizationId,
      organizationName,
      mustChangePassword: user.mustChangePassword,
      employeeId,
    };
  }
}
