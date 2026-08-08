# IMPLEMENTATION_PLAN.md — Libreta de Nóminas

> Plan verificable derivado de `PROMPT_MAESTRO_LIBRETA_NOMINAS_CLAUDE_CODE.md`. Este documento es la fuente de seguimiento del desarrollo: cada fase tiene tareas, entregables y criterios de verificación explícitos. Se actualiza conforme avanza el trabajo (checkboxes).

---

## 0. Estado del repositorio al iniciar

- Repositorio vacío salvo el prompt maestro. No es un repositorio Git todavía.
- Las 3 imágenes de referencia (`01-116794.png`, `02-116797.png`, `03-116795.png`) fueron mostradas en el chat; en cuanto el usuario las coloque en el repo se guardarán en `docs/references/` como copia definitiva. Mientras tanto se usa la descripción visual exhaustiva de la sección 4 del prompt maestro + lo observado directamente en las capturas (encabezado azul degradado, buscador, lista de empleados con saldo, "libreta" central con espiral y hoja de líneas, panel derecho de saldo con desglose por categoría y anillo de dona, grid de accesos rápidos de colores, bottom nav con iconos grandes).
- Decisión por defecto (no bloqueante, siguiendo la regla "opción más simple, segura y coherente"): se inicializa Git localmente al arrancar Fase 1 (commits locales, sin `push`, sin remoto) para poder revertir con seguridad. Si el usuario prefiere lo contrario, se puede omitir.
- Nombre/color de negocio semilla: **"Fatboy"**, azul de marca `--brand-600 #0F67E8` como color primario configurable — tal como indica el documento, no hardcodeado de forma irreversible (vive en `Organization.name` / `primaryColor`).

---

## 1. Alcance confirmado (resumen ejecutivo)

Aplicación web full-stack ("Libreta de Nóminas") que digitaliza la libreta física de adelantos/consumos/descuentos de empleados: registro rápido de movimientos, saldo confiable calculado en servidor, preparación de descuentos para nómina (sin calcular nómina fiscal), roles con alcance por sucursal, autoservicio del empleado, PWA con cola offline segura, y despliegue Docker/Coolify en servidor propio.

**Explícitamente fuera de alcance:** cálculo de sueldo, ISR, IMSS, horas trabajadas, timbrado fiscal.

---

## 2. Stack y restricciones no negociables (confirmadas, sin desviación)

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL |
| ORM/migraciones | Prisma |
| Frontend | React + Vite + TypeScript |
| Estilos | Tailwind CSS (sin Bootstrap) |
| Monorepo | pnpm workspaces |
| API | REST, documentada con OpenAPI/Swagger |
| Dinero | enteros en centavos (`amountCents`), nunca `float` |
| TZ / moneda | `America/Tijuana` / `MXN` |
| Idioma UI | español de México |
| Almacenamiento de archivos | compatible S3 (MinIO en servidor propio) |
| Autenticación | real, sesiones revocables, sin tokens en `localStorage` |

---

## 3. Estructura del monorepo (a crear en Fase 1)

```text
/
  apps/
    api/                  # NestJS
    web/                  # React + Vite
  packages/
    shared/                # tipos/constantes/DTO-schemas Zod compartidos
  infra/
    nginx/
    scripts/
  docs/
    references/            # imágenes 01/02/03 + notas de diseño
    architecture.md
    deployment.md
    permissions.md
    ledger-rules.md
  docker-compose.yml
  pnpm-workspace.yaml
  package.json
  .env.example
  README.md
  IMPLEMENTATION_PLAN.md
```

`packages/eslint-config` y `packages/tsconfig` solo se crean si en la práctica evitan duplicación real (regla de "evitar dependencias/paquetes innecesarios").

---

## 4. Modelo de datos (Prisma) — entidades y responsabilidad

Resumen ejecutable; el detalle completo de columnas vive en `PROMPT_MAESTRO...md §10` y se traduce 1:1 a `schema.prisma`.

`Organization → Branch → (User, Employee)`, `User ↔ Branch` (N:M acceso), `User ↔ Employee` (1:1 opcional, autoservicio), `MovementCategory`, `LedgerMovement` (núcleo contable, con `originalMovementId` para reversas/reemplazos), `MovementAttachment`, `MovementAcknowledgement`/`MovementDispute`, `PayrollPeriod → PayrollBatch → PayrollBatchItem`, `SettlementAllocation` (liquidación parcial cargo↔crédito), `RefreshSession`, `Notification`, `AuditLog` (solo insert), `OrganizationSettings`.

