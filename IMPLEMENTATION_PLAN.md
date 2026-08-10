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

**Explícitamente fuera de alcance:** cálculo fiscal de nómina — ISR, IMSS, horas trabajadas, timbrado fiscal.

> **Corrección 2026-08-09 (decisión del usuario):** el sueldo del empleado **sí se captura** (`Employee.baseSalaryCents`, por periodo de nómina). El negocio adelanta el sueldo semanal en efectivo día a día (adelantos/consumos anotados en la libreta) y necesita, al corte de cada empleado, saber cuánto le queda por entregar — eso requiere conocer el sueldo, no solo los descuentos. Lo que sigue fuera de alcance es el **cálculo fiscal**: el "neto a pagar" es una resta simple (sueldo − descuentos), nunca ISR/IMSS/timbrado. Ver `PayrollBatchItem.baseSalaryCents`/`netPayCents`, el PDF de nómina y `BalanceCard` (neto estimado + aviso si el saldo ya supera el sueldo).

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

### Fase 2 — Identidad y acceso ✅ (completada 2026-08-08)
- [x] `AuthModule` (login, refresh rotatorio, logout, logout-all, change-password, quick-unlock con PIN), `OrganizationsModule`, `BranchesModule`, `UsersModule`. Argon2id, rate limiting por endpoint (`@Throttle`), access token JWT corto (15m) en memoria del cliente, refresh token opaco (hash SHA-256 almacenado, valor crudo en cookie `HttpOnly`/`SameSite=Lax`, un solo uso con rotación).
- [x] RBAC con capacidades (`@RequireCapability` + `CapabilityGuard`) y alcance de sucursal (`branchIds: 'ALL' | string[]` en el JWT, derivado de `UserBranch`; `OWNER_ADMIN` alcance total).
- [x] Login real en frontend (`AuthProvider`, RHF+Zod), cambio de contraseña obligatorio, navegación inferior filtrada por capacidad del rol, `EMPLOYEE_SELF_SERVICE` enrutado a `/mi-libreta` en vez de `/app/libreta`.
- [x] Pantallas de administración funcionales: Negocio (editar nombre/color/moneda/TZ), Sucursales (crear/(des)activar), Usuarios (crear con contraseña temporal revelada una vez, reset de contraseña, cerrar todas las sesiones, (des)activar).
- **Verificación:** `pnpm --filter api run test:e2e` ✅ 10/10 (login con credenciales incorrectas, `/auth/me`, 401 sin token, 403 sin capacidad, alcance de sucursal del cajero, alcance total del owner, **aislamiento entre 2 organizaciones distintas**, rotación de refresh + revocación del token viejo + logout invalida sesión). QA manual en navegador real: login → cambio de contraseña obligatorio → shell autenticado → sesión persiste tras recargar la página completa → nav filtrado por rol (cajero ve solo Libreta/Empleados) → logout.
- **Bug real encontrado y corregido en QA:** doble llamada a `/auth/refresh` en el arranque (React StrictMode) chocaba con la rotación de un solo uso del refresh token y podía invalidar la sesión; se corrigió deduplicando la llamada en vuelo (`refreshInFlightRef`) en `AuthProvider`.
- **Decisión técnica no anticipada:** `packages/shared` se compila a **dual CJS+ESM** (`dist/cjs`, `dist/esm`, con `package.json` marcador de tipo en cada carpeta) — Vite no interopera de forma confiable con un paquete workspace servido como CommonJS simple vía `/@fs/`; este es el patrón estándar para paquetes consumidos tanto por Nest (CJS) como por Vite (ESM).

