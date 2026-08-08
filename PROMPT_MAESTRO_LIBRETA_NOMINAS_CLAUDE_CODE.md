# PROMPT MAESTRO PARA CLAUDE CODE

## Desarrollo completo de “Libreta de Nóminas”

Actúa como arquitecto de software, diseñador senior de producto, desarrollador full-stack y responsable de calidad. Debes construir una aplicación web completa, funcional, segura y lista para desplegar en un servidor propio. No quiero solamente una maqueta, una pantalla estática ni un prototipo con datos falsos. Quiero frontend, backend, base de datos, autenticación, permisos, lógica real, pruebas, documentación y configuración de despliegue.

La aplicación reemplazará las libretas físicas donde actualmente se anotan adelantos de efectivo, comidas, sodas, consumos, descuentos y otros cargos de los empleados. Debe ser tan rápida y sencilla como escribir en una libreta, pero con control de acceso, historial, saldos correctos, trazabilidad y preparación de descuentos para nómina.

Las tres imágenes que adjunto son las referencias visuales obligatorias:

- `01-116794.png`
- `02-116797.png`
- `03-116795.png`

Úsalas como guía de lenguaje visual, jerarquía, color, distribución y facilidad de uso. No copies sus errores, textos de muestra ni inconsistencias matemáticas. No uses las imágenes como fondo ni intentes simular una aplicación pegando capturas. Reconstruye la interfaz con componentes reales de React, HTML semántico y Tailwind CSS.

Si las imágenes no están accesibles dentro del repositorio, trabaja con la descripción visual exhaustiva incluida en este documento. No cambies el estilo por un panel administrativo genérico.

---

## 1. Resultado esperado

Construye una aplicación llamada provisionalmente **“Libreta de Nóminas”**, con nombre, logotipo y colores configurables por negocio. La configuración inicial puede mostrar “Fatboy”, pero no debes incrustar ese nombre de manera irreversible en la lógica.

El sistema debe permitir:

1. Administrar uno o varios negocios y sus sucursales, aunque en la primera instalación se utilizará un solo negocio.
2. Registrar empleados y asignarlos a una o varias sucursales.
3. Registrar movimientos rápidos para un empleado: adelanto, comida, bebida, consumo, transporte, otro descuento, devolución, ajuste y aplicación en nómina.
4. Saber cuánto tiene pendiente cada empleado, con desglose por categoría, periodo, fecha y sucursal.
5. Preparar y cerrar periodos de descuentos para nómina sin perder el historial.
6. Permitir pagos o descuentos parciales y arrastrar automáticamente el saldo restante.
7. Corregir errores sin borrar la evidencia original.
8. Generar resúmenes imprimibles, recibos y exportaciones.
9. Tener una vista extremadamente rápida para caja o encargado.
10. Dar al empleado una vista privada donde únicamente pueda consultar su propia libreta.
11. Mantener auditoría completa de quién registró, corrigió, anuló, aprobó o aplicó cada movimiento.
12. Funcionar correctamente en computadora, tablet Android de 10 pulgadas y teléfono.
13. Poder instalarse como PWA y seguir siendo útil ante cortes breves de Internet, con una cola offline segura y visible.
14. Quedar lista para desplegarse en un servidor propio mediante Docker y Coolify.

La aplicación **no es, por ahora, un sistema de cálculo fiscal de nómina**. No debe calcular sueldo, ISR, IMSS, horas trabajadas ni timbrado. Su responsabilidad es llevar la libreta de adeudos/consumos y preparar los montos que después se aplicarán en la nómina.

---

## 2. Restricciones no negociables

- Backend: **NestJS + TypeScript**.
- Base de datos: **PostgreSQL**.
- ORM y migraciones: **Prisma**.
- Frontend: **React + Vite + TypeScript**.
- Estilos: **Tailwind CSS**. No usar Bootstrap.
- Monorepo con **pnpm workspaces**.
- API REST documentada con OpenAPI/Swagger.
- Autenticación real; no simular sesiones en el frontend.
- Control de acceso tanto en backend como en frontend. Ocultar un botón no equivale a proteger un endpoint.
- Importes guardados como enteros en centavos; nunca usar `float` para dinero.
- Zona horaria predeterminada: `America/Tijuana`.
- Moneda predeterminada: `MXN`.
- Interfaz y mensajes de usuario en español de México.
- El servidor es la fuente de verdad para saldos, permisos, periodos y reportes.
- Todos los movimientos financieros confirmados deben conservar trazabilidad.
- No guardar contraseñas, tokens ni secretos en el repositorio.
- No dejar las funciones principales como `TODO`, botones decorativos o rutas vacías.
- No usar datos falsos en producción. Los datos de demostración solo se permiten mediante un seed explícito de desarrollo.
- No agregar microservicios, Kafka, Kubernetes ni arquitectura distribuida innecesaria. Debe ser robusta, pero operable por un negocio pequeño en un solo servidor.
- Evitar dependencias innecesarias. Antes de instalar una librería, justificar que resuelve una necesidad concreta.

Usa versiones estables y compatibles entre sí. Fija las versiones en el lockfile. No adivines versiones futuras ni mezcles APIs de versiones incompatibles.

---

## 3. Instrucciones de ejecución para ti, Claude Code

1. Inspecciona primero el repositorio completo, incluyendo `README`, archivos de entorno de ejemplo, configuración de paquetes, estructura actual y cualquier instrucción `CLAUDE.md` o equivalente.
2. Si ya existe código, reutiliza lo que sea compatible, protege los cambios del usuario y no destruyas trabajo existente.
3. Si el repositorio está vacío, crea el monorepo desde cero.
4. Escribe un plan corto y verificable en `IMPLEMENTATION_PLAN.md`, pero no te detengas después del plan: implementa la aplicación.
5. Trabaja por módulos verticales terminados. Cada módulo debe incluir persistencia, API, UI, permisos y pruebas cuando correspondan.
6. Ejecuta lint, comprobación de tipos, pruebas, build y migraciones antes de declarar terminado el trabajo.
7. Si encuentras una decisión menor no especificada, elige la opción más simple, segura y coherente con este documento. Solo pregunta cuando falte un dato verdaderamente bloqueante, como credenciales o dominio para ejecutar un despliegue real.
8. No hagas `push`, no publiques imágenes y no modifiques el servidor de producción sin autorización explícita. Sí debes dejar todos los archivos y la guía necesarios para desplegar.
9. Al final entrega un resumen concreto de lo implementado, pruebas ejecutadas, credenciales de demostración solo para desarrollo, variables pendientes y pasos de despliegue.

