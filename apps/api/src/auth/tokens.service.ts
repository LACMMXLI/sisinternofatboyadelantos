import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import type { AppConfig } from '../config/configuration';
import { parseDurationMs } from '../common/utils/duration.util';
import type { AccessTokenPayload } from './token-payload';

export const REFRESH_COOKIE_NAME = 'refresh_token';

/**
 * Emisión y rotación de tokens (§9, §13):
 * - Access token: JWT corto, devuelto en el cuerpo de la respuesta. El
 *   frontend lo guarda en memoria (nunca localStorage) y lo manda en
 *   Authorization: Bearer.
 * - Refresh token: cadena aleatoria opaca (NO JWT). Solo se guarda su hash
 *   SHA-256 en RefreshSession; el valor crudo viaja en una cookie
 *   HttpOnly/Secure/SameSite. Rotar en cada uso; revocar en logout.
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const auth = this.configService.get('auth', { infer: true });
    return this.jwtService.signAsync(payload, {
      secret: auth.accessTokenSecret,
      // Segundos (número), no cadena: evita el tipo de plantilla `StringValue`
      // de la librería `ms` que exige un literal específico en compilación.
      expiresIn: Math.floor(parseDurationMs(auth.accessTokenTtl) / 1000),
    });
  }

  generateRefreshToken(): {
    token: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const auth = this.configService.get('auth', { infer: true });
    const token = randomBytes(48).toString('base64url');
    const tokenHash = this.hashRefreshToken(token);
    const expiresAt = new Date(
      Date.now() + parseDurationMs(auth.refreshTokenTtl),
    );
    return { token, tokenHash, expiresAt };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
    const auth = this.configService.get('auth', { infer: true });
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: auth.cookieSecure,
      sameSite: 'lax',
      domain: auth.cookieDomain === 'localhost' ? undefined : auth.cookieDomain,
      path: '/api/v1/auth',
      expires: expiresAt,
    });
  }

  clearRefreshCookie(res: Response): void {
    const auth = this.configService.get('auth', { infer: true });
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: auth.cookieSecure,
      sameSite: 'lax',
      domain: auth.cookieDomain === 'localhost' ? undefined : auth.cookieDomain,
      path: '/api/v1/auth',
    });
  }
}