**Regla dura:** el saldo **no** es un campo mutable único. Se calcula del ledger (`suma cargos POSTED − suma abonos POSTED`) o se mantiene una proyección transaccional con comando de reconciliación verificable contra el ledger — con prueba automatizada que lo demuestre.

Checklist de esta fase:
- [ ] `schema.prisma` completo con los índices descritos (organización+empleado+fecha, organización+sucursal+fecha, estado, categoría) y unicidad `organizationId + idempotencyKey`.
- [ ] Migraciones generadas y aplicables desde cero (`prisma migrate dev` en local, `migrate deploy` documentado para producción).
- [ ] Seed idempotente de desarrollo (ver §14).

---

## 5. RBAC — matriz de capacidades

Roles: `OWNER_ADMIN`, `PAYROLL_MANAGER`, `GENERAL_MANAGER`, `BRANCH_MANAGER`, `CASHIER_RECORDER`, `EMPLOYEE_SELF_SERVICE`.

Se implementa como **capacidades** (`employee.read`, `movement.create`, `movement.reverse`, `payroll.close`, `audit.read`, etc.) + guard que valida `organizationId` y alcance de sucursal en cada consulta — nunca confiando en IDs enviados por el cliente. `docs/permissions.md` documenta la matriz rol→capacidad completa antes de escribir los guards.

Prueba obligatoria y explícita: empleado A no puede leer/mutar el expediente de empleado B cambiando la URL o el ID (se codifica como test de integración, no solo manual).

---

## 6. Reglas del ledger (resumen ejecutable → `docs/ledger-rules.md`)

- Cargo (`CHARGE`) aumenta el pendiente; abono (`CREDIT`) lo reduce; el importe capturado siempre es positivo, la categoría define la dirección (snapshot en el movimiento, controlado por servidor).
- `saldo_pendiente = Σ cargos POSTED − Σ abonos POSTED`, calculado en servidor.
- Pendiente de aprobación / sincronización se muestra por separado, nunca mezclado silenciosamente.
- Presentación del saldo: `> 0` → "Pendiente por descontar"; `= 0` → "Sin saldo pendiente"; `< 0` → "Saldo a favor" (nunca `-$-50`).
- El saldo no se reinicia por semana; se arrastra hasta que haya abonos reales.
- Estados: `PENDING_APPROVAL → POSTED → REVERSED/REJECTED`. Nunca borrado físico de un `POSTED`.
- Corrección = reversa enlazada (motivo, usuario, fecha) + reemplazo, todo en una transacción; "editar último" solo dentro de ventana configurable, mismo autor, no aplicado a nómina, con permiso.
- Idempotencia: UUID + `idempotencyKey` generado por cliente, único por organización; altas/reversas/cierres de lote en transacciones Postgres; conflictos concurrentes → `409` legible.

---

## 7. API REST (`/api/v1`) — mapa de endpoints

Confirmado tal cual `PROMPT_MAESTRO...md §11`: `auth/*`, `employees/*` (+ `me/ledger` para autoservicio sin aceptar `employeeId` externo), `movements/*` (incluye `sync-batch` offline), `movement-categories/*`, `payroll-batches/*` (+ periodos, export csv/xlsx/pdf), reportes, administración (sucursales/usuarios/ajustes/categorías), `audit-logs`, `notifications`, `health/live`, `health/ready`.

Formato de error único (`statusCode`, `code`, `message`, `fieldErrors`, `requestId`) documentado en Swagger con ejemplos reales por endpoint, no genéricos.

---

## 8. Sistema visual — resumen ejecutable → `docs/architecture.md` (sección UI)

- Tokens CSS/Tailwind de la paleta del prompt maestro (`--canvas`, `--brand-*`, `--success`, `--danger`, `--warning`, `--purple`, `--pink`, sombras y radios especificados).
- Tipografías: Manrope/Inter para UI vía Fontsource (paquete local, no CDN); Patrick Hand solo para títulos/anotaciones manuscritas de la hoja y el total, nunca en tablas/formularios/montos.
- Iconos: `lucide-react` exclusivamente, sin emojis funcionales.
- Layout escritorio de 3 columnas (280–320 / ≥560 / 300–340 px, máx. ~1600 px), tablet con drawer, móvil 1 columna con FAB "Nuevo movimiento" y sheets.
- Componentes reutilizables listados en §4.7 del prompt maestro (`AppHeader`, `NotebookShell`, `MovementRow`, `BalanceCard`, `QuickMovementGrid`, `OfflineBanner`, etc.) — se construyen como piezas de librería interna en `apps/web/src/components`, no una página monolítica.
- Verificación visual obligatoria en 4 viewports (1440×1000, 1024×768, 768×1024, 390×844) con capturas Playwright antes de dar por cerrada cualquier pantalla importante.

