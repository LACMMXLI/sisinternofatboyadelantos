import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca una ruta como accesible sin sesión (login, refresh, health…). Todo
 * lo demás requiere access token válido por defecto (guard global).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
