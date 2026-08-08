# Despliegue

> Estado: esqueleto de Fase 1. Se completa con el detalle final (dominios
> reales, política de respaldo probada, rollback) en la Fase 8, una vez que
> exista algo desplegable de extremo a extremo. No se ha ejecutado ningún
> despliegue real; estas son las instrucciones para cuando el usuario lo
> autorice explícitamente.

## Estrategia de origen

Recomendado: **mismo origen**. Un dominio sirve el frontend (contenedor
`web`, Nginx) y reenvía `/api` al contenedor `api` dentro de la red interna
de Coolify (ver [`infra/nginx/web.conf`](../infra/nginx/web.conf)):

- `https://libreta.midominio.com` → sirve el frontend y reenvía `/api`.

Si Coolify requiere dominios separados, se documentará aquí el ajuste
necesario de `CORS_ORIGINS`, `COOKIE_DOMAIN` y `COOKIE_SECURE` para:

- `https://libreta.midominio.com` (frontend)
- `https://api-libreta.midominio.com` (API)

Estos dominios son **placeholders**: no se usan como valores finales sin
confirmación explícita del usuario.

## Contenedores

- [`apps/api/Dockerfile`](../apps/api/Dockerfile): multi-stage (deps → build
  → runtime Alpine, usuario no root, healthcheck sobre `/health/live`).
  Build desde la raíz del monorepo: `docker build -f apps/api/Dockerfile .`
- [`apps/web/Dockerfile`](../apps/web/Dockerfile): multi-stage (build Vite →
  Nginx sirviendo estáticos). Build desde la raíz:
  `docker build -f apps/web/Dockerfile .`
- [`docker-compose.yml`](../docker-compose.yml): PostgreSQL + MinIO para
  desarrollo/local. Si ya tienes PostgreSQL nativo, puedes omitir el
  servicio `postgres` del compose y apuntar `DATABASE_URL` directamente
  (el puerto host por defecto del compose es `5433` para no chocar con un
  PostgreSQL nativo en `5432`).

## Variables de entorno

Ver [`.env.example`](../.env.example) para la lista completa y cuáles son
opcionales (SMTP y S3/MinIO pueden quedar vacíos en desarrollo; el backend
falla al arrancar con un mensaje claro si falta una variable obligatoria).

## Migraciones

- Desarrollo: `pnpm --filter api run prisma:migrate` (`prisma migrate dev`).
- Producción: `pnpm --filter api run prisma:deploy` (`prisma migrate
  deploy`) — **nunca** `prisma db push` en producción.

## Primer propietario

Pendiente de Fase 2 (aún no existe `AuthModule`/seed de producción). Se
documentará aquí el comando/flujo para crear el primer `OWNER_ADMIN` sin
exponer contraseñas en logs.

## Pasos de despliegue en Coolify (pendiente de completar en Fase 8)

1. Crear PostgreSQL y MinIO como servicios en Coolify.
2. Crear los servicios `web` y `api` desde este repositorio (build por
   Dockerfile, contexto = raíz del repo).
3. Configurar dominios y red interna entre `web` y `api`.
4. Definir las variables de entorno (ver `.env.example`).
5. Ejecutar `prisma migrate deploy`.
6. Crear el primer propietario (`OWNER_ADMIN`).
7. Verificar `GET /health/ready` → `200`.
8. Configurar persistencia y copias de seguridad de PostgreSQL/MinIO.
9. Probar una restauración en un entorno separado.
10. Documentar la estrategia de actualización y rollback.

## Copias de seguridad

Pendiente de definir en Fase 8: respaldo diario, retención definida,
ubicación distinta al disco principal del servidor, y prueba periódica de
restauración real (no basta con que el script "aparente" funcionar).