### Fase 3 — Empleados y categorías (en progreso)
- [x] `EmployeesModule`: alta/edición/baja lógica, sucursales múltiples (principal + adicionales vía `EmployeeBranch`), búsqueda tolerante (nombre/apellido/número, insensible a mayúsculas), filtro por sucursal y por estado activo/inactivo, capacidades `employee.read`/`employee.manage`, alcance de sucursal aplicado tanto en listado como en lectura individual (`GET /employees/:id`).
- [ ] Fotos de empleado vía storage (S3/MinIO): diferido — no hay `StorageModule` todavía; `photoObjectKey` existe en el modelo pero sin flujo de carga aún.
- [x] `MovementCategoriesModule`: catálogo por organización, capacidad `category.manage` (solo `OWNER_ADMIN`), lectura abierta a cualquier usuario autenticado de la organización (igual que `/branches`, necesaria para registrar movimientos), `direction` inmutable (no existe en `UpdateMovementCategoryDto`; enviarla en `PATCH` dispara 400 por `forbidNonWhitelisted`), filtro `includeInactive`, protección: una categoría `system` no se puede desactivar.
- [x] Seed (`prisma/seed.ts`) carga el catálogo `SYSTEM_MOVEMENT_CATEGORIES` de `@libreta/shared` (11 categorías: adelanto, comida, soda, snack, transporte, otro descuento, devolución, aplicado en nómina, ajustes, saldo inicial) como categorías `system: true`, idempotente.
- [x] `EmpleadosPage`/`EmpleadoDetallePage` (`apps/web/src/features/empleados`) conectados a la API real: búsqueda con debounce (300 ms), filtro por sucursal/estado, alta con sucursal principal + adicionales (chips), edición y baja/reactivación lógica desde el expediente. Botones de gestión ocultos si el rol no tiene `employee.manage` (`roleHasCapability`, solo UI — la autoridad real sigue en el guard del backend).
- [x] `CategoriasPage` conectada a la API real: catálogo completo (`includeInactive=true`), alta con selector de dirección/color/icono (con vista previa), reglas de nota/evidencia/aprobación, (des)activar — botón deshabilitado con tooltip explicativo para categorías `system` activas. Botón "Nueva"/(des)activar ocultos sin `category.manage`.
- [ ] `EmployeeList`/`EmployeeIdentityCard` de la pantalla "Libreta" (§4.5) siguen en `mockData.ts` **a propósito**: dependen de `balanceCents`, que no existe hasta el `LedgerModule` (Fase 4) — conectarlas antes rompería el saldo mostrado. Los componentes de administración (`EmpleadosPage`) son pantallas nuevas y separadas, no una reutilización de esos componentes de la Libreta.
- **Verificación backend:** `pnpm --filter api run lint` ✅, `pnpm --filter api run typecheck` ✅, `pnpm --filter api run build` ✅, `pnpm --filter api run test:e2e` ✅ 25/25 (10 previos + 8 de empleados + 7 de categorías). `pnpm --filter api run seed` ✅ corrido dos veces seguidas sin duplicar ni fallar (upsert real).
- **Verificación frontend:** `pnpm --filter web run typecheck` ✅, `pnpm --filter web run lint` ✅ (oxlint, sin errores nuevos), `pnpm --filter web run build` ✅. QA manual en navegador real contra la API real: crear empleado (sucursal principal + adicional) → aparece en la lista → expediente pre-carga los datos → editar puesto/sucursales → guardar → baja lógica → reactivar, todo confirmado en la UI y por red (`POST/PATCH/GET` 200/201). Catálogo de categorías: las 11 `system` sembradas se listan con icono/color/dirección correctos, sus botones "Desactivar" están deshabilitados (`disabled: true` verificado en el DOM) con tooltip; categoría nueva creada, desactivada y reactivada correctamente. Datos de prueba (`EMP-1001`, `UNIFORME`) limpiados del negocio "Fatboy" al terminar.
- **Decisiones de seguridad/diseño:** (1) filtrar `/employees` por `branchId` fuera del alcance del usuario devuelve lista vacía (200), no 403 — evita confirmar/negar la existencia de una sucursal ajena, mismo criterio que el resto del alcance por sucursal (§5); (2) la inmutabilidad de `direction` se garantiza en el límite de la API (el campo no existe en el DTO de actualización) en vez de aceptarlo y rechazarlo condicionalmente — menos superficie de error; (3) las categorías `system` (sembradas, referenciadas por código fijo en `QuickMovementGrid.tsx`) no se pueden desactivar vía API, para no romper accesos rápidos hardcodeados en el frontend; (4) los tokens de color de categoría (`colorToken`) se restringen en el formulario a los 8 valores conocidos de `MovementCategorySeed` (`apps/web/src/lib/utils/categoryColors.ts`) en vez de texto libre, porque las clases de Tailwind deben existir literalmente en el código fuente para no ser purgadas.