---

## 4. Dirección visual obligatoria

### 4.1 Concepto

La aplicación debe sentirse como una **libreta digital moderna, amigable, colorida y táctil**, inspirada directamente en las imágenes. Debe tener personalidad. No quiero un dashboard empresarial frío, gris, pálido o compuesto únicamente por tablas.

La combinación visual deseada es:

- De la referencia 1: encabezado azul, búsqueda visible, listado de empleados, libreta central, panel de saldo y resumen.
- De la referencia 2: botones rápidos grandes y coloridos, acciones claras, buen uso de verde, naranja, azul, morado y rosa.
- De la referencia 3: la representación más clara de una libreta abierta, papel con líneas y argollas, sin volver la interfaz fantasiosa o difícil de desarrollar.

La libreta debe construirse con CSS: superficies blancas, líneas sutiles mediante gradientes CSS, borde azul lateral y argollas decorativas con pseudo-elementos o un pequeño componente repetible. No uses una imagen pesada de una libreta como fondo. La decoración nunca debe impedir la lectura ni reducir demasiado el espacio útil.

### 4.2 Personalidad visual

- Limpia, luminosa y alegre.
- Fondo general muy claro, ligeramente azulado o cálido.
- Tarjetas blancas con bordes suaves, sombras moderadas y radios amplios.
- Encabezado de marca en degradado azul; los degradados deben ser elegantes, no chillones.
- Verde para acción primaria de registrar y para estados positivos.
- Rojo/coral para importes pendientes o cargos.
- Naranja para comidas y consumos.
- Morado para otros descuentos.
- Azul para navegación, fechas, selección y acciones secundarias.
- Rosa solo como acento, no como color dominante.
- Mucho color en acciones y categorías, pero suficiente espacio blanco para que no se sienta saturada.

### 4.3 Tokens iniciales

Centraliza los tokens en Tailwind y variables CSS. Parte de esta paleta y ajústala solo si mejora contraste:

```css
--canvas: #F3F7FD;
--surface: #FFFFFF;
--surface-soft: #F8FAFF;
--ink: #10203F;
--muted: #66738C;
--line: #DCE5F3;
--brand-800: #07348F;
--brand-700: #0A46B6;
--brand-600: #0F67E8;
--brand-500: #1787FF;
--success: #0DBD5B;
--success-soft: #DDF8E8;
--danger: #EF334A;
--danger-soft: #FFE1E6;
--warning: #FF8A1F;
--warning-soft: #FFF0D9;
--purple: #8A3FFC;
--purple-soft: #EFE3FF;
--pink: #F43F8F;
--pink-soft: #FFE0EF;
```

Usa sombras suaves y consistentes, por ejemplo una sombra corta para controles y otra más profunda para paneles elevados. No uses sombras en cada texto ni efectos “neón”. Radios aproximados: 14 px en controles, 20–24 px en tarjetas principales y píldoras completas para estados.

### 4.4 Tipografía e iconografía

- Usa una tipografía legible como Manrope o Inter para toda la interfaz.
- Puedes usar una tipografía manuscrita legible, como Patrick Hand, únicamente en títulos de la hoja, anotaciones decorativas y el total manuscrito. Debe estar empaquetada localmente mediante una dependencia tipo Fontsource, no depender de una descarga externa en cada carga.
- No uses la tipografía manuscrita en tablas, formularios, cantidades pequeñas ni controles.
- Usa `lucide-react` para iconos coherentes.
- No uses emojis como iconos funcionales de producción.
- Las fotos de empleados deben ser reales si el usuario las carga; si no existe foto, mostrar iniciales sobre un fondo de color. No inventar rostros generados.

### 4.5 Estructura de escritorio

En pantallas grandes, la vista principal debe usar tres zonas:

1. **Columna izquierda, 280–320 px:** búsqueda y listado compacto de empleados autorizados para esa cuenta/sucursal.
2. **Centro flexible, mínimo 560 px:** perfil seleccionado y hoja de movimientos con aspecto de libreta.
3. **Columna derecha, 300–340 px:** saldo actual, desglose, nuevo movimiento y acciones rápidas.

Usa un ancho máximo aproximado de 1600 px, separaciones de 16–24 px y encabezado de 72–80 px. No comprimas el contenido para mantener tres columnas si la pantalla no lo permite.

El encabezado debe incluir:

- Marca y nombre de la aplicación.
- Botón de menú cuando corresponda.
- Búsqueda global o contextual de empleado.
- Selector de sucursal si el usuario tiene acceso a más de una.
- Selector de fecha/periodo cuando resulte útil.
- Campana de notificaciones reales.
- Avatar, nombre, rol y menú de sesión.

La navegación principal debe mantener el lenguaje de las imágenes: iconos grandes y etiquetas claras para **Libreta, Nómina, Reportes, Empleados y Configuración**. En escritorio puede ser una barra inferior o lateral compacta según el espacio, pero no debe parecer una plantilla administrativa genérica. En tablet debe preferirse una barra inferior fija. En móvil, mostrar solo los destinos permitidos al rol.

### 4.6 Responsividad

- **Escritorio ≥ 1280 px:** tres columnas completas.
- **Tablet 768–1279 px:** libreta como área principal; empleados en drawer o panel colapsable; saldo y acciones en panel lateral o inferior. Acciones rápidas siempre accesibles sin desplazamientos excesivos.
- **Móvil < 768 px:** una sola columna. Encabezado compacto, tarjeta de saldo, botón fijo “Nuevo movimiento”, filtros en sheet y movimientos como tarjetas. No intentar dibujar una libreta de dos páginas en 390 px.
- La vista privada del empleado en móvil debe ser especialmente clara: saldo, movimientos, periodo, estado y descarga de resumen; nunca lista de otros empleados.
- Ninguna pantalla debe tener scroll horizontal.
- Objetivos táctiles de mínimo 44 × 44 px; botones principales idealmente de 48–56 px de alto.

### 4.7 Componentes visuales esenciales

Construye componentes reutilizables, no una página monolítica:

- `AppHeader`
- `BranchSwitcher`
- `EmployeeSearch`
- `EmployeeList` y `EmployeeListItem`
- `EmployeeIdentityCard`
- `NotebookShell`
- `MovementRow` / `MovementCard`
- `BalanceCard`
- `CategoryBreakdown`
- `QuickMovementGrid`
- `QuickMovementTile`
- `NewMovementSheet` o modal responsivo
- `MoneyInput` con teclado numérico amigable
- `PeriodNavigator`
- `WeeklySummaryCard`
- `PayrollBatchCard`
- `NotificationCenter`
- `EmptyState`, `ErrorState` y esqueletos de carga
- `OfflineBanner` y `PendingSyncBadge`
- `PermissionGate` solamente para presentación; la seguridad real vive en la API