---

## 9. Fases de implementación (orden fijo del prompt maestro §19)

Cada fase se cierra solo si pasa lint + typecheck + tests + build, y deja el sistema operable de extremo a extremo (no solo compilando).

### Fase 1 — Base técnica ✅ (completada 2026-08-08)
- [x] Monorepo pnpm, ESLint/Prettier/TS estrictos, `.env.example`, Docker Compose local (Postgres + MinIO opcional), `Dockerfile` esqueleto api/web.
- [x] Prisma inicializado, conexión a Postgres, `health/live` y `health/ready` (verificado contra PostgreSQL real, `/health/ready` responde `database: up`).
- [x] Tokens Tailwind/CSS, layout base de 3 columnas (≥1280px, colapsa a 1 columna antes), rutas placeholder protegidas por sesión (aún sin lógica real).
- **Verificación:** `pnpm install` ✅, `pnpm lint` ✅ (3/3 paquetes), `pnpm typecheck` ✅, `pnpm build` ✅, `pnpm test` ✅, `pnpm --filter api run test:e2e` ✅ (2/2, contra Postgres real), capturas Playwright en los 4 viewports sin scroll horizontal ✅.
- **Nota de entorno:** en este equipo se usa un PostgreSQL nativo del usuario (no el `postgres` del `docker-compose.yml`, cuyo puerto host por defecto se movió a `5433` para evitar el choque). `DATABASE_URL` real vive solo en `apps/api/.env` (gitignored).

### Fase 2 — Identidad y acceso
- [ ] `OrganizationsModule`, `BranchesModule`, `UsersModule`, sesiones (access corto + refresh rotatorio revocable, cookie `HttpOnly`/`Secure`/`SameSite`), Argon2id, rate limiting en login/PIN.
- [ ] RBAC con capacidades + guards por `organizationId`/sucursal.
- [ ] Login real en frontend, cambio de contraseña obligatorio, navegación por rol.
- **Verificación:** tests de aislamiento entre organizaciones/sucursales; login/logout/refresh funcionando de punta a punta.

### Fase 3 — Empleados y categorías
- [ ] `EmployeesModule` (alta/edición/baja lógica, fotos vía storage, sucursales múltiples), `MovementCategoriesModule` con reglas de inmutabilidad de dirección.
- [ ] `EmployeeSearch`, `EmployeeList`, `EmployeeIdentityCard` reales conectados a API.
- **Verificación:** búsqueda tolerante, filtro por sucursal/estado, un cajero solo ve empleados de su(s) sucursal(es).

### Fase 4 — Ledger principal (pantalla insignia)
- [ ] `LedgerModule` completo: crear/listar/resumir/aprobar/rechazar/revertir/reemplazar, idempotencia, auditoría, umbral de aprobación.
- [ ] Pantalla principal ("libreta") con calidad visual alta desde esta fase: `NotebookShell`, `MovementRow`, `BalanceCard`, `CategoryBreakdown`, `QuickMovementGrid`, `NewMovementSheet`, `MoneyInput`.
- **Verificación:** casos de idempotencia (mismo movimiento 2 veces = un efecto), reversa mantiene historial y corrige saldo, saldo parcial se arrastra, pendiente/rechazado no afecta saldo confirmado.

### Fase 5 — Nómina
- [ ] `PayrollPeriodsModule`, `PayrollBatchesModule`, `SettlementAllocation`, exportación CSV/XLSX/PDF, estados `DRAFT→UNDER_REVIEW→LOCKED→APPLIED→CLOSED/REOPENED`.
- **Verificación:** aplicación parcial arrastra el resto; dos aplicaciones simultáneas no sobregiran la asignación; reapertura solo con permiso elevado + motivo + auditoría.

### Fase 6 — Autoservicio y aclaraciones
- [ ] Vista `/mi-libreta`, `movement.acknowledge`, `movement.disputes`, `NotificationsModule` real.
- **Verificación:** un empleado no puede enumerar ni consultar a otro empleado ni por API ni por ruta manipulada.

### Fase 7 — PWA/offline e impresión
- [ ] Manifest, service worker, `OfflineBanner`, `PendingSyncBadge`, cola IndexedDB con idempotencyKey, `movements/sync-batch`.
- [ ] CSS `@media print` para recibos 58/80mm y resumen carta/A4.
- **Verificación:** prueba de duplicación/reintento offline→online sin duplicar cargos.

