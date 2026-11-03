# Modelo de Datos

> Documento: 03_Modelo_Datos.md
>
> Versión: 1.1
>
> Estado: Implementado (backend V0)
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Principios del modelo
3. Cambios respecto al diseño inicial
4. Entidades implementadas
5. Enumerados
6. Relaciones
7. Reglas del negocio
8. Entidades pendientes
9. Observaciones

---

# 1. Objetivo

Este documento define las entidades que forman parte de Mis Finanzas.

Describe el modelo lógico **tal y como está implementado** en el backend. La parte que todavía no existe se recoge en la sección 8 para no perder el diseño original.

El detalle físico (tablas, columnas y tipos) está en `05_Diseño_Base_Datos.md`.

---

# 2. Principios del modelo

- Evitar información duplicada.
- Mantener relaciones simples.
- Facilitar futuras ampliaciones.
- Toda la información pertenece a un usuario y solo él puede verla.
- Todo el dinero que sale queda registrado como **Gasto** (también el de los vehículos y los tickets).

---

# 3. Cambios respecto al diseño inicial

| Diseño inicial (agosto 2026) | Implementación actual |
|---|---|
| Una única entidad `Movimiento` con tipo GASTO / INGRESO | Dos entidades separadas: **Gasto** e **Ingreso**, cada una con sus propias categorías |
| Identificadores UUID | Identificadores `Long` autoincrementales |
| `Recurrente` para gastos e ingresos | Solo **GastoRecurrente**. Los ingresos recurrentes quedan pendientes |
| Recurrentes con notificaciones | Sin notificaciones (módulo eliminado) |
| Vehículo con Repostaje y Mantenimiento | Vehículo con **Repostaje, Aceite, Neumático, Mantenimiento e ITV** |
| Ticket asociado a un Movimiento con OCR | Ticket independiente con imagen, que se puede **convertir en un Gasto**. OCR pendiente |
| El pago en efectivo no consume presupuesto | **Todos los gastos consumen presupuesto**, también los de efectivo |
| Presupuesto con `gastoReal` y `gastoPrevisto` guardados | Solo se guarda el importe; lo gastado y la previsión **se calculan** al consultarlo |

---

# 4. Entidades implementadas

## Usuario

Cuenta de la aplicación. Es el propietario de toda la información.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador |
| nombre | String (50) | Nombre |
| apellidos | String (100) | Apellidos |
| nombreUsuario | String (30), único | Nombre de acceso. Va dentro del token JWT y **no se puede cambiar** |
| correo | String (150), único | Correo electrónico |
| password | String | Contraseña cifrada con BCrypt |
| rol | Rol | USER o ADMIN |

---

## Categoría (de gasto)

Clasificación de los gastos. Cada usuario tiene las suyas.

| Campo | Tipo |
|---|---|
| id | Long |
| nombre | String (50), único por usuario |

## CategoríaIngreso

Clasificación de los ingresos. Independiente de las categorías de gasto.

| Campo | Tipo |
|---|---|
| id | Long |
| nombre | String (50), único por usuario |

---

## Gasto

Es la entidad más importante de la aplicación: cualquier dinero que sale.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | |
| importe | Decimal (10,2) | Mayor que 0 |
| fecha | Fecha y hora | |
| descripcion | String (255) | Opcional |
| metodoPago | MetodoPago | EFECTIVO, TARJETA o BIZUM |
| categoria | Categoría | Obligatoria |
| repostaje / aceite / neumatico / mantenimiento / itv | Registro de vehículo | Solo uno, si el gasto lo generó un vehículo |
| ticket | Ticket | Si el gasto se creó a partir de un ticket |

### Origen del gasto

No se guarda: se calcula a partir de sus relaciones y se devuelve en la API como `origen`.

| Origen | Cuándo |
|---|---|
| MANUAL | Creado por el usuario |
| REPOSTAJE, ACEITE, NEUMATICO, MANTENIMIENTO, ITV | Generado por el módulo de vehículos |
| TICKET | Creado al convertir un ticket |
| RECURRENTE | Generado por un gasto recurrente |

---

## Ingreso

Cualquier dinero que entra.

| Campo | Tipo |
|---|---|
| id | Long |
| importe | Decimal (10,2), mayor que 0 |
| fecha | Fecha y hora |
| descripcion | String (255), opcional |
| metodoIngreso | MetodoIngreso: EFECTIVO, TRANSFERENCIA o BIZUM |
| categoriaIngreso | CategoríaIngreso, obligatoria |

