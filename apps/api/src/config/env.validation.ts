import * as Joi from 'joi';

/**
 * Validación de variables de entorno al arrancar (§9, §16). Si falta una
 * variable obligatoria, la app falla con un mensaje claro y NUNCA imprime
 * valores/secretos.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_URL: Joi.string().uri().required(),
  API_PUBLIC_URL: Joi.string().uri().required(),
  CORS_ORIGINS: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  REFRESH_TOKEN_TTL: Joi.string().default('30d'),
  COOKIE_DOMAIN: Joi.string().required(),
  COOKIE_SECURE: Joi.boolean().default(false),

  DEFAULT_TIMEZONE: Joi.string().default('America/Tijuana'),
  DEFAULT_CURRENCY: Joi.string().default('MXN'),

  S3_ENDPOINT: Joi.string().optional().allow(''),
  S3_REGION: Joi.string().optional().allow(''),
  S3_BUCKET: Joi.string().optional().allow(''),
  S3_ACCESS_KEY: Joi.string().optional().allow(''),
  S3_SECRET_KEY: Joi.string().optional().allow(''),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(true),
  MAX_UPLOAD_MB: Joi.number().default(10),

  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().optional().allow(''),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASSWORD: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().optional().allow(''),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
});
