/**
 * Config tipada derivada de variables de entorno ya validadas por
 * env.validation.ts. Acceder siempre vía ConfigService, nunca leer
 * process.env directamente fuera de este archivo.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  appUrl: string;
  apiPublicUrl: string;
  corsOrigins: string[];
  database: {
    url: string;
  };
  auth: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenTtl: string;
    refreshTokenTtl: string;
    cookieDomain: string;
    cookieSecure: boolean;
  };
  locale: {
    timezone: string;
    currency: string;
  };
  storage: {
    endpoint?: string;
    region?: string;
    bucket?: string;
    accessKey?: string;
    secretKey?: string;
    forcePathStyle: boolean;
    maxUploadMb: number;
  };
  smtp: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    from?: string;
  };
  logLevel: string;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  appUrl: process.env.APP_URL!,
  apiPublicUrl: process.env.API_PUBLIC_URL!,
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  database: {
    url: process.env.DATABASE_URL!,
  },
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? '30d',
    cookieDomain: process.env.COOKIE_DOMAIN ?? 'localhost',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
  locale: {
    timezone: process.env.DEFAULT_TIMEZONE ?? 'America/Tijuana',
    currency: process.env.DEFAULT_CURRENCY ?? 'MXN',
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || undefined,
    bucket: process.env.S3_BUCKET || undefined,
    accessKey: process.env.S3_ACCESS_KEY || undefined,
    secretKey: process.env.S3_SECRET_KEY || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 10),
  },
  smtp: {
    host: process.env.SMTP_HOST || undefined,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASSWORD || undefined,
    from: process.env.SMTP_FROM || undefined,
  },
  logLevel: process.env.LOG_LEVEL ?? 'info',
});