### Prototipo visual de la Libreta (adelantado a pedido del usuario, 2026-08-08) ✅
- [x] A petición explícita del usuario, se adelantó la construcción visual completa de la pantalla insignia (normalmente Fase 4) usando datos de ejemplo (`apps/web/src/features/libreta/mockData.ts`) para validar el parecido con `docs/references/` antes de seguir con más backend.
- [x] Componentes nuevos y fieles a la referencia: `EmployeeList`/`EmployeeListItem`, `EmployeeIdentityCard`, `NotebookShell` + `NotebookRings` + `MovementRow` (libreta con espiral, borde azul, líneas, título/total manuscritos), `BalanceCard` + `CategoryBreakdown`, `QuickMovementGrid` + `QuickMovementTile`, `DonutChart` (SVG propio), `RecentActivityCard`, `WeeklySummaryCard`, `QuickActionsCard`.
- [x] Verificado con captura Playwright autenticada en 3 tamaños (`apps/web/scripts/capture-libreta-authenticated.mjs`) — sin overflow horizontal, match visual alto con `docs/references/ref-01-dashboard-claro-libreta-nominas.png`.
- **Bugs reales encontrados y corregidos en esta pasada:** (1) signo de `balanceCents` invertido en los datos de ejemplo respecto a la regla del §6.1 (positivo = deuda pendiente, no negativo); (2) `initialsFrom` rompía con nombres que llevan paréntesis (p. ej. "Alonso (Propietario)" producía "A(" en vez de "AP") — se corrigió para extraer solo letras Unicode y se deduplicó la función (antes vivía copiada en `AppHeader.tsx`) hacia `lib/utils/avatar.ts`.
- **Resuelto en Fase 4:** estos componentes ya reciben datos reales de `EmployeesModule`/`LedgerModule` — ver la entrada de Fase 4 más abajo. `mockData.ts` sigue en el repo solo como referencia histórica del prototipo, ya no lo importa ninguna pantalla.