### Fase 8 — Calidad y entrega
- [ ] `ReportsModule` completo con filtros y export.
- [ ] Suite E2E Playwright (los 10 escenarios del prompt maestro §15) + capturas en los 4 viewports.
- [ ] Hardening de seguridad (Helmet, CSP, saneo de exports contra CSV injection, revisión de logs sin secretos).
- [ ] Dockerfiles multi-stage finales, `docs/deployment.md` con guía Coolify paso a paso.

---

## 10. Pruebas — resumen de cobertura obligatoria

Backend (unit + integración contra Postgres de prueba): saldo, límites, permisos, idempotencia, concurrencia en asignación, reversa, aislamiento organización/sucursal, IDOR. Frontend: formularios críticos, estados loading/vacío/error/offline/sin-permiso, formato de dinero/fecha. E2E: los 10 flujos listados en el prompt maestro §15, incluyendo verificación de cero scroll horizontal en los 4 viewports.

---

## 11. Seguridad — checklist de cierre (no se marca "terminado" sin esto)

- [ ] Argon2id en contraseñas y PIN.
- [ ] Access token corto en memoria + refresh rotatorio en cookie `HttpOnly/Secure/SameSite`, protección CSRF.
- [ ] Rate limiting login/PIN/recuperación/exportaciones.
- [ ] Todas las queries Prisma acotadas por `organizationId`; nunca confiar en `organizationId`/`createdByUserId`/dirección contable enviados por el cliente.
- [ ] CSP, Helmet, logs sin secretos, `.env.example` sin valores reales.
- [ ] Export sanitiza celdas que empiecen con `=`, `+`, `-`, `@`.

---

## 12. Despliegue (Fase 8, detallado en `docs/deployment.md`)

Dockerfiles multi-stage (`apps/api`, `apps/web`), `docker-compose.yml` local con Postgres + MinIO, `prisma migrate deploy` (nunca `db push` en prod), seed de producción separado para primer propietario, variables de entorno completas (lista del prompt maestro §16), same-origin recomendado (`/api` proxy) con alternativa de dominios separados documentada (CORS/cookies), política real de respaldo (diario, retención, ubicación distinta, prueba de restauración periódica) — no una copia que "aparente" funcionar.

---

## 13. Riesgos y decisiones por defecto ya tomadas

| Decisión | Elegido | Motivo |
|---|---|---|
| Inicializar Git local | Sí, sin remoto ni push | Reversibilidad segura del trabajo, no requiere autorización (no es acción de red) |
| Nombre/color semilla | "Fatboy", azul `#0F67E8` | Configurable, no hardcodeado; coincide con el ejemplo del documento |
| MinIO en dev | Docker Compose opcional; si no está disponible, adaptador local de disco con el mismo contrato | El documento lo permite explícitamente |
| SMTP en dev | No configurado; flujo administrativo de contraseña temporal como respaldo | El documento lo exige como alternativa válida |
| Dominios de despliegue | Placeholder documentado, sin usarlos como valores finales | El documento prohíbe fijarlos sin confirmación |

**Bloqueante real pendiente (no se puede resolver por defecto):** dominio(s) definitivos y credenciales de un despliegue Coolify **real** solo se necesitan hasta la Fase 8 si se desea ejecutar el despliegue de verdad; no bloquean el desarrollo.

---

## 14. Datos de desarrollo (seed)

Idempotente, solo dev: 1 negocio demo, sucursales Venecia/San Marcos/Américas, un usuario por rol con contraseña temporal documentada solo en README de desarrollo, 6–10 empleados ficticios claramente marcados como demo (iniciales/avatares abstractos, sin rostros generados ni copiar nombres/fotos de las imágenes de referencia), categorías iniciales, movimientos distribuidos en fechas/estados, un periodo con lote en borrador. Nunca se ejecuta automáticamente en producción.

---

## 15. Criterios de aceptación

Se usa literalmente la lista de 23 puntos del prompt maestro §18 como checklist final antes de declarar la entrega terminada (no se duplica aquí; ver el documento original).

---

## 16. Próximo paso inmediato

Arrancar **Fase 1** tal como está descrita en §9: scaffolding del monorepo, Docker Compose local, Prisma inicial, tokens visuales y layout base. Al cerrar cada fase se reporta: qué se implementó, resultado de lint/typecheck/tests/build, y qué sigue — sin declarar nada terminado sin haberlo ejecutado y verificado.