### 4.8 Prohibiciones de diseño

- No usar un tema oscuro como tema predeterminado.
- No usar negro como fondo dominante.
- No convertir todo en una tabla CRUD.
- No usar un sidebar gris genérico comprado de una plantilla.
- No llenar la parte superior de métricas irrelevantes.
- No usar glassmorphism que reduzca legibilidad.
- No colocar ilustraciones de billetes o comida detrás del texto si afectan contraste.
- No abusar de animaciones, rebotes o efectos 3D.
- No alterar el diseño hacia una estética bancaria, contable o de ERP tradicional.
- No sacrificar claridad por imitar literalmente un dibujo.

### 4.9 Calidad visual verificable

Al terminar cada pantalla importante, revisa con navegador real al menos estos viewports:

- 1440 × 1000
- 1024 × 768
- 768 × 1024
- 390 × 844

Genera capturas de Playwright en desarrollo para comparar jerarquía y densidad con las referencias. Corrige desbordamientos, textos cortados, botones fuera de pantalla, espacios muertos y contraste. La aplicación no se considera terminada si solamente “funciona” pero visualmente parece una plantilla sin personalidad.

---

## 5. Roles y privacidad

Implementa RBAC con permisos granulares y alcance por negocio/sucursal. Roles iniciales:

### `OWNER_ADMIN`

- Acceso total al negocio.
- Gestiona sucursales, usuarios, empleados, categorías, permisos, periodos, reportes y configuración.
- Puede aprobar, revertir, cerrar y reabrir con motivo.
- Puede consultar auditoría.

### `PAYROLL_MANAGER`

- Ve empleados y movimientos de todas las sucursales autorizadas.
- Prepara, exporta, aplica y cierra lotes de nómina.
- Puede registrar créditos o ajustes relacionados con nómina.
- No puede cambiar propiedad del negocio ni borrar auditoría.

### `GENERAL_MANAGER`

- Ve todas las sucursales asignadas.
- Administra empleados operativos, aprueba movimientos y consulta reportes operativos.
- No accede a configuración crítica ni credenciales.

### `BRANCH_MANAGER`

- Ve únicamente empleados vinculados a sus sucursales.
- Registra movimientos, consulta historial de su alcance, corrige dentro de las reglas y aprueba cuando tenga permiso.
- No ve información de otras sucursales.

### `CASHIER_RECORDER`

- Flujo rápido para buscar empleados de su sucursal y registrar movimientos.
- Puede ver el saldo y movimientos necesarios para operar, pero no reportes globales, configuración, usuarios, nómina completa ni datos de otras sucursales.
- Cada registro debe quedar firmado digitalmente con su usuario; no usar una cuenta compartida si puede evitarse.

### `EMPLOYEE_SELF_SERVICE`

- Únicamente ve su propio nombre, foto, puesto, movimientos, saldo, aclaraciones y resúmenes.
- No puede buscar ni enumerar a otros empleados.
- No recibe endpoints que filtren datos de otros empleados en el cliente: la API debe impedirlo.
- Puede reconocer un movimiento, marcar “Solicitar aclaración” y agregar un comentario propio cuando la configuración lo permita.

Implementa permisos como capacidades (`employee.read`, `movement.create`, `movement.reverse`, `payroll.close`, etc.) y aplica además `tenantId` y alcance de sucursal en cada consulta. Evita confiar en IDs enviados por el frontend. Agrega pruebas específicas para demostrar que un empleado no puede consultar el expediente de otro cambiando la URL o el ID.

---

## 6. Modelo contable y reglas de saldo

Esta sección es crítica. No copies los signos inconsistentes de las imágenes.

### 6.1 Significado del saldo

- Un **cargo** aumenta lo que el empleado tiene pendiente: adelanto, comida, soda, consumo, transporte u otro descuento por aplicar.
- Un **abono** reduce lo pendiente: descuento aplicado en nómina, devolución en efectivo, corrección a favor o ajuste crédito.
- El importe capturado siempre es positivo. La categoría define si su dirección es `CHARGE` o `CREDIT`.
- El saldo se calcula en el servidor:

```text
saldo_pendiente = suma(cargos publicados) - suma(abonos publicados)
```

- Un movimiento pendiente de aprobación o pendiente de sincronización no debe mezclarse silenciosamente con el saldo confirmado. Muéstralo por separado.
- Si el resultado es mayor que cero, mostrar “Pendiente por descontar: $X”.
- Si es cero, mostrar “Sin saldo pendiente”.
- Si es menor que cero, mostrar “Saldo a favor: $X”; no mostrar un número confuso como `-$-50`.
- El saldo no se reinicia al cambiar de semana. Los filtros semanales cambian el resumen del periodo, pero el saldo total se arrastra hasta que existan abonos reales.
- Todo cálculo monetario usa `amountCents` entero y operaciones exactas.

### 6.2 Categorías iniciales

Crear categorías configurables con icono, color, dirección, estado activo, orden y reglas:

| Clave | Etiqueta | Dirección | Color inicial |
|---|---|---:|---|
| `CASH_ADVANCE` | Adelanto | `CHARGE` | verde/coral según contexto |
| `FOOD` | Comida | `CHARGE` | naranja |
| `BEVERAGE` | Soda / bebida | `CHARGE` | azul |
| `SNACK` | Snack | `CHARGE` | amarillo |
| `TRANSPORT` | Transporte | `CHARGE` | violeta |
| `OTHER_DEDUCTION` | Otro descuento | `CHARGE` | morado/rosa |
| `CASH_REPAYMENT` | Devolución en efectivo | `CREDIT` | verde |
| `PAYROLL_DEDUCTION` | Aplicado en nómina | `CREDIT` | azul oscuro |
| `DEBIT_ADJUSTMENT` | Ajuste de cargo | `CHARGE` | coral |
| `CREDIT_ADJUSTMENT` | Ajuste a favor | `CREDIT` | turquesa |
| `OPENING_BALANCE` | Saldo inicial | configurable y restringida | gris azulado |

El usuario administrador puede desactivar, reordenar y crear categorías, pero no debe poder cambiar la dirección de una categoría que ya tenga movimientos. En ese caso debe crear otra categoría.