---

## GastoRecurrente

Gasto periódico (suscripciones, seguros, cuotas…). Un proceso automático genera el Gasto real cada vez que llega su fecha.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | |
| importe | Decimal (10,2) | |
| descripcion | String (255) | Obligatoria |
| metodoPago | MetodoPago | |
| periodicidad | Periodicidad | SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL o ANUAL |
| fechaInicio | Fecha | |
| proximaFecha | Fecha | Siguiente vez que se generará el gasto |
| fechaFin | Fecha | Opcional |
| activo | Boolean | Se puede pausar y reanudar |
| categoria | Categoría | |

---

## Presupuesto

Límite de gasto de un mes concreto.

| Campo | Tipo |
|---|---|
| id | Long |
| importe | Decimal (10,2), mayor que 0 |
| mes | 1–12 |
| anio | 2000–2100 |

Al consultarlo se calculan también:

- **gastado**: suma de los gastos del mes.
- **prevision**: lo gastado más los recurrentes activos que todavía caen dentro del mes.
- **restante**, **porcentajeGastado** y **porcentajePrevision**.

---

## Vehículo

Cada usuario puede registrar **hasta cinco** vehículos.

| Campo | Tipo |
|---|---|
| id | Long |
| nombre | String (100), obligatorio |
| marca | String (50) |
| modelo | String (50) |
| matricula | String (20) |
| anio | Integer |
| activo | Boolean |

---

## Registros del vehículo

Los cinco tipos de registro comparten la misma idea: **cada registro crea su Gasto** con la categoría y el método de pago indicados. Al editarlo o borrarlo se actualiza o se borra su gasto.

### Repostaje

| Campo | Tipo | Descripción |
|---|---|---|
| fecha | Fecha | |
| litros | Decimal (10,2) | |
| precioTotal | Decimal (10,2) | |
| precioLitro | Decimal (10,3) | Calculado: precioTotal / litros |
| kilometros | Integer | Cuentakilómetros |
| consumoOrdenador | Decimal | Opcional, el que marca el coche |
| velocidadMedia | Decimal | Opcional |
| metodoPago | MetodoPago | También se guarda aquí, además de en el gasto |
| notas | String (500) | |

En la respuesta se calculan, comparando con el repostaje anterior: **kilometrosRecorridos**, **consumoReal** (l/100 km) y **costePorKilometro**.

### Aceite

fecha, kilometros, precio, notas.

### Neumático

fecha, kilometros, **posicion** (PosicionNeumaticos), precio, notas.

### Mantenimiento

**tipo** (TipoMantenimiento), **titulo**, descripcion, fecha, kilometros, precio, notas.

### ITV

fecha, kilometros, **resultado** (ResultadoITV), precio, notas.

---

## Ticket

Justificante de una compra, con su imagen opcional.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | |
| fecha | Fecha | |
| comercio | String (100) | Obligatorio |
| importe | Decimal (10,2) | |
| descripcion | String (500) | |
| rutaImagen | String (500) | Nombre del archivo en el servidor. Nunca lo envía el cliente |

---

# 5. Enumerados

| Enumerado | Valores |
|---|---|
| Rol | USER, ADMIN |
| MetodoPago | EFECTIVO, TARJETA, BIZUM |
| MetodoIngreso | EFECTIVO, TRANSFERENCIA, BIZUM |
| Periodicidad | SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL |
| OrigenGasto (calculado) | MANUAL, REPOSTAJE, ACEITE, NEUMATICO, MANTENIMIENTO, ITV, TICKET, RECURRENTE |
| PosicionNeumaticos | DELANTEROS, TRASEROS, TODOS, DELANTERO_IZQUIERDO, DELANTERO_DERECHO, TRASERO_IZQUIERDO, TRASERO_DERECHO |
| TipoMantenimiento | MANTENIMIENTO, AVERIA_REPARACION |
| ResultadoITV | FAVORABLE, DESFAVORABLE, NEGATIVA |

Los métodos de pago son **fijos**: no son una tabla editable por el usuario.

---

# 6. Relaciones

