import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';
import type { AccessTokenPayload } from '../../auth/token-payload';
import type { AppConfig } from '../../config/configuration';

/**
 * Guard global (§9, §13): toda ruta requiere un access token Bearer válido
 * salvo que esté marcada con @Public(). No se golpea la base de datos aquí
 * — el access token es de vida corta y las sesiones se revocan a nivel de
 * refresh token (ver AuthService).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Sesión requerida.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret: this.configService.get('auth', { infer: true })
            .accessTokenSecret,
        },
      );
      request.user = {
        userId: payload.sub,
        organizationId: payload.organizationId,
        role: payload.role,
        branchIds: payload.branchIds,
        employeeId: payload.employeeId,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }
  }

  private extractBearerToken(
    request: AuthenticatedRequest,
  ): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length).trim() || undefined;
  }
}