### 6.3 Estados del movimiento

Estados mínimos:

- `PENDING_APPROVAL`
- `POSTED`
- `REVERSED`
- `REJECTED`

La inclusión y liquidación en nómina debe representarse además mediante asignaciones/lotes, no cambiando de manera destructiva el movimiento original.

### 6.4 Inmutabilidad y correcciones

- Nunca borrar físicamente un movimiento publicado desde la interfaz.
- Para “anular”, crear una reversa enlazada al movimiento original y guardar motivo, usuario y fecha.
- Para “Editar último”, permitir la experiencia visual solo si cumple la ventana configurable, fue creado por el mismo usuario, no está aplicado a nómina y tiene permiso. Internamente debe conservar el original, crear reversa y crear reemplazo en una transacción.
- Fuera de esa ventana, solo un rol autorizado puede corregir con motivo obligatorio.
- Evitar reversar dos veces el mismo movimiento.
- No permitir modificar un lote cerrado sin flujo de reapertura autorizado y auditado.

### 6.5 Idempotencia y concurrencia

- Cada alta de movimiento recibe un UUID generado por el cliente y un encabezado o campo `idempotencyKey`.
- Impón unicidad por negocio para impedir duplicados por doble toque, reintentos o sincronización offline.
- Realiza altas, reversas y cierre de lote dentro de transacciones de PostgreSQL.
- Cuando dos operaciones afectan el mismo lote o asignación, utiliza bloqueo/validación transaccional y devuelve conflicto `409` con mensaje entendible.
- El frontend debe bloquear temporalmente el botón mientras envía, pero la protección real debe existir en backend.

---

## 7. Flujos funcionales

### 7.1 Inicio de sesión

- Login con correo o nombre de usuario y contraseña.
- Opción de PIN rápido únicamente para dispositivos previamente autorizados y después de una sesión inicial válida; el PIN debe estar hasheado y tener rate limiting.
- Contraseña temporal de un solo uso para cuentas creadas por administración.
- Cambio obligatorio de contraseña en primer acceso.
- Cerrar todas las sesiones de un usuario desde administración.
- Pantalla de bloqueo rápido en dispositivos de caja.
- Recuperación mediante correo puede quedar preparada/configurable, pero si no existe SMTP debe existir un flujo administrativo seguro para emitir una contraseña temporal. Nunca mostrar la contraseña actual.

### 7.2 Selección de empleado

- Búsqueda tolerante por nombre, número de empleado o puesto.
- Filtrar por sucursal y estado activo.
- Mostrar avatar, nombre, puesto, indicador de activo y saldo pendiente.
- Ordenar primero resultados coincidentes y después empleados recientes.
- El rol empleado no debe recibir ni renderizar este listado.
- Al seleccionar un empleado, cargar perfil, saldo, resumen y primera página de movimientos sin recargar la aplicación completa.

### 7.3 Nuevo movimiento rápido

El botón verde “Nuevo movimiento” debe ser el CTA principal. Abrir modal en escritorio y bottom sheet de altura apropiada en móvil/tablet.

Flujo:

1. Empleado seleccionado; si no existe, pedirlo primero.
2. Elegir una categoría con mosaicos grandes y coloridos.
3. Capturar monto con teclado numérico amigable; formato MXN en vivo.
4. Escribir concepto o nota. Para “Otro descuento”, “Ajuste” y montos elevados, la nota es obligatoria.
5. Sucursal se toma de la sesión o selector autorizado; no confiar en un campo oculto.
6. Fecha y hora predeterminadas al momento actual. Solo roles autorizados pueden registrar retroactivamente y deben incluir motivo.
7. Adjuntar evidencia opcional (foto o PDF) cuando la política de categoría lo permita o exija.
8. Mostrar confirmación clara: empleado, tipo, monto, dirección y saldo estimado.
9. Si supera el umbral configurado, dejar en `PENDING_APPROVAL` en lugar de publicarlo directamente.
10. Guardar con idempotencia, mostrar resultado real del servidor y actualizar consultas.
11. Ofrecer “Registrar otro” o cerrar.

Validaciones predeterminadas configurables:

- Monto mínimo: $1.00.
- Monto máximo por movimiento y límites diarios/semanales por categoría.
- No permitir cero, negativos, `NaN`, más de dos decimales ni importes fuera de rango.
- Nota con longitud razonable y saneamiento.
- Confirmación adicional para montos por encima del umbral.

### 7.4 Libreta del empleado

Debe mostrar:

- Identidad: foto/iniciales, nombre, número, puesto y sucursal.
- Saldo pendiente total confirmado.
- Importes pendientes de aprobación y sincronización separados.
- Navegador de día, semana, periodo de nómina o rango personalizado.
- Movimientos agrupados por fecha.
- Cada fila: hora/fecha, icono de categoría, concepto, categoría, monto, quién registró, sucursal, estado y menú permitido.
- Resumen del periodo por categoría.
- Paginación o carga incremental real; no traer todo el historial.
- Estado vacío útil con CTA si el rol puede registrar.
- Notas y solicitudes de aclaración asociadas.

### 7.5 Reconocimiento y aclaración del empleado

Configurable por negocio:

- El empleado puede marcar un movimiento como “Reconocido”.
- Puede solicitar aclaración y escribir un comentario.
- No puede editar el monto ni anularlo.
- El encargado recibe una notificación y puede responder.
- La aclaración no borra ni cambia automáticamente el saldo; queda abierta hasta ser resuelta.
- Guardar tiempos, autores y cambios de estado en auditoría.

### 7.6 Periodos y lote de nómina

Permitir frecuencia semanal y quincenal, con inicio de semana, día/hora de corte y zona horaria configurables.

Flujo de lote:

1. Crear o generar el periodo.
2. Mostrar empleados con saldo pendiente y desglose de cargos elegibles.
3. Permitir seleccionar todos o algunos movimientos y aplicar montos parciales.
4. Validar que un mismo importe no se asigne dos veces.
5. Guardar lote en borrador.
6. Revisar y bloquear el lote.
7. Exportar CSV/XLSX y PDF con empleado, número, sucursal, cargos, créditos, importe a descontar y saldo restante estimado.
8. Al confirmar “Aplicado en nómina”, crear los movimientos crédito y sus asignaciones de liquidación en una sola transacción.
9. Cerrar el lote y conservar versión, usuario y fecha.
10. El saldo no aplicado permanece para el siguiente periodo.
11. Reabrir solo con permiso elevado, motivo obligatorio y auditoría. Si ya se aplicaron créditos, la corrección debe realizarse con reversas, no borrado.

