import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { roleHasCapability, type Capability } from '@libreta/shared';
import { CAPABILITY_KEY } from '../decorators/require-capability.decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Autoriza según @RequireCapability(...). Corre después de JwtAuthGuard
 * (necesita request.user ya poblado). Si el handler no declara capacidad
 * requerida, deja pasar (rutas de solo-autenticación).
 */
@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Capability | undefined>(
      CAPABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !roleHasCapability(user.role, required)) {
      throw new ForbiddenException(
        'No tienes permiso para realizar esta acción.',
      );
    }
    return true;
  }
}
