# Design QA — Libreta diaria por renglones

## Evidencia

- Fuente visual: `C:\Users\CARDONA\.codex\generated_images\019fec4a-7401-7221-ac13-5a38ae1e681b\exec-2da0ebc5-9423-4852-b162-16c026019439.png`
- Captura final: `D:\sisinternofatboyadelantos\.codex-runtime\design\implementation-option3-final.png`
- Comparación completa conjunta: `D:\sisinternofatboyadelantos\.codex-runtime\design\option3-comparison-final.png`
- Comparación enfocada conjunta: `D:\sisinternofatboyadelantos\.codex-runtime\design\option3-focused-comparison-final.png`
- Viewport CSS de implementación: `1440 × 1024`; `devicePixelRatio: 1`.
- Fuente: `1487 × 1058` px. Para la comparación completa se ajustó proporcionalmente dentro de `1440 × 1024`; la implementación se conservó en `1440 × 1024` sin reescalado.
- Estado: tema claro, sucursal Venecia, lunes 10 de agosto de 2026, primer empleado real expandido. La fuente usa datos conceptuales de seis empleados; la implementación conserva los datos reales disponibles (un empleado y cero movimientos ese día).

## Findings

- No quedan diferencias P0, P1 o P2 accionables.
- [P3] Densidad determinada por datos reales.
  - Ubicación: hoja de empleados.
  - Evidencia: la fuente muestra seis empleados y varias anotaciones; la base local de Venecia devuelve un empleado sin movimientos para la fecha.
  - Impacto: la captura se ve menos poblada, pero la jerarquía y el patrón de renglones se conservan y crecerán con los registros reales.
  - Seguimiento: volver a revisar la densidad cuando existan varias anotaciones reales; no se insertaron datos ficticios para fabricar la captura.
- [P3] Categorías configurables superan las cuatro categorías del concepto.
  - Ubicación: compositor inline.
  - Evidencia: la fuente muestra cuatro acciones; la configuración real devuelve once categorías.
  - Impacto: se conserva toda la operación mediante una franja horizontal desplazable; cinco opciones quedan visibles a la vez en escritorio.
  - Seguimiento: si el negocio define cuatro categorías principales, se puede añadir orden de favoritas sin ocultar las restantes.

## Superficies de fidelidad

- Tipografía: Manrope local, jerarquía, pesos y cifras tabulares alineados con la fuente. Se aumentó la escala del renglón y del compositor tras la primera comparación.
- Espaciado y layout: barra superior, navegación vertical, hoja cálida, renglón expandido y resumen inferior conservan la estructura de la opción 3. No hay overflow horizontal en `1440 × 1024` ni en `390 × 844`.
- Colores y tokens: fondo crema, tinta grafito, marca frambuesa, créditos verdes y pendientes ámbar coinciden con la intención visual y tienen estados diferenciados por icono/texto además del color.
- Calidad de imágenes y activos: la referencia no contiene fotografía ni ilustración; los iconos usan una sola familia de línea ya incluida en el producto. Las iniciales son el mismo patrón de avatar funcional de la fuente.
- Copy y contenido: fecha, sucursal, estado de turno, saldo, pendiente, categorías, importe y nota usan datos/contratos reales. La captura no presenta texto de especificación ni contenido ficticio.
- Accesibilidad: controles semánticos, etiquetas, `aria-expanded`, `aria-pressed`, foco nativo, objetivos táctiles, reducción de movimiento y navegación responsive preservados.

## Historial de comparación

1. Primera comparación:
   - [P2] Las once categorías se envolvían en tres filas y rompían el renglón horizontal principal.
   - [P2] Al cerrar el compositor, el primer empleado se expandía automáticamente otra vez.
   - [P2] Etiquetas y cifras del compositor se veían más pequeñas que la referencia.
2. Correcciones:
   - Las categorías pasaron a una franja horizontal de una sola fila, manteniendo acceso a todas.
   - La expansión automática se limita a la inicialización/cambio de conjunto; cerrar el renglón ahora permanece cerrado.
   - Se aumentaron tamaños de texto en saldos, anotaciones, categorías, campos y acción primaria.
3. Evidencia posterior:
   - Comparación final completa y enfocada en los archivos indicados arriba.
   - Abrir/cerrar, selección de categoría, captura de importe/nota, fecha anterior/siguiente y filtro fueron ejercitados en navegador.
   - Consola final: sin errores ni advertencias.

## Implementation Checklist

- [x] Navegación vertical de escritorio y navegación inferior móvil.
- [x] Hoja diaria agrupada por empleado con movimientos reales de la jornada.
- [x] Renglón inline de alta conectado a `POST /movements`.
- [x] Saldos y pendientes provenientes del ledger backend.
- [x] Sucursal, fecha, búsqueda, filtro y actualización funcionales.
- [x] Responsive móvil sin desbordamiento horizontal.
- [x] Build y comprobación visual final.

## Follow-up Polish

- Revalidar densidad visual con una jornada que tenga varios empleados y movimientos reales.

final result: passed