```
Usuario
├── Categorías (1:N)
├── Categorías de ingreso (1:N)
├── Gastos (1:N)
├── Ingresos (1:N)
├── Gastos recurrentes (1:N)
├── Presupuestos (1:N, uno por mes)
├── Vehículos (1:N, máximo 5)
└── Tickets (1:N)
```

```
Vehículo
├── Repostajes (1:N)
├── Cambios de aceite (1:N)
├── Cambios de neumáticos (1:N)
├── Mantenimientos (1:N)
└── ITV (1:N)
```

```
Gasto
├── Categoría (N:1)
├── Repostaje | Aceite | Neumático | Mantenimiento | ITV (0..1)
└── Ticket (0..1)
```

```
Ingreso
└── CategoríaIngreso (N:1)
```

---

# 7. Reglas del negocio

## Propiedad de los datos

Cada usuario solo ve y modifica su propia información. Pedir un recurso de otro usuario devuelve **404**, como si no existiera.

## Gastos

- Todo el dinero que sale es un Gasto, incluidos los de vehículos y los de tickets.
- Los gastos generados por un vehículo **solo se modifican desde su módulo**. Editarlos o borrarlos desde `/api/gastos` devuelve 409.
- Los gastos que vienen de un ticket son gastos normales y sí se pueden editar y borrar.

## Efectivo

Todos los gastos consumen presupuesto, se paguen como se paguen. La filosofía original del efectivo (que no volviera a consumir presupuesto) queda descartada por ahora.

## Categorías

- El nombre no se puede repetir dentro del mismo usuario (409).
- **No se pueden borrar si tienen gastos, recurrentes o ingresos asociados** (409).

## Vehículos

- Máximo cinco por usuario (409).
- **Un vehículo con registros no se puede borrar** (409): hay que desactivarlo. Uno sin registros sí se borra.

## Presupuestos

- Uno por mes y año (409 si se repite, también al moverlo a otro mes).
- Mes entre 1 y 12, año entre 2000 y 2100.

## Periodos y fechas

- Todos los cálculos mensuales usan el intervalo `[día 1 a las 00:00, día 1 del mes siguiente a las 00:00)`, así un movimiento del día 1 a medianoche nunca cuenta en dos meses.
- Los filtros `desde` / `hasta` de los listados incluyen los dos días completos.

## Gastos recurrentes

- `fechaFin` no puede ser anterior a `fechaInicio`, ni `proximaFecha` anterior a `fechaInicio` (400).
- Los mensuales, trimestrales, semestrales y anuales **respetan el día de `fechaInicio`**: uno del día 31 se cobra el 28/29 en febrero y vuelve al 31 en los meses que lo tienen.
- El proceso se ejecuta cada día a medianoche y también al arrancar el servidor, por si estaba apagado. Nunca duplica gastos.
- Al superar `fechaFin` el recurrente se desactiva solo.
- Al crearlo o editarlo con `proximaFecha` de hoy o anterior, el gasto se genera al momento.
- Cada gasto generado guarda el recurrente que lo creó (origen RECURRENTE) y se puede editar suelto.
- Al reactivarlo no se cobran los periodos pausados. Al borrarlo, sus gastos se conservan sin el enlace.

## Tickets

- Un ticket solo se puede convertir en gasto **una vez** (409).
- Al borrar un ticket se borra su imagen, pero **su gasto se conserva** (pasa a origen MANUAL).

## Usuarios

- `nombreUsuario` y `correo` son únicos.
- El `nombreUsuario` no se puede cambiar después del registro.

---

# 8. Entidades pendientes

Del diseño inicial siguen pendientes:

| Entidad | Para qué |
|---|---|
| Configuración | Moneda, idioma, tema, conservación de tickets, proveedor y API Key de IA |
| Etiqueta | Clasificación secundaria de gastos (relación N:M) |
| IngresoRecurrente | Nómina y otros ingresos periódicos |
| Objetivo | Metas de ahorro |
| Recordatorio | Eventos del calendario (seguros, revisiones…) |
| Conversación IA / Mensaje IA | Chat con la IA |
| Datos de OCR del Ticket | fechaOCR, procesado |

Del Vehículo también quedan pendientes: combustible, kilómetros actuales y fecha de compra.

---

# 9. Observaciones

Este documento representa el modelo de Mis Finanzas tal y como está implementado en el backend.

Cualquier modificación importante deberá reflejarse en este documento.