Estados de lote sugeridos:

- `DRAFT`
- `UNDER_REVIEW`
- `LOCKED`
- `APPLIED`
- `CLOSED`
- `REOPENED`

### 7.7 Reportes

Filtros por:

- Negocio y sucursal.
- Empleado.
- Categoría.
- Dirección cargo/abono.
- Estado.
- Usuario que registró.
- Periodo de nómina o rango de fechas.

Reportes mínimos:

- Saldos actuales por empleado.
- Movimientos del periodo.
- Adelantos por sucursal.
- Consumos por categoría.
- Pendientes de aprobación.
- Aclaraciones abiertas.
- Lotes aplicados a nómina.
- Movimientos anulados/corregidos.
- Actividad por usuario registrador.

Permitir exportación CSV y XLSX en reportes tabulares, y PDF en resúmenes imprimibles. Los filtros aplicados deben aparecer en el archivo. Para conjuntos grandes, generar del lado del servidor o transmitir de forma eficiente; no cargar miles de registros en el navegador para exportarlos.

### 7.8 Impresión

- Resumen individual en tamaño carta/A4.
- Recibo compacto de movimiento y resumen compatible con impresión del navegador en 58/80 mm.
- CSS `@media print` limpio: sin navegación, botones ni fondos que desperdicien tinta.
- Incluir negocio, sucursal, empleado, folio, fecha, categoría, concepto, monto, registrador y espacio de firma si está habilitado.
- Nunca depender de colores para entender cargo, abono o estado.

### 7.9 Administración

Pantallas para:

- Negocio: nombre, logotipo, color principal, moneda y zona horaria.
- Sucursales: nombre, código, dirección y estado.
- Usuarios: rol, sucursales permitidas, estado, contraseña temporal y cierre de sesiones.
- Empleados: alta, edición, baja lógica, número, foto, puesto, fecha de ingreso, sucursales y cuenta de autoservicio opcional.
- Categorías: etiqueta, icono Lucide permitido, color, dirección, orden, límites, nota/evidencia requerida y estado.
- Reglas: umbral de aprobación, ventana de corrección, periodos, reconocimiento del empleado y offline.
- Auditoría: búsqueda y filtros; solo lectura.

Las bajas de empleados y usuarios deben ser lógicas. No eliminar sus movimientos.

---

## 8. PWA y comportamiento offline

La aplicación debe ser instalable como PWA, con manifest, iconos, nombre, colores y service worker.

El soporte offline debe ser explícito y seguro:

- Cachear shell de la aplicación y datos mínimos recientes de la sucursal autorizada.
- Mostrar una franja visible cuando no hay conexión.
- Permitir registrar movimientos offline únicamente si existe una sesión válida reciente y la política lo permite.
- Guardar cada operación pendiente en IndexedDB con UUID/idempotency key, marca de tiempo local, empleado, categoría, monto y nota.
- Marcarla “Pendiente de sincronizar”; no presentarla como confirmada.
- Mostrar saldo confirmado y efecto provisional por separado.
- Sincronizar en orden al recuperar conexión.
- El backend debe responder de forma idempotente si la misma operación se reintenta.
- Si la sesión, empleado, categoría o permiso dejaron de ser válidos, detener esa operación y mostrar un conflicto que un usuario debe resolver; nunca descartarla en silencio.
- Advertir antes de cerrar sesión o limpiar datos cuando existan movimientos pendientes.
- No almacenar contraseñas, tokens de larga duración, listas globales ni información de otras sucursales en IndexedDB.

Si esta parte amenaza la integridad del MVP, impleméntala después de cerrar correctamente el flujo online, pero debe formar parte de la entrega final y tener pruebas del caso de duplicación/reintento.

---

## 9. Arquitectura propuesta

Usa una estructura similar a:

```text
/
  apps/
    api/                  # NestJS
    web/                  # React + Vite
  packages/
    shared/               # tipos/constantes sin lógica de servidor sensible
    eslint-config/        # opcional si realmente simplifica
    tsconfig/             # opcional
  infra/
    nginx/                # si se necesita reverse proxy/static serving
    scripts/
  docs/
    references/           # copias de las imágenes si están disponibles
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

### Backend NestJS

Módulos sugeridos:

- `AuthModule`
- `OrganizationsModule`
- `BranchesModule`
- `UsersModule`
- `EmployeesModule`
- `MovementCategoriesModule`
- `LedgerModule`
- `PayrollPeriodsModule`
- `PayrollBatchesModule`
- `ReportsModule`
- `FilesModule`
- `NotificationsModule`
- `AuditModule`
- `SettingsModule`
- `HealthModule`

Usa módulos por dominio, DTOs validados, servicios con lógica y repositorios/adaptadores Prisma donde agreguen claridad. No coloques toda la lógica en controladores ni en un único servicio.

Configura:

- `ValidationPipe` global con whitelist, transformación y rechazo de propiedades no permitidas.
- Filtro global de excepciones con respuestas consistentes.
- Identificador de correlación por request.
- Logging estructurado, sin contraseñas, tokens ni contenido sensible.
- Helmet y encabezados de seguridad.
- Rate limiting en login, PIN, recuperación, exportaciones y endpoints sensibles.
- CORS exacto solo si frontend y API usan orígenes distintos.
- Swagger protegido o desactivable en producción.
- Endpoint de vida `/health/live`.
- Endpoint de disponibilidad `/health/ready` que compruebe base de datos y, si aplica, almacenamiento.

### Frontend React

Usa:

- React Router para rutas y layouts por rol.
- TanStack Query para datos remotos, cache, invalidaciones y estados de carga.
- React Hook Form + Zod para formularios.
- Lucide React para iconos.
- Una librería de gráficas ligera solo para el anillo/resumen si realmente es necesaria; una solución SVG propia es válida si es accesible.
- Estado local o Zustand únicamente para estado de UI y cola offline cuando aporte claridad. No duplicar en un store global los datos que ya administra TanStack Query.

No guardar el access token en `localStorage`. Preferir access token corto en memoria y refresh token rotatorio en cookie `HttpOnly`, `Secure` y `SameSite` adecuada, o una estrategia de sesión equivalente que quede documentada y protegida contra CSRF.

### Rutas de frontend

```text
/login
/change-temporary-password
/app/libreta
/app/empleados
/app/empleados/:employeeId
/app/nomina
/app/nomina/:batchId
/app/reportes
/app/configuracion/negocio
/app/configuracion/sucursales
/app/configuracion/usuarios
/app/configuracion/categorias
/app/auditoria
/mi-libreta
```

Protege rutas por sesión y permiso, pero recuerda que toda consulta también debe protegerse en API.

---

## 10. Modelo de datos mínimo

Diseña Prisma con IDs UUID, `createdAt`, `updatedAt` cuando correspondan y nombres claros. Ajusta relaciones si encuentras una forma más limpia, pero conserva estas capacidades.

### Entidades

#### `Organization`

- `id`
- `name`
- `slug`
- `logoObjectKey` opcional
- `currency` (`MXN`)
- `timezone` (`America/Tijuana`)
- `primaryColor`
- `active`

#### `Branch`

- `id`, `organizationId`
- `code`, `name`, `address`
- `active`
- Restricción única por organización y código.

#### `User`

- `id`, `organizationId`
- `username`, `email` opcional
- `displayName`
- `passwordHash`
- `pinHash` opcional
- `role`
- `active`, `mustChangePassword`
- `lastLoginAt`
- Relación muchos-a-muchos con sucursales permitidas.
- Relación opcional uno-a-uno con `Employee` para autoservicio.

#### `RefreshSession`

- Identificador/token hasheado, usuario, expiración, fecha de revocación, dispositivo/IP resumidos y rotación.

#### `Employee`

- `id`, `organizationId`
- `employeeNumber`
- `firstName`, `lastName`, `displayName`
- `jobTitle`
- `photoObjectKey` opcional
- `hireDate` opcional
- `active`
- `primaryBranchId`
- Relaciones con sucursales adicionales y cuenta de usuario opcional.
- No guardar salario en el MVP si no es necesario.

#### `MovementCategory`

- `id`, `organizationId`
- `code`, `label`
- `direction`: `CHARGE | CREDIT`
- `iconName`, `colorToken`, `sortOrder`
- `requiresNote`, `requiresEvidence`, `requiresApproval`
- `approvalThresholdCents` opcional
- `dailyLimitCents`, `weeklyLimitCents`, `maxPerMovementCents` opcionales
- `system`, `active`

#### `LedgerMovement`

- `id`, `organizationId`, `branchId`, `employeeId`, `categoryId`
- `direction` almacenada como snapshot controlado por servidor.
- `amountCents` positivo.
- `concept`, `occurredAt`, `timezone`
- `status`
- `createdByUserId`, `approvedByUserId` opcional
- `approvedAt`, `rejectedAt`, `rejectionReason`
- `idempotencyKey`
- `source`: `WEB | PWA_OFFLINE | PAYROLL | IMPORT | SYSTEM`
- `originalMovementId` o relación de reversa/reemplazo.
- `reversalReason` cuando corresponda.
- `metadata` JSON solo para datos secundarios no consultados; no meter campos centrales en JSON.
- Índices por organización/empleado/fecha, organización/sucursal/fecha, estado y categoría.
- Unicidad de `organizationId + idempotencyKey`.

#### `MovementAttachment`

- Movimiento, object key, nombre, MIME, tamaño, checksum, usuario y fecha.

#### `MovementAcknowledgement` y/o `MovementDispute`

- Movimiento, empleado, estado, comentario, respuesta, fechas y usuarios responsables.

#### `PayrollPeriod`

- Organización, fecha/hora inicio y fin, fecha de pago, tipo semanal/quincenal, zona horaria y estado.
- Evitar periodos duplicados o solapados sin autorización.

#### `PayrollBatch`

- Organización, periodo, alcance de sucursal opcional, estado, creador, revisor, fechas de bloqueo/aplicación/cierre, totales y versión.

#### `PayrollBatchItem`

- Lote, empleado, saldo al preparar, monto planeado, monto aplicado y saldo posterior.

#### `SettlementAllocation`

- Relaciona un cargo fuente con el movimiento crédito que lo liquida.
- `allocatedCents`.
- Permite liquidaciones parciales y evita aplicar más que el pendiente.

#### `Notification`

- Organización, usuario destinatario, tipo, título, cuerpo breve, enlace interno, leído y fecha.

#### `AuditLog`

- Organización, actor, acción, tipo de entidad, ID, sucursal, fecha, request/correlation ID, motivo e instantáneas antes/después sanitizadas.
- Solo inserción desde la aplicación; sin endpoint de modificación o borrado.

#### `OrganizationSettings`

- Inicio de semana.
- Frecuencia/corte de nómina.
- Ventana de corrección en minutos.
- Umbral de aprobación.
- Reconocimiento obligatorio.
- Offline permitido.
- Retención y límites de archivos.

No confíes en un único campo `balance` mutable del empleado. Calcula el saldo a partir del ledger o mantén una proyección/cache transaccional verificable. Si creas una tabla de balance por rendimiento, debe actualizarse en la misma transacción y existir un comando o prueba de reconciliación con el ledger.

---

## 11. API REST mínima

Usa prefijo `/api/v1`. Devuelve paginación, filtros y errores consistentes. Ejemplos de endpoints:

### Autenticación

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/change-password`
- `POST /auth/quick-unlock`
- `GET /auth/me`

### Empleados

- `GET /employees?search=&branchId=&status=&cursor=`
- `POST /employees`
- `GET /employees/:id`
- `PATCH /employees/:id`
- `POST /employees/:id/deactivate`
- `POST /employees/:id/reactivate`
- `GET /employees/:id/balance`
- `GET /employees/:id/summary?from=&to=`
- `GET /me/ledger` para autoservicio, sin aceptar otro `employeeId`.

### Movimientos

- `GET /movements?employeeId=&branchId=&categoryId=&status=&from=&to=&cursor=`
- `POST /movements`
- `GET /movements/:id`
- `POST /movements/:id/approve`
- `POST /movements/:id/reject`
- `POST /movements/:id/reverse`
- `POST /movements/:id/replace`
- `POST /movements/:id/acknowledge`
- `POST /movements/:id/disputes`
- `POST /movements/sync-batch` para cola offline, con resultado individual idempotente.

### Categorías y accesos rápidos

- `GET /movement-categories`
- CRUD administrativo con reglas de inmutabilidad.

### Nómina

- CRUD de periodos.
- `POST /payroll-batches`
- `GET /payroll-batches/:id`
- `PATCH /payroll-batches/:id/items`
- `POST /payroll-batches/:id/submit-review`
- `POST /payroll-batches/:id/lock`
- `POST /payroll-batches/:id/apply`
- `POST /payroll-batches/:id/close`
- `POST /payroll-batches/:id/reopen`
- `GET /payroll-batches/:id/export?format=csv|xlsx|pdf`

