# Referencias visuales

Imágenes de referencia obligatorias mencionadas en
`PROMPT_MAESTRO_LIBRETA_NOMINAS_CLAUDE_CODE.md` §4. Se usan como guía de
lenguaje visual, jerarquía y color — **no** como fondo ni maqueta pegada;
la interfaz se reconstruye con componentes reales (React + Tailwind).

- **`ref-01-dashboard-claro-libreta-nominas.png`** — encabezado azul en
  degradado, buscador, campana de notificaciones, lista de empleados con
  saldo, libreta central con espiral y hoja de líneas, panel derecho de
  saldo + desglose por categoría + anillo de dona, grid de accesos rápidos
  de colores (Adelanto/Comida/Soda/Otro Descuento), nav inferior de 5
  iconos. Es la referencia más cercana al layout de escritorio ya
  implementado en `LibretaPage`.
- **`ref-02-tablet-mi-libreta.png`** — variante tipo tablet con lista de
  empleados a la izquierda, resumen del día y botón verde "Nuevo
  Movimiento" a todo lo ancho. Útil para el breakpoint de tablet
  (768–1279px) del §4.6.
- **`ref-03-caja-oscuro-mi-libreta.png`** — flujo rápido de cajero con
  mosaicos grandes de categoría y captura de monto. **Nota:** esta
  referencia usa tema oscuro; el prompt maestro prohíbe explícitamente el
  oscuro como tema *predeterminado* (§4.8), así que se toma solo la
  disposición del flujo de captura (mosaicos de categoría → monto →
  guardar), no la paleta oscura.

Compara contra las capturas responsivas generadas con
`apps/web/scripts/capture-viewports.mjs` conforme avanza cada fase visual
(Fase 4 en adelante, cuando exista la libreta real con movimientos).
