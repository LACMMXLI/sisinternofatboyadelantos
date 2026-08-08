# Permisos y RBAC

Fuente normativa: `PROMPT_MAESTRO_LIBRETA_NOMINAS_CLAUDE_CODE.md §5`.

## Principio

La autorización real vive **siempre en el backend**: cada consulta Prisma se
acota por `organizationId` y, cuando aplica, por sucursal. El frontend usa
`PermissionGate` solo para no renderizar controles que el usuario no podría
usar — nunca como mecanismo de seguridad. Nunca se confía en un
`organizationId`, `employeeId` o `branchId` enviado por el cliente sin
validarlo contra la sesión del usuario autenticado.

## Roles

| Rol | Alcance |
|---|---|
| `OWNER_ADMIN` | Acceso total al negocio: sucursales, usuarios, empleados, categorías, permisos, periodos, reportes, configuración, auditoría. |
| `PAYROLL_MANAGER` | Empleados/movimientos de todas las sucursales autorizadas; prepara, exporta, aplica y cierra lotes de nómina. |
| `GENERAL_MANAGER` | Todas las sucursales asignadas; administra empleados operativos, aprueba movimientos, reportes operativos. |
| `BRANCH_MANAGER` | Solo empleados de sus sucursales; registra, consulta, corrige y aprueba dentro de su alcance. |
| `CASHIER_RECORDER` | Flujo rápido de registro en su sucursal; sin reportes globales, configuración, nómina completa ni otras sucursales. |
| `EMPLOYEE_SELF_SERVICE` | Solo su propio expediente/saldo/movimientos; no puede enumerar ni consultar a otros empleados. |

## Capacidades

Definidas en [`packages/shared/src/capabilities.ts`](../packages/shared/src/capabilities.ts)
y usadas para construir los guards del backend:

`organization.manage`, `branch.manage`, `user.manage`, `employee.read`,
`employee.manage`, `movement.create`, `movement.read.own`,
`movement.read.branch`, `movement.read.all`, `movement.approve`,
`movement.reverse`, `movement.replace`, `movement.backdate`,
`category.manage`, `payroll.prepare`, `payroll.apply`, `payroll.close`,
`payroll.reopen`, `report.read`, `audit.read`, `settings.manage`.

El mapa rol → capacidades vive en `ROLE_CAPABILITIES` (mismo archivo) y es
la única fuente de verdad compartida entre API y web para qué puede hacer
cada rol.

## Pruebas obligatorias (Fase 2 y Fase 4)

- Un empleado no puede consultar el expediente de otro cambiando la URL o
  el ID (`GET /employees/:id`, `GET /me/ledger` con `employeeId` ajeno).
- Un cajero no puede cerrar nómina ni consultar auditoría global.
- Las consultas de movimientos/empleados de una sucursal no filtran datos
  de otra sucursal ni de otra organización, incluso manipulando query params.
