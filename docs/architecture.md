# Arquitectura

Ver también [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md) para el plan
por fases, y [permissions.md](permissions.md) / [ledger-rules.md](ledger-rules.md)
para las reglas de negocio.

## Monorepo

```text
/
  apps/
    api/      # NestJS 11 + Prisma 6 (PostgreSQL) — REST /api/v1
    web/      # React 19 + Vite + TypeScript + Tailwind CSS v4
  packages/
    shared/   # @libreta/shared: roles, capacidades, catálogos, sin lógica de servidor sensible
  infra/
    nginx/    # config de referencia para servir el SPA y reenviar /api
    scripts/  # scripts de despliegue (Fase 8)
  docs/       # este documento y las guías de permisos/ledger/despliegue
```

Gestionado con **pnpm workspaces** (`pnpm-workspace.yaml`). Un único
`pnpm-lock.yaml` en la raíz fija las versiones de todo el monorepo.

## Backend (`apps/api`)

- **NestJS 11** + TypeScript, `ValidationPipe` global (`whitelist`,
  `forbidNonWhitelisted`, `transform`), filtro global de excepciones con
  formato de error consistente (`AllExceptionsFilter`), Helmet, CORS
  configurado por `CORS_ORIGINS`, `ThrottlerModule` global (120 req/min por
  defecto), correlación de requests (`X-Request-Id`) vía middleware.
- **Prisma 6** (generador clásico `prisma-client-js`) contra PostgreSQL.
  `PrismaService` es el único punto de acceso a datos (`PrismaModule`
  global). El esquema completo vive en `apps/api/prisma/schema.prisma`.
- **Configuración validada al arrancar**: `src/config/env.validation.ts`
  (Joi) + `src/config/configuration.ts` (config tipada). Si falta una
  variable obligatoria, la app falla con un mensaje claro sin imprimir
  secretos.
- **Swagger** en `/api/docs` (desactivado automáticamente cuando
  `NODE_ENV=production`).
- **Salud**: `GET /health/live` (proceso vivo) y `GET /health/ready`
  (PostgreSQL responde), sin prefijo `/api` ni versión — son para el
  orquestador (Docker/Coolify), documentados en `src/health/`.
- Prefijo de API: `/api/v1` (`setGlobalPrefix('api')` + versionado URI).

Módulos previstos (se agregan módulo por módulo en las fases 2 a 8):
`AuthModule`, `OrganizationsModule`, `BranchesModule`, `UsersModule`,
`EmployeesModule`, `MovementCategoriesModule`, `LedgerModule`,
`PayrollPeriodsModule`, `PayrollBatchesModule`, `ReportsModule`,
`FilesModule`, `NotificationsModule`, `AuditModule`, `SettingsModule`,
`HealthModule` (ya implementado).

## Frontend (`apps/web`)

- **React 19 + Vite + TypeScript**, Tailwind CSS v4 (tokens definidos vía
  `@theme` en `src/index.css`, valores base en `src/styles/tokens.css`).
- **React Router** para rutas por rol (`src/app/router.tsx`).
- **TanStack Query** para datos remotos (`QueryProvider`); estado de sesión
  vía `AuthProvider` (stub hasta la Fase 2).
- **React Hook Form + Zod** para formularios (se usan a partir de la Fase 2).
- **Lucide React** para iconografía; **Fontsource** para Manrope (UI) y
  Patrick Hand (títulos manuscritos de la hoja), empaquetados localmente.
- Cliente HTTP mínimo en `src/lib/api/client.ts`: cookies `credentials:
  'include'`, nunca `localStorage` para tokens.
- Layout: `AppShell` (header + contenido + nav inferior), estructura de 3
  columnas en `/app/libreta` a partir de `xl` (≥1280px); una sola columna
  antes de eso, según §4.6 del prompt maestro.
- QA visual: `apps/web/scripts/capture-viewports.mjs` (Playwright) genera
  capturas en los 4 viewports obligatorios y falla si detecta scroll
  horizontal — `pnpm --filter web run capture:viewports`.

## `packages/shared`

Vocabulario compartido sin lógica de servidor sensible: `Role`,
`Capability` + `ROLE_CAPABILITIES`, direcciones/estados/categorías del
ledger, estados de lote de nómina. Tanto `apps/api` como `apps/web` lo
consumen como `@libreta/shared` (workspace dependency) para no duplicar
strings mágicos entre frontend y backend.

## Datos y saldo

Ver [ledger-rules.md](ledger-rules.md). Resumen: el saldo se calcula del
ledger en el servidor, nunca se confía en un campo `balance` mutable único,
todo movimiento publicado es inmutable (correcciones = reversa + reemplazo).

## Entornos y variables

`.env.example` en la raíz documenta todas las variables. En desarrollo cada
app lee su propio `.env` (p. ej. `apps/api/.env`); en producción se inyectan
desde Coolify. Ver [deployment.md](deployment.md).