### Fase 4 — Ledger principal (pantalla insignia) ✅
- [x] `LedgerModule` (`apps/api/src/ledger`): `POST /movements` (idempotente, snapshot de `direction` desde la categoría, valida nota requerida/límite por movimiento/backdate, decide `POSTED` vs `PENDING_APPROVAL` por `category.requiresApproval` → `category.approvalThresholdCents` → `organizationSettings.approvalThresholdCents`), `GET /movements` (alcance por sucursal), `GET /employees/:id/ledger/summary` + `GET /employees/me/ledger[/summary]` (autoservicio, nunca confía en un `employeeId` externo), `POST /movements/:id/{approve,reject,reverse,replace}`, auditoría (`AuditLog`) en cada mutación.
- [x] Pantalla "Libreta" (`LibretaPage.tsx`) conectada a datos reales de punta a punta — ya no usa `mockData.ts` en ningún widget visible: `EmployeeList` (saldo real por empleado), `NotebookShell`/`MovementRow` (historial real), `BalanceCard`/`CategoryBreakdown` (saldo y desglose real), `QuickMovementGrid` (catálogo real, top 4 por `sortOrder`), `RecentActivityCard`/`WeeklySummaryCard` (derivados del mismo resumen/movimientos reales). Componentes nuevos: `NewMovementSheet` (alta rápida con selector de categoría, `MoneyInput`, nota condicional, aviso de aprobación) y `MoneyInput` (captura en pesos, convierte a centavos enteros).
- **Verificación:** `pnpm run typecheck/lint/build` ✅ en todo el monorepo. `pnpm --filter api run test:e2e` ✅ **35/35** (10 de Fase 4 nuevos en `test/ledger.e2e-spec.ts`: cargo POSTED afecta saldo, idempotencia real —misma llave con monto distinto no duplica ni cambia el efecto—, saldo parcial se arrastra sin llegar a cero, pendiente de aprobación no afecta saldo confirmado, cajero no puede aprobar (403), rechazado no afecta saldo, aprobar aplica el efecto y revertir lo corrige conservando el historial (el original queda `REVERSED`, consultable), revertir dos veces no duplica (400), reemplazo corrige saldo y enlaza el original vía `originalMovementId`, alcance de sucursal). QA manual en navegador contra la API real: alta de empleado → categoría "Adelanto" desde `QuickMovementGrid` → `NewMovementSheet` → `POST /movements` 201 → saldo, desglose, fila de la libreta y actividad reciente se actualizan solos (invalidación de queries), todo confirmado por red y en pantalla.
- **Decisión de diseño (bug real corregido antes de cerrar la fase):** `reverse()` inicialmente creaba además un movimiento de dirección opuesta para "cancelar" el original — como el saldo se calcula solo sobre `POSTED` (§6) y el original ya sale de ese estado al pasar a `REVERSED`, ese movimiento adicional restaba el monto **dos veces**. Se corrigió: revertir solo cambia el estado del original a `REVERSED` (con motivo) y el saldo se corrige solo al excluirlo de la suma; no se crea una fila nueva. La fila nueva sí existe en `replace()` (reemplazo real), que es un caso distinto.
- **Simplificaciones documentadas, no bugs:** (1) `dailyLimitCents`/`weeklyLimitCents` de la categoría no se validan todavía (solo `maxPerMovementCents`) — requeriría ventanas de fecha en huso horario del negocio sin librería de fechas instalada; queda para cuando se implemente con una decisión explícita sobre esa dependencia. (2) El saldo por empleado en `EmployeeList` se resuelve con una consulta de resumen por empleado (`useQueries`, N+1) — razonable para el tamaño actual del catálogo; si se vuelve lento, la solución es un endpoint de resumen en lote, no un rediseño del frontend. (3) `RecentActivityCard`/`WeeklySummaryCard` muestran el saldo/desglose **acumulado actual**, no un corte semanal real (tampoco lo hacía el mock) — llega con reportes reales en Fase 8.

### Corrección de modelo mental — "Libreta del día" (2026-08-09) ✅
- [x] A petición explícita del usuario, se corrigió `LibretaPage` porque se comportaba como dashboard administrativo ("seleccionar empleado → consultar saldo → modal") en vez de libreta diaria real ("abrir la hoja de hoy → ver todo lo anotado → escribir el siguiente renglón → consultar un empleado solo cuando haga falta"). El empleado pasó de ser el dueño de toda la pantalla a ser un dato de cada anotación.
- [x] Backend: `movementSelect` en `LedgerService` (`apps/api/src/ledger/ledger.service.ts`) ahora incluye `employee{id,displayName,employeeNumber}` y `branch{id,name}` — extensión mínima y aditiva de `GET /movements`, ya soportaba `from`/`to`/`branchId`/`status` (§ requisito explícito de reutilizar el endpoint existente sin duplicar el ledger).
- [x] Frontend, componentes nuevos: `DayHeader` (fecha completa en español, navegación día anterior/hoy/siguiente/calendario, selector de sucursal solo si el usuario tiene más de una, estado del día), `DailySheet`/`DailyMovementRow`/`DailyMovementCard` (hoja continua con movimientos de todos los empleados del día, orden cronológico ascendente/descendente, tabla en escritorio/tablet y tarjetas en móvil sin scroll horizontal), `EmployeeCombobox` (búsqueda integrada, sustituye la columna fija de empleados), `MovementCaptureForm`/`QuickCaptureBar`/`MobileCaptureSheet` (captura única reutilizada en escritorio/tablet como franja inline y en móvil como bottom sheet tras el FAB, mismo orden obligatorio empleado→categoría→monto→nota→guardar, "Anotar otro" sin cerrar el flujo), `EmployeeDetailDrawer` (panel lateral con saldo/desglose/historial al pulsar un nombre, no reemplaza la hoja), `RecentEmployeesStrip` (franja compacta opcional de empleados con anotaciones hoy).
- [x] `lib/utils/date.ts` nuevo: límites de día calculados en `America/Tijuana` vía `Intl`, nunca con `toDateString()` del navegador.
- [x] Se retiraron de `/app/libreta` (quedan como código muerto, no se borraron por si se reutilizan): la columna fija de empleados (`EmployeeList`), el donut semanal sobre saldo acumulado (`WeeklySummaryCard`) y las tarjetas `RecentActivityCard`/`QuickActionsCard` que duplicaban información ahora visible en la hoja diaria. `EmployeeIdentityCard` se reutiliza dentro del drawer.
- [x] Acciones reales de aprobar/rechazar/revertir agregadas a la fila (`useApproveMovement`/`useRejectMovement`/`useReverseMovement` nuevos en `features/libreta/api.ts`), visibles solo si la capacidad y el estado del movimiento lo permiten.
- **Verificación:** `pnpm --filter web run typecheck/lint/build` ✅, `pnpm --filter api run typecheck/lint/build` ✅, `pnpm --filter api run test:e2e` ✅ **42/42** sin regresiones. QA manual contra Postgres real (owner, sucursal Venecia): registrar adelanto ($300) y comida ($85) desde la hoja → aparecen sin recargar, cargos del día $385.00, saldo del empleado se actualiza a -$385.00 en el drawer con desglose 78 %/22 %; día anterior muestra 0 anotaciones (confirma que el filtro respeta `America/Tijuana`, no `toDateString()`); 1024×768 y 390×844 sin scroll horizontal; FAB + bottom sheet móvil funcional. Datos de prueba (`QA-9001`) revertidos y empleado desactivado al terminar.
- **Pendiente real, no bloqueante:** paginación/carga incremental de la hoja diaria (aceptable al tamaño actual de un solo negocio; si crece, el endpoint ya soporta `from`/`to` para acotar). Prueba de aprobación con umbral no se ejecutó en esta pasada de UI (sí cubierta por `test/ledger.e2e-spec.ts`).

