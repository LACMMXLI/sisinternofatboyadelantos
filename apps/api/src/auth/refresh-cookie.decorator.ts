import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { REFRESH_COOKIE_NAME } from './tokens.service';

/**
 * Extrae la cookie de refresh token de forma tipada (cookie-parser expone
 * `Request.cookies` como `any`; este decorator evita propagar ese `any`
 * hacia los servicios).
 */
export const RefreshCookie = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const value: unknown = request.cookies?.[REFRESH_COOKIE_NAME];
    return typeof value === 'string' ? value : undefined;
  },
);
