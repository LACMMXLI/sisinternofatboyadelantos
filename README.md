# Libreta de Nóminas

Aplicación web que reemplaza la libreta física de adelantos, comidas,
consumos y descuentos de empleados: registro rápido, saldos correctos
calculados en servidor, control de acceso por rol/sucursal, trazabilidad
completa y preparación de descuentos para nómina.

> **No es** un sistema de cálculo fiscal de nómina: no calcula sueldo, ISR,
> IMSS, horas trabajadas ni timbrado. Lleva la libreta de adeudos/consumos y
> prepara los montos que después se aplican en la nómina.

Especificación completa:
[`PROMPT_MAESTRO_LIBRETA_NOMINAS_CLAUDE_CODE.md`](PROMPT_MAESTRO_LIBRETA_NOMINAS_CLAUDE_CODE.md).
Plan de implementación y estado de avance:
[`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Stack

NestJS 11 + Prisma 6 + PostgreSQL · React 19 + Vite + TypeScript + Tailwind
CSS v4 · pnpm workspaces · Docker/Coolify para despliegue.

## Estructura

```text
apps/api/       NestJS — API REST /api/v1
apps/web/       React + Vite — interfaz
packages/shared/ Vocabulario compartido (roles, capacidades, catálogos)
docs/            Arquitectura, permisos, reglas del ledger, despliegue
infra/           Nginx y scripts de despliegue
```

Ver [`docs/architecture.md`](docs/architecture.md) para el detalle.

## Requisitos

- Node.js ≥ 20, pnpm ≥ 9 (`corepack enable` recomendado).
- PostgreSQL 14+ accesible (nativo o vía `docker-compose.yml`).
- Docker (opcional en desarrollo, obligatorio para desplegar).

## Puesta en marcha local

```bash
pnpm install
```

1. Copia `.env.example` a `apps/api/.env` y ajusta `DATABASE_URL` a tu
   PostgreSQL (local o el de `docker-compose.yml`, puerto host `5433` por
   defecto para no chocar con un PostgreSQL nativo en `5432`).
2. Genera el cliente Prisma y aplica las migraciones:

   ```bash
   pnpm --filter api run prisma:generate
   pnpm --filter api run prisma:migrate
   ```

3. Arranca ambas apps en paralelo:

   ```bash
   pnpm dev
   ```

   O por separado: `pnpm dev:api` (puerto 3000) / `pnpm dev:web` (puerto
   5173, proxy de `/api` hacia `localhost:3000`).

4. Swagger disponible en `http://localhost:3000/api/docs` (desactivado en
   producción). Salud: `http://localhost:3000/health/live` y `/health/ready`.

## Comandos de calidad

```bash
pnpm lint        # lint de todos los paquetes
pnpm typecheck   # chequeo de tipos de todos los paquetes
pnpm build       # build de apps/api y apps/web
pnpm test        # pruebas unitarias/e2e de todos los paquetes
pnpm --filter api run test:e2e            # e2e del backend (usa DATABASE_URL real)
pnpm --filter web run capture:viewports   # capturas Playwright en los 4 viewports obligatorios
```

## Docker (desarrollo)

```bash
docker compose up -d postgres minio
```

Levanta PostgreSQL (puerto host `5433` por defecto) y MinIO. Si ya tienes
PostgreSQL nativo, puedes omitir el servicio `postgres` y apuntar
`DATABASE_URL` directamente a tu instancia.

## Despliegue

Ver [`docs/deployment.md`](docs/deployment.md). Ningún despliegue real se
ejecuta sin autorización explícita del usuario.

## Estado actual

Ver [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — sección de fases —
para qué está implementado y qué sigue.