### Fase 5 — Nómina ✅ (núcleo; exportación diferida)
- [x] `PayrollPeriodsModule` (`apps/api/src/payroll`): crear periodo (rechaza traslapes de fechas), listar, cerrar (bloquea si quedan lotes sin `APPLIED`/`CLOSED`).
- [x] `PayrollBatchesModule`: `prepare` (snapshot del saldo real de cada empleado activo en alcance — vía el mismo cálculo `Σ cargos POSTED − Σ abonos POSTED` del ledger — solo incluye empleados con saldo `> 0`), edición de `plannedAmountCents` por renglón (aplicación parcial), estados `DRAFT→UNDER_REVIEW→LOCKED→APPLIED→CLOSED→REOPENED`, `apply` (crea un movimiento `CREDIT` de la categoría del sistema `PAYROLL_DEDUCTION` por empleado + asignación FIFO trazable contra los cargos `POSTED` más antiguos vía `SettlementAllocation`), `reopen` (revierte los créditos aplicados — mismo mecanismo que `LedgerService.reverse()` — con motivo obligatorio).
- [x] Exportación PDF (`GET /payroll-batches/:id/export/pdf`, a petición explícita del usuario, 2026-08-09): reporte del lote completo con datos de la empresa (nombre + color de marca), periodo/frecuencia/fecha de pago/sucursal/estado, tabla resumen por empleado (saldo al preparar/planeado/aplicado) y detalle por empleado con desglose por categoría — real vía `SettlementAllocation` (FIFO) si el lote ya se aplicó, o "vista previa" desde el saldo pendiente actual si no. Implementado con `pdfkit` (única dependencia nueva de esta fase, sin binarios nativos).
- [x] **Sueldo y neto a pagar (corrección 2026-08-09 #2, decisión del usuario tras revertir la limitación anterior):** el negocio adelanta el sueldo semanal en efectivo y necesita, al corte de cada empleado, saber cuánto le queda por entregar. Se agregó `Employee.baseSalaryCents` (opcional, capturado en alta/edición de empleado) y `PayrollBatchItem.baseSalaryCents`/`netPayCents` (snapshot al preparar el lote o al editar el monto planeado — igual que `balanceAtPrepCents`, no se mueve si el sueldo cambia después). El PDF y `NominaBatchPage` muestran columnas "Sueldo"/"Neto a pagar" cuando algún empleado del lote tiene sueldo capturado; `BalanceCard` (Libreta) muestra "Sueldo del periodo" + "Neto estimado" y un aviso (no bloqueante) cuando el saldo pendiente ya supera el sueldo. Sigue sin calcular ISR/IMSS/timbrado — el neto es una resta simple, rotulada como estimado en toda la UI.
- [ ] Exportación CSV/XLSX: sigue diferida — sin consumidor real todavía (llega con Reportes, Fase 8); XLSX necesitaría otra librería nueva (`exceljs`), CSV es viable sin dependencias cuando haga falta.
- **Verificación:** `pnpm run typecheck/lint/build` ✅ en todo el monorepo. `pnpm --filter api run test:e2e` ✅ **38/38** (3 en `test/payroll.e2e-spec.ts`, incluida la exportación PDF: valida `Content-Type: application/pdf` y el header binario `%PDF-`; cajero sin `payroll.prepare` → 403; aplicación parcial de $100→$60 dejó $40 pendiente, cierre, reapertura con motivo restauró el saldo a $100 y quedó en `AuditLog` con `action: 'payroll.reopen'` y el motivo; dos `apply()` disparados con `Promise.all` sobre el mismo lote — exactamente uno gana (201), el otro se rechaza, y `totalAppliedCents` no se duplicó). QA manual en navegador/curl contra la API real: alta de empleado con $500 de saldo → crear periodo → preparar lote → editar a $300 (parcial) → enviar a revisión → bloquear → aplicar (saldo real bajó a $200, confirmado por API) → cerrar → reabrir con motivo (saldo real volvió a $500, confirmado por API); PDF de un lote de dos categorías descargado y leído página por página para confirmar el contenido real.
- **Bugs reales encontrados durante la propia verificación:** (1) en el test, la primera versión de la prueba de concurrencia asumía que el perdedor de la carrera siempre respondería `409`; en la práctica Node no ejecuta las dos requests realmente en paralelo — la segunda a veces alcanza a ver el lote ya `APPLIED` en el chequeo *fuera* de la transacción y responde `400` en vez de `409`. Ambos son rechazos correctos (ninguno duplica el efecto); se corrigió la prueba para aceptar cualquier código de error ≥ 400 en el perdedor y verificar la invariante real: `totalAppliedCents` no se duplica y solo existe un `LedgerMovement`. (2) En el PDF: sin `bufferPages: true`, `pdfkit` no permite recorrer páginas ya cerradas para numerarlas — `switchToPage` creaba páginas en blanco nuevas en vez de reutilizar las existentes. (3) Escribir el pie de página en la franja del margen inferior default disparaba un salto de página automático de `pdfkit` (interpretaba que el contenido no cupo), generando una página en blanco extra por cada página real — se corrigió anulando `doc.page.margins.bottom` momentáneamente solo para ese trazo. Ambos bugs del PDF se detectaron generando el PDF real y leyéndolo, no solo verificando que la respuesta empezara con `%PDF-`.
- **Decisiones de diseño:** (1) `reopen()` reutiliza el mismo principio que `LedgerService.reverse()` (pasar a `REVERSED` basta, no se crea un movimiento espejo) — evita repetir el bug de doble descuento ya corregido en Fase 4. (2) Las filas de `SettlementAllocation` de un lote reabierto **no se borran** al reabrir: quedan como rastro histórico de qué se alcanzó a asignar, aunque el crédito que las originó ya esté `REVERSED` — esto afecta solo la auditoría, no el cálculo del saldo (que nunca depende de `SettlementAllocation`, solo del estado de `LedgerMovement`). (3) El reclamo atómico de `apply()` (`updateMany({where:{status:'LOCKED'}})` dentro de la transacción, y solo se procede si `count===1`) es lo que realmente previene la doble aplicación concurrente — confirmado con la prueba de `Promise.all`, no solo asumido.

### Fase 6 — Autoservicio y aclaraciones — **fuera de alcance real (decisión del usuario, 2026-08-09)**
- [ ] ~~Vista `/mi-libreta`, `movement.acknowledge`, `movement.disputes`, `NotificationsModule` real.~~
- **Decisión:** el usuario confirmó que el empleado **nunca** interactúa directamente con el sistema — solo el encargado de sucursal y los dueños (él y su socio) capturan y consultan. No se construye la pantalla de autoservicio ni las confirmaciones/aclaraciones del empleado; no hay ahorro real de tiempo en simular una necesidad que no existe.
- **Qué se queda tal cual (no se retira, no cuesta nada dejarlo):** el rol `EMPLOYEE_SELF_SERVICE` y las capacidades `movement.read.own`/`movement.acknowledge`/etc. ya definidas en `@libreta/shared` y el modelo de datos (`MovementAcknowledgement`, `MovementDispute`) — quedan sin UI ni flujo, listos por si el negocio cambia de opinión más adelante, pero no se invierte más tiempo en ellos ahora.
- **Siguiente fase real: Fase 7 (offline/impresión) o Fase 8 (reportes/seguridad/entrega) — a definir con el usuario.**

### Fase 7 — PWA/offline e impresión
- [ ] Manifest, service worker, `OfflineBanner`, `PendingSyncBadge`, cola IndexedDB con idempotencyKey, `movements/sync-batch`.
- [ ] CSS `@media print` para recibos 58/80mm y resumen carta/A4.
- **Verificación:** prueba de duplicación/reintento offline→online sin duplicar cargos.

### Fase 8 — Calidad y entrega (en progreso — reportes ✅, resto pendiente)
- [x] `ReportsModule` (`apps/api/src/reports`): `GET /reports/movements` (filtros por sucursal/empleado/categoría/estado/fecha, totales agregados —cargos/abonos/neto/desglose por categoría—, mismo alcance por sucursal que el resto del sistema), `GET /reports/movements/export.csv` (mismos filtros, saneado contra inyección de fórmulas), `GET /reports/balances` (saldo por empleado activo en alcance, una sola consulta agregada — sin el N+1 que sí es razonable en el frontend de la Libreta). Capacidad `report.read` (único gate — `CASHIER_RECORDER` no la tiene).
- [x] `ReportesPage` conectada a la API real: pestañas Movimientos/Saldos, filtros, tarjetas de totales, tabla, botón "Exportar CSV" (`apiFetchBlob`, mismo mecanismo que el PDF de nómina).
- [ ] Suite E2E Playwright (los 10 escenarios del prompt maestro §15) + capturas en los 4 viewports.
- [ ] Hardening de seguridad final (Helmet ya está desde Fase 1; falta CSP explícito, revisión de logs sin secretos, checklist completo de §11).
- [ ] Dockerfiles multi-stage finales, `docs/deployment.md` con guía Coolify paso a paso.
- **Verificación:** `pnpm run typecheck/lint` ✅ en todo el monorepo, `pnpm --filter web run build` ✅. `pnpm --filter api run test:e2e` ✅ **42/42** (4 nuevos en `test/reports.e2e-spec.ts`: cajero sin `report.read` → 403 en los 3 endpoints, totales correctos con cargo+abono reales, CSV saneado —una celda `=SUM(A1:A10)` sale como `'=SUM(A1:A10)`, no como fórmula ejecutable—, encargado de sucursal no ve movimientos/saldos de una sucursal ajena). QA manual en navegador contra la API real: alta de empleado + adelanto de $450 → aparece en Movimientos con sus totales correctos → aparece en Saldos con el mismo monto → exportar CSV dispara la descarga real (`200 OK` confirmado por red).
- **Decisión de diseño:** el reporte de saldos resuelve el saldo de *todos* los empleados en alcance con una sola consulta `groupBy` agregada, a diferencia del `useQueries` (N+1) que usa `EmployeeList` en la Libreta — ahí el N+1 es razonable porque la lista ya está renderizada de todos modos; aquí, como el reporte existe específicamente para listar a todos, hacerlo en una sola consulta es la solución correcta, no una optimización prematura.

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