### Reportes, administración y salud

- Endpoints de reportes con filtros y exportación.
- CRUD de sucursales, usuarios, ajustes y categorías según permisos.
- `GET /audit-logs` solo para roles autorizados.
- `GET /notifications` y acciones de lectura.
- `GET /health/live`
- `GET /health/ready`

No tomes esta lista como permiso para crear controladores gigantes. Usa casos de uso claros y DTOs específicos. Documenta ejemplos, respuestas y códigos de error en Swagger.

Formato de error sugerido:

```json
{
  "statusCode": 422,
  "code": "MOVEMENT_LIMIT_EXCEEDED",
  "message": "El monto supera el límite semanal permitido.",
  "fieldErrors": { "amount": "Máximo disponible: $500.00" },
  "requestId": "..."
}
```

---

## 12. Archivos e imágenes

Usa almacenamiento compatible con S3, preferentemente MinIO en el servidor propio, para fotos de empleado, logotipo y evidencias.

- Validar MIME real, extensión, tamaño y firma básica.
- Limitar tipos a imágenes seguras y PDF donde corresponda.
- Generar miniaturas para fotos.
- No servir archivos privados como bucket público.
- Entregar URLs firmadas de vida corta o un endpoint autorizado.
- Nombres de objeto aleatorios; nunca confiar en el nombre de archivo del cliente.
- Eliminar metadatos EXIF sensibles de fotos cuando sea viable.
- Configurar límites por variables de entorno.

Si MinIO no está configurado en desarrollo, proporciona una implementación local claramente separada, sin que cambie el contrato de almacenamiento.

---

## 13. Seguridad obligatoria

- Hash de contraseñas y PIN con Argon2id o equivalente moderno bien configurado.
- Access token de vida corta y refresh token rotatorio/revocable.
- Cookies seguras y protección CSRF si la estrategia lo requiere.
- Rate limit y bloqueo gradual en login/PIN, sin facilitar enumeración de cuentas.
- Validación y normalización de entradas en backend.
- Autorización por organización, sucursal, rol y relación con empleado.
- Consultas Prisma siempre acotadas por `organizationId`; evita IDOR.
- Nunca aceptar `organizationId`, `createdByUserId` o dirección contable como autoridad del cliente.
- Sanitizar nombres de archivo y texto mostrado.
- Content Security Policy compatible con la aplicación.
- No incluir secretos en logs o mensajes de error.
- Auditoría de login, cambios de permisos, movimientos, correcciones, exportaciones y cierres.
- Revocar sesiones al desactivar un usuario.
- Desactivar usuarios después de la baja lógica; preservar autoría histórica.
- Validar límites de exportación y evitar CSV injection ante valores que comiencen con `=`, `+`, `-` o `@`.
- Dependencias auditadas y lockfile versionado.
- `.env.example` solo con nombres y valores seguros de ejemplo.

---

## 14. Rendimiento y experiencia

- Primera carga ligera y división de código por rutas pesadas.
- Imágenes responsivas y miniaturas.
- Búsqueda con debounce corto.
- Paginación por cursor para movimientos y auditoría.
- Índices de base de datos alineados con filtros reales.
- No recalcular todo el historial del negocio en cada render.
- Servidor devuelve resúmenes ya calculados.
- Invalidar solo consultas afectadas tras registrar movimiento.
- Skeletons estables para evitar saltos de layout.
- Optimistic UI solo cuando sea seguro; el importe confirmado siempre debe reconciliarse con la respuesta del servidor.
- Toasts útiles, sin ocultar errores importantes.
- Confirmaciones para acciones irreversibles o financieras; no confirmar cada navegación trivial.
- Atajos opcionales en escritorio, pero todos los flujos deben funcionar táctilmente.

Accesibilidad mínima:

- Contraste WCAG AA.
- Navegación por teclado.
- Foco visible.
- Etiquetas reales para inputs.
- Diálogos con focus trap y cierre correcto.
- Lectura entendible de importes y estados para lectores de pantalla.
- No depender únicamente del color.
- Respetar `prefers-reduced-motion`.

---

## 15. Pruebas obligatorias

Configura y ejecuta:

### Backend

- Unitarias para cálculo de saldo, límites, permisos y selección/aplicación de lote.
- Integración contra PostgreSQL de prueba para transacciones importantes.
- Casos de idempotencia: mismo movimiento enviado dos veces produce un solo efecto.
- Dos intentos simultáneos de aplicar el mismo cargo no deben sobregirar la asignación.
- Reversa mantiene historial y corrige saldo.
- Saldo parcial se arrastra.
- Movimiento pendiente/rechazado no afecta saldo confirmado.
- Pruebas de aislamiento entre organizaciones y sucursales.
- Empleado A no puede consultar empleado B ni modificar un ID en la URL.
- Cajero no puede cerrar nómina ni consultar auditoría global.

### Frontend

- Componentes críticos y formularios.
- Estados loading, vacío, error, offline y sin permiso.
- Formato de dinero y fecha.
- Validación de monto y notas obligatorias.
- Navegación responsiva.

### E2E con Playwright

1. Owner inicia sesión, crea sucursal y empleado.
2. Cajero inicia sesión, encuentra empleado y registra comida.
3. El saldo se actualiza y aparece quién registró.
4. El mismo request reintentado no duplica el movimiento.
5. Encargado aprueba un adelanto por encima del umbral.
6. Empleado inicia sesión y solo ve su propia libreta.
7. Empleado solicita aclaración.
8. Nóminas crea lote, aplica una parte y el restante continúa.
9. Usuario autorizado corrige el último movimiento y existe cadena original-reversa-reemplazo.
10. Aplicación se renderiza sin overflow en los cuatro viewports establecidos.

Usa una base de datos aislada para pruebas. Nunca ejecutes tests destructivos contra producción.

---

## 16. Despliegue en servidor propio y Coolify

Entrega contenedores reproducibles:

- `apps/api/Dockerfile` multi-stage.
- `apps/web/Dockerfile` multi-stage para compilar y servir estáticos.
- `.dockerignore` correcto.
- `docker-compose.yml` para desarrollo/local con PostgreSQL y MinIO opcional.
- Healthchecks reales.
- Procesos sin ejecutar como root cuando sea viable.
- Migración de Prisma ejecutada de forma controlada con `prisma migrate deploy`, no `db push` en producción.
- Seed de producción separado y seguro para crear el primer propietario mediante variables o comando interactivo documentado.

