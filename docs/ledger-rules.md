# Reglas del ledger

Fuente normativa: `PROMPT_MAESTRO_LIBRETA_NOMINAS_CLAUDE_CODE.md §6`. Este
documento es la referencia rápida que debe respetar cualquier código que
toque saldos, movimientos o lotes de nómina.

## Significado del saldo

- **Cargo** (`CHARGE`): aumenta lo pendiente — adelanto, comida, soda,
  consumo, transporte, otro descuento por aplicar.
- **Abono** (`CREDIT`): reduce lo pendiente — descuento aplicado en nómina,
  devolución en efectivo, corrección o ajuste a favor.
- El importe capturado (`amountCents`) siempre es positivo; la **categoría**
  determina la dirección, tomada como snapshot en el movimiento.
- Cálculo, siempre en el servidor:

  ```text
  saldo_pendiente = Σ cargos POSTED − Σ abonos POSTED
  ```

- Lo `PENDING_APPROVAL` o pendiente de sincronización se muestra **separado**
  del saldo confirmado, nunca mezclado.
- Presentación (nunca un número confuso como `-$-50`):
  - `> 0` → "Pendiente por descontar: $X"
  - `= 0` → "Sin saldo pendiente"
  - `< 0` → "Saldo a favor: $X"
- El saldo **no** se reinicia por semana: se arrastra hasta que existan
  abonos reales. Los filtros de periodo solo cambian el resumen mostrado.
- Todo cálculo usa `amountCents` entero — nunca `float`.
- Ver [`formatCentsToMXN` / `describeBalance`](../apps/web/src/lib/utils/money.ts)
  para la implementación de presentación en el frontend.

## Categorías

Catálogo inicial en
[`packages/shared/src/movements.ts`](../packages/shared/src/movements.ts)
(`SYSTEM_MOVEMENT_CATEGORIES`). El administrador puede desactivar, reordenar
y crear categorías, pero **no puede cambiar la dirección** de una categoría
que ya tenga movimientos — debe crear una categoría nueva.

## Estados del movimiento

`PENDING_APPROVAL → POSTED → REVERSED | REJECTED`

La inclusión/liquidación en nómina se representa con asignaciones
(`SettlementAllocation`) y lotes (`PayrollBatch`), **nunca** modificando de
forma destructiva el movimiento original.

## Inmutabilidad y correcciones

- Nunca se borra físicamente un movimiento `POSTED`.
- "Anular" = crear una reversa enlazada (`originalMovementId`) con motivo,
  usuario y fecha.
- "Editar último" solo dentro de la ventana configurable
  (`correctionWindowMinutes`), mismo autor, no aplicado a nómina y con
  permiso — internamente: reversa + reemplazo en una sola transacción.
- Fuera de la ventana, solo un rol autorizado corrige, con motivo
  obligatorio.
- Nunca reversar dos veces el mismo movimiento.
- Ningún lote cerrado se modifica sin flujo de reapertura auditado.

## Idempotencia y concurrencia

- Cada alta trae un `idempotencyKey` generado por el cliente; único por
  `organizationId + idempotencyKey` (constraint de base de datos).
- Altas, reversas y cierres de lote ocurren dentro de transacciones
  PostgreSQL.
- Conflictos concurrentes sobre el mismo lote/asignación devuelven `409`
  con mensaje entendible, nunca una sobre-aplicación silenciosa.
- El frontend bloquea el botón mientras envía, pero la protección real vive
  en el backend.

## Saldo: nunca un campo mutable único

No existe un campo `balance` mutable en `Employee`. El saldo se calcula del
ledger; si en el futuro se agrega una proyección cacheada por rendimiento,
debe actualizarse en la misma transacción que el movimiento y existir un
comando/prueba de reconciliación contra el ledger real.