Prioriza una configuración de mismo origen:

- `https://libreta.midominio.com` sirve frontend.
- `/api` se dirige al contenedor NestJS.

Si Coolify requiere dominios separados, documenta CORS, cookies y variables exactas para:

- `https://libreta.midominio.com`
- `https://api-libreta.midominio.com`

No uses esos dominios de ejemplo como valores finales sin confirmación.

Variables de entorno mínimas documentadas:

```text
NODE_ENV
PORT
DATABASE_URL
APP_URL
API_PUBLIC_URL
CORS_ORIGINS
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
ACCESS_TOKEN_TTL
REFRESH_TOKEN_TTL
COOKIE_DOMAIN
COOKIE_SECURE
DEFAULT_TIMEZONE
DEFAULT_CURRENCY
S3_ENDPOINT
S3_REGION
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
S3_FORCE_PATH_STYLE
MAX_UPLOAD_MB
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
LOG_LEVEL
```

Indica cuáles son opcionales. Valida variables al arrancar y falla con un mensaje claro si falta una obligatoria, sin imprimir secretos.

Incluye en `docs/deployment.md`:

1. Crear PostgreSQL y MinIO en Coolify.
2. Crear servicios web y API desde el repositorio.
3. Configurar dominios y red interna.
4. Definir variables.
5. Ejecutar migraciones.
6. Crear primer propietario.
7. Verificar `/health/ready`.
8. Configurar persistencia y copias de seguridad de PostgreSQL/MinIO.
9. Probar restauración en un entorno separado.
10. Estrategia de actualización y rollback.

No automatices una copia de seguridad que solo aparente funcionar. Documenta una política real: respaldo diario, retención definida, ubicación distinta al disco principal y prueba periódica de restauración.

---

## 17. Datos iniciales de desarrollo

Proporciona un seed idempotente **solo para desarrollo** con:

- Un negocio de demostración.
- Tres sucursales de demostración: Venecia, San Marcos y Américas.
- Usuarios para cada rol con contraseñas temporales documentadas únicamente en el README de desarrollo.
- Entre 6 y 10 empleados ficticios claramente identificados como demo.
- Categorías iniciales.
- Algunos movimientos distribuidos en fechas y estados.
- Un periodo y un lote en borrador.

No copies nombres/fotos reales de las imágenes. No uses rostros generados. Usa iniciales o avatares abstractos locales.

El seed no debe ejecutarse automáticamente en producción.

---

## 18. Criterios de aceptación de producto

La entrega se considera aceptable solo si se cumplen todos estos puntos:

1. Puede arrancarse desde cero siguiendo el README.
2. Las migraciones crean la base sin intervención manual.
3. Existe autenticación real y sesiones revocables.
4. Cada rol recibe exactamente los datos permitidos.
5. El rol empleado solo ve su propia libreta incluso manipulando rutas/API.
6. Un cajero puede registrar un movimiento en pocos toques desde una tablet.
7. El saldo se calcula correctamente con cargos, créditos, parciales y reversas.
8. Reintentar una petición no duplica el cargo.
9. Los movimientos publicados nunca desaparecen físicamente.
10. Los lotes de nómina pueden prepararse, exportarse, aplicarse y cerrarse.
11. El saldo restante se arrastra después de una aplicación parcial.
12. Los reportes respetan filtros y permisos.
13. La PWA muestra claramente cuándo algo está pendiente de sincronizar.
14. La interfaz conserva el estilo colorido de libreta de las referencias.
15. La interfaz no se convierte en un panel CRUD genérico.
16. No existe scroll horizontal en los viewports definidos.
17. Los botones y menús visibles realizan acciones reales.
18. Hay estados de carga, vacío, error y sin conexión diseñados.
19. Lint, tipos, pruebas y builds pasan.
20. Docker construye sin depender de archivos locales no versionados.
21. Healthchecks y migración de producción están documentados.
22. No hay secretos, contraseñas reales ni URLs privadas en Git.
23. `README.md`, Swagger y documentación de despliegue reflejan el sistema real.

---

## 19. Orden recomendado de implementación

Implementa en este orden, manteniendo cada fase operable:

### Fase 1: Base técnica

- Monorepo, lint, TypeScript, Docker local, PostgreSQL, Prisma, configuración y healthchecks.
- Tokens visuales, layout base y rutas.

### Fase 2: Identidad y acceso

- Organizaciones, sucursales, usuarios, sesiones, RBAC y aislamiento.
- Login y navegación por rol.

### Fase 3: Empleados y categorías

- CRUD protegido, fotos/iniciales, asignación de sucursales y configuración de categorías.

### Fase 4: Ledger principal

- Crear, listar, resumir, aprobar, rechazar, revertir y reemplazar movimientos.
- Idempotencia, auditoría y saldo correcto.
- Construir la pantalla principal con calidad visual alta.

### Fase 5: Nómina

- Periodos, lotes, asignaciones parciales, aplicación, cierre y exportaciones.

### Fase 6: Autoservicio y aclaraciones

- Vista privada, reconocimiento, comentarios y notificaciones.

### Fase 7: PWA/offline e impresión

- Cola idempotente, estados visuales, recibos, PDF y CSS de impresión.

### Fase 8: Calidad y entrega

- Reportes, pruebas E2E, capturas responsivas, hardening, documentación y contenedores finales.

No pospongas el diseño hasta el final. La pantalla principal debe acercarse a las referencias desde la Fase 4 y pulirse continuamente.

---

## 20. Entrega final que debes darme

Cuando termines, responde con:

1. Resumen de módulos implementados.
2. Árbol breve del proyecto.
3. Comandos exactos para desarrollo, pruebas, build y migraciones.
4. Variables de entorno pendientes.
5. Resultado de lint, typecheck, pruebas y build.
6. Rutas principales y roles que pueden usarlas.
7. Capturas o rutas de capturas en los cuatro tamaños requeridos.
8. Instrucciones de despliegue en Coolify.
9. Riesgos o limitaciones reales que queden; no ocultarlos.
10. Lista corta de mejoras futuras separadas del alcance terminado.

No me entregues únicamente una explicación de cómo podría hacerse. Constrúyelo. No declares que algo funciona sin ejecutarlo y verificarlo. No reduzcas la aplicación a datos estáticos. Mantén la dirección visual de las referencias durante todo el desarrollo: **libreta moderna, colorida, clara, práctica y rápida para un negocio real**.

