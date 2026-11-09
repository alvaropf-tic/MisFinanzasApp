# API REST

> Documento: 08_API_REST.md
>
> Versión: 1.1
>
> Estado: Implementado (backend V0)
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Cambios respecto al diseño inicial
3. Convenciones
4. Autenticación
5. Formato de errores
6. Paginación y filtros
7. Endpoints
8. Documentación y pruebas
9. Pendiente

---

# 1. Objetivo

La API REST comunica el frontend con el backend. Este documento es la **referencia completa** de los endpoints implementados: 80 operaciones más 2 de estado del servidor.

Todos los ejemplos usan `http://localhost:8090`.

---

# 2. Cambios respecto al diseño inicial

| Diseño inicial | Implementación |
|---|---|
| Prefijo `/api/v1/` | Prefijo `/api/` sin versión |
| Respuestas envueltas en `{success, data, message}` | Se devuelve el DTO directamente; el código HTTP indica el resultado |
| Usuario y contraseña, JWT en la V1 | **JWT desde la V0** |
| `/movimientos` | `/gastos` e `/ingresos` por separado |
| `/auth/register`, `/auth/me` | `POST /api/usuarios` y `GET /api/usuarios/me` |
| Ordenación con `?sort=` | Orden fijo por fecha descendente |
| `/tickets/ocr` | Subida de imagen y conversión manual en gasto. OCR pendiente |

---

# 3. Convenciones

- JSON en el cuerpo de peticiones y respuestas (salvo la imagen del ticket).
- `GET` consulta, `POST` crea (**201**), `PUT` actualiza completo (**200**), `PATCH` cambia un estado, `DELETE` borra (**204** sin cuerpo).
- Fechas: `"2026-11-03"`. Fechas con hora: `"2026-11-03T13:45:00"`.
- Importes como números: `12.5`.
- Los enumerados se envían como texto: `"TARJETA"`.
- Un recurso de otro usuario responde **404**, igual que uno que no existe.

---

# 4. Autenticación

1. Registro: `POST /api/usuarios`.
2. Login: `POST /api/auth/login` → devuelve el token.
3. El resto de peticiones llevan la cabecera:

```
Authorization: Bearer <token>
```

El token dura **24 horas**. Lleva dentro el `nombreUsuario`, el `id` y el `rol`.

Sin token, o con un token caducado o falso, la API responde **401**.

Rutas públicas: `POST /api/usuarios`, `POST /api/auth/login`, `/livez`, `/readyz` y, solo en desarrollo, Swagger, la consola H2 y `/pruebas.html`.

---

# 5. Formato de errores

Todos los errores tienen el mismo formato:

```json
{
  "timestamp": "2026-11-03T12:30:15.123",
  "status": 409,
  "error": "Conflict",
  "mensaje": "Ya existe un presupuesto para ese mes",
  "path": "/api/presupuestos"
}
```

| Código | Cuándo |
|---|---|
| 400 | Datos no válidos, JSON mal formado, enumerado inexistente (el mensaje lista los valores permitidos), parámetro con tipo incorrecto, fechas incoherentes |
| 401 | Sin token o token no válido; login incorrecto |
| 403 | Autenticado pero sin permiso |
| 404 | El recurso no existe o es de otro usuario; ruta inexistente |
| 405 | Método HTTP no permitido en esa ruta |
| 409 | Conflicto con datos existentes: duplicados, borrar algo en uso, gasto gestionado por vehículos… |
| 413 | Imagen de más de 5 MB |
| 415 | Content-Type no soportado |
| 500 | Error interno. Nunca se envía la traza al cliente |

> El cambio de contraseña con la contraseña actual incorrecta devuelve **400**, no 401, para que el frontend no cierre la sesión.

---

# 6. Paginación y filtros

`GET /api/gastos` y `GET /api/ingresos` devuelven una página:

```json
{
  "contenido": [ ... ],
  "pagina": 0,
  "tamanio": 20,
  "totalElementos": 57,
  "totalPaginas": 3
}
```

| Parámetro | Descripción |
|---|---|
| `page` | Página, empezando en 0. Por defecto 0 |
| `size` | Tamaño, entre 1 y 100. Por defecto 20 |
| `desde`, `hasta` | Fechas `AAAA-MM-DD`, ambas incluidas |
| `texto` | Busca en la descripción sin distinguir mayúsculas |

Orden: fecha descendente. Todos los filtros son opcionales y se pueden combinar.

---

# 7. Endpoints

## Usuarios y autenticación

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/usuarios` | UsuarioRegistro | 201 Usuario · 400 (también si `aceptaTerminos` no es true) · 409 usuario o correo repetido |
| POST | `/api/auth/login` | Login | 200 LoginRespuesta · 401 |
| GET | `/api/usuarios/me` | — | 200 Usuario |
| PUT | `/api/usuarios/me` | UsuarioActualizar | 200 Usuario · 409 correo de otro usuario |
| PUT | `/api/usuarios/me/password` | CambioPassword | 204 · 400 contraseña actual incorrecta o igual a la nueva |
| POST | `/api/usuarios/me/eliminar` | `{ "password": "..." }` | 204 borra la cuenta y **todos** sus datos (también las fotos de tickets) · 400 contraseña incorrecta |

```json
// UsuarioRegistro
{ "nombre": "Ana", "apellidos": "Pérez", "nombreUsuario": "ana", "correo": "ana@correo.com", "password": "12345678", "aceptaTerminos": true }
// aceptaTerminos es obligatorio (términos de uso y privacidad, con el aviso de la IA de los tickets).
// Se guarda cuándo se aceptó y la versión (UsuarioService.VERSION_TERMINOS).

// Login
{ "nombreUsuario": "ana", "password": "12345678" }

// LoginRespuesta
{ "token": "eyJhbGciOi...", "id": 1, "nombreUsuario": "ana", "rol": "USER" }

// Usuario
{ "id": 1, "nombre": "Ana", "apellidos": "Pérez", "nombreUsuario": "ana", "correo": "ana@correo.com", "rol": "USER" }

// UsuarioActualizar (el nombreUsuario no se puede cambiar)
{ "nombre": "Ana", "apellidos": "Pérez López", "correo": "ana@nuevo.com" }

// CambioPassword
{ "passwordActual": "12345678", "passwordNueva": "nuevaClave1" }
```

Validaciones: `nombreUsuario` 3–30 caracteres, `password` mínimo 8, correo válido.

---

## Categorías de gasto

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/categorias` | — | 200 lista |
| POST | `/api/categorias` | `{ "nombre": "Comida" }` | 201 · 409 nombre repetido |
| GET | `/api/categorias/{id}` | — | 200 |
| PUT | `/api/categorias/{id}` | `{ "nombre": "Supermercado" }` | 200 · 409 |
| DELETE | `/api/categorias/{id}` | — | 204 · 409 tiene gastos o recurrentes |

Respuesta: `{ "id": 1, "nombre": "Comida" }`. Nombre de 2 a 50 caracteres.

## Categorías de ingreso

Igual que las de gasto, en `/api/categorias-ingreso`. Al borrar, 409 si tiene ingresos o ingresos recurrentes.

---

## Gastos

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/gastos` | — | 200 página de Gasto |
| POST | `/api/gastos` | GastoRegistro | 201 Gasto · 404 categoría |
| GET | `/api/gastos/{id}` | — | 200 Gasto |
| PUT | `/api/gastos/{id}` | GastoRegistro | 200 · 409 si lo gestiona un vehículo (los de ticket y recurrente sí se editan) |
| DELETE | `/api/gastos/{id}` | — | 204 · 409 si lo gestiona un vehículo |

Filtros de `GET /api/gastos`: `desde`, `hasta`, `categoriaId`, `metodoPago`, `texto`, `page`, `size`.

```
GET /api/gastos?desde=2026-11-01&hasta=2026-11-30&categoriaId=1&metodoPago=TARJETA&texto=mercadona&page=0&size=20
```

```json
// GastoRegistro
{ "importe": 12.5, "fecha": "2026-11-03T13:45:00", "descripcion": "Mercadona", "metodoPago": "TARJETA", "categoriaId": 1 }

// Gasto
{ "id": 7, "importe": 12.50, "fecha": "2026-11-03T13:45:00", "descripcion": "Mercadona", "metodoPago": "TARJETA",
  "categoriaId": 1, "categoriaNombre": "Comida", "origen": "MANUAL" }
```

`metodoPago`: EFECTIVO, TARJETA o BIZUM. `origen`: MANUAL, REPOSTAJE, ACEITE, NEUMATICO, MANTENIMIENTO, ITV, TICKET o RECURRENTE (generado por un gasto recurrente).

---

## Ingresos

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/ingresos` | — | 200 página de Ingreso |
| POST | `/api/ingresos` | IngresoRegistro | 201 |
| GET | `/api/ingresos/{id}` | — | 200 |
| PUT | `/api/ingresos/{id}` | IngresoRegistro | 200 |
| DELETE | `/api/ingresos/{id}` | — | 204 |

Filtros: `desde`, `hasta`, `categoriaIngresoId`, `metodoIngreso`, `texto`, `page`, `size`.

```json
// IngresoRegistro
{ "importe": 1500, "fecha": "2026-11-01T09:00:00", "descripcion": "Nómina", "metodoIngreso": "TRANSFERENCIA", "categoriaIngresoId": 1 }

// Ingreso
{ "id": 3, "importe": 1500.00, "fecha": "2026-11-01T09:00:00", "descripcion": "Nómina", "metodoIngreso": "TRANSFERENCIA",
  "categoriaIngresoId": 1, "categoriaIngresoNombre": "Nómina", "recurrente": false }
```

`recurrente`: true si lo generó un ingreso recurrente.

`metodoIngreso`: EFECTIVO, TRANSFERENCIA o BIZUM.

---

## Presupuestos

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/presupuestos?mes=11&anio=2026` | — | 200 · 404 si ese mes no tiene · 400 mes/año fuera de rango |
| POST | `/api/presupuestos` | PresupuestoRegistro | 201 · 409 ya existe ese mes |
| PUT | `/api/presupuestos/{id}` | PresupuestoRegistro | 200 · 409 el mes destino ya tiene presupuesto |
| DELETE | `/api/presupuestos/{id}` | — | 204 |

```json
// PresupuestoRegistro (mes 1–12, año 2000–2100)
{ "importe": 800, "mes": 11, "anio": 2026 }

// Presupuesto
{ "id": 2, "importe": 800.00, "mes": 11, "anio": 2026,
  "gastado": 320.50, "prevision": 410.49, "restante": 479.50,
  "porcentajeGastado": 40.06, "porcentajePrevision": 51.31 }
```

`prevision` = lo gastado + los recurrentes activos que aún caen dentro del mes.

---

## Gastos recurrentes

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/gastos-recurrentes` | — | 200 lista |
| GET | `/api/gastos-recurrentes/resumen/{anio}/{mes}` | — | 200 resumen del mes · 400 mes/año fuera de rango |
| POST | `/api/gastos-recurrentes` | RecurrenteRegistro | 201 · 400 fechas incoherentes |
| GET | `/api/gastos-recurrentes/{id}` | — | 200 |
| PUT | `/api/gastos-recurrentes/{id}` | RecurrenteRegistro | 200 |
| PATCH | `/api/gastos-recurrentes/{id}/estado` | — | 200 (alterna activo / pausado) |
| DELETE | `/api/gastos-recurrentes/{id}` | — | 204 |

```json
// RecurrenteRegistro
{ "importe": 9.99, "descripcion": "Netflix", "metodoPago": "TARJETA", "periodicidad": "MENSUAL",
  "fechaInicio": "2026-11-15", "proximaFecha": "2026-11-15", "fechaFin": null, "categoriaId": 1 }
```

La respuesta añade `id`, `activo` y `categoriaNombre`. `periodicidad`: SEMANAL, MENSUAL, TRIMESTRAL, SEMESTRAL o ANUAL.

- Al crear o editar, si `proximaFecha` es hoy o anterior, los gastos pendientes se generan **al momento** (no esperan a medianoche).
- Cada gasto generado queda enlazado al recurrente y llega con `origen` RECURRENTE.
- Al reactivar (PATCH estado) no se cobran los periodos pausados: `proximaFecha` salta a la siguiente desde hoy.
- Al borrar, los gastos ya generados se conservan sin el enlace (pasan a MANUAL).

```json
// Resumen de recurrentes del mes
{ "activos": 2, "cobrado": 9.99, "pendiente": 900.00, "total": 909.99,
  "proximoDescripcion": "Alquiler", "proximaFecha": "2026-11-20", "proximoImporte": 900.00 }
```

`cobrado`: gastos generados por recurrentes en el mes. `pendiente`: cobros que aún quedan (en el mes actual, desde mañana). `proximo*` son null si no hay activos.

---

## Ingresos recurrentes

Mismas rutas, reglas y respuestas que los gastos recurrentes, pero generan ingresos.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/ingresos-recurrentes` | — | 200 lista |
| GET | `/api/ingresos-recurrentes/resumen/{anio}/{mes}` | — | 200 resumen del mes · 400 mes/año fuera de rango |
| POST | `/api/ingresos-recurrentes` | IngresoRecurrenteRegistro | 201 · 400 fechas incoherentes |
| GET | `/api/ingresos-recurrentes/{id}` | — | 200 |
| PUT | `/api/ingresos-recurrentes/{id}` | IngresoRecurrenteRegistro | 200 |
| PATCH | `/api/ingresos-recurrentes/{id}/estado` | — | 200 (alterna activo / pausado) |
| DELETE | `/api/ingresos-recurrentes/{id}` | — | 204 |

```json
// IngresoRecurrenteRegistro
{ "importe": 1500, "descripcion": "Nómina", "metodoIngreso": "TRANSFERENCIA", "periodicidad": "MENSUAL",
  "fechaInicio": "2026-11-28", "proximaFecha": "2026-11-28", "fechaFin": null, "categoriaIngresoId": 1 }
```

La respuesta añade `id`, `activo` y `categoriaIngresoNombre`. Cada ingreso generado llega con `recurrente: true`; al borrar el recurrente se conserva con `recurrente: false`. El resumen tiene los mismos campos (`cobrado` son los ingresos ya generados).

---

## Objetivos de ahorro

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/objetivos` | — | 200 lista (más reciente primero) |
| POST | `/api/objetivos` | ObjetivoRegistro | 201 Objetivo |
| GET | `/api/objetivos/{id}` | — | 200 Objetivo |
| PUT | `/api/objetivos/{id}` | ObjetivoRegistro | 200 |
| DELETE | `/api/objetivos/{id}` | — | 204 (borra también sus aportaciones) |
| POST | `/api/objetivos/{id}/aportaciones` | AportacionRegistro | 201 Objetivo · 400 importe 0 o retirada mayor que lo ahorrado |
| DELETE | `/api/objetivos/{id}/aportaciones/{aportacionId}` | — | 200 Objetivo · 400 si lo ahorrado quedaría en negativo |

```json
// ObjetivoRegistro (fechaLimite e icono opcionales)
{ "nombre": "Vacaciones", "importeObjetivo": 1200, "fechaLimite": "2027-04-30", "icono": "airplane-outline" }

// AportacionRegistro: importe positivo = aportar, negativo = retirar
{ "importe": 300, "fecha": "2026-11-01", "nota": "Paga extra" }

// Objetivo
{ "id": 1, "nombre": "Vacaciones", "importeObjetivo": 1200.00, "fechaLimite": "2027-04-30", "icono": "airplane-outline",
  "creadoEn": "2026-11-09", "ahorrado": 300.00, "restante": 900.00, "porcentaje": 25, "completado": false,
  "ahorroMensualNecesario": 150.00, "mesesRestantes": 6,
  "aportaciones": [ { "id": 1, "importe": 300.00, "fecha": "2026-11-01", "nota": "Paga extra" } ] }
```

- Las aportaciones no son gastos: no cambian el saldo ni el presupuesto.
- `mesesRestantes` cuenta el mes actual; `ahorroMensualNecesario` es null sin fecha límite, completado o con la fecha pasada.

---

## Recordatorios

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/recordatorios` | — | 200 lista por fecha |
| POST | `/api/recordatorios` | Recordatorio | 201 |
| PUT | `/api/recordatorios/{id}` | Recordatorio | 200 |
| DELETE | `/api/recordatorios/{id}` | — | 204 |

```json
// Recordatorio (repeticion: NINGUNA, MENSUAL o ANUAL; la respuesta añade id)
{ "titulo": "Seguro del coche", "fecha": "2026-11-20", "nota": null, "repeticion": "ANUAL" }
```

El calendario calcula en el cliente en qué días caen los que se repiten (mismo día de cada mes o año).

---

## Resumen y estadísticas

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/resumen/{anio}/{mes}` | Resumen del mes |
| GET | `/api/estadisticas/gastos-por-categoria/{anio}/{mes}` | `[{ categoriaId, categoriaNombre, total }]` |
| GET | `/api/estadisticas/ingresos-por-categoria/{anio}/{mes}` | `[{ categoriaId, categoriaNombre, total }]` |
| GET | `/api/estadisticas/gastos-por-metodo-pago/{anio}/{mes}` | `[{ metodoPago, total }]` |
| GET | `/api/estadisticas/evolucion-gastos/{anioInicio}/{mesInicio}/{anioFin}/{mesFin}` | `[{ mes, anio, total }]`, un elemento por mes |

```json
// Resumen
{ "mes": 11, "anio": 2026, "ingresos": 1500.00, "gastos": 320.50, "presupuesto": 800.00,
  "prevision": 410.49, "restantePresupuesto": 479.50, "saldo": 1179.50 }
```

Sin presupuesto ese mes, `presupuesto` y `restantePresupuesto` valen 0 y `prevision` es igual a `gastos`. `saldo` = ingresos − gastos.

Errores: 400 si el mes no está entre 1 y 12, el año entre 2000 y 2100, o el inicio de la evolución es posterior al fin.

---

## Vehículos

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/vehiculos` | — | 200 lista |
| POST | `/api/vehiculos` | VehiculoRegistro | 201 · 409 ya tiene 5 |
| GET | `/api/vehiculos/{id}` | — | 200 |
| PUT | `/api/vehiculos/{id}` | VehiculoRegistro | 200 |
| PATCH | `/api/vehiculos/{id}/estado` | — | 200 (alterna activo / inactivo) |
| GET | `/api/vehiculos/{id}/resumen` | — | 200 km actuales, consumo medio, costes, gasto del año y última ITV |
| DELETE | `/api/vehiculos/{id}` | — | 204 · 409 si tiene registros (desactívalo) |

```json
// VehiculoRegistro (obligatorios: nombre y kilometrosIniciales, los km del cuentakilómetros al darlo de alta)
{ "nombre": "Mi coche", "marca": "Seat", "modelo": "Ibiza", "matricula": "1234ABC", "anio": 2018, "kilometrosIniciales": 50000 }

// Resumen del vehículo: GET /api/vehiculos/{id}/resumen
{ "vehiculoId": 1, "kilometrosActuales": 51234, "repostajes": 12, "consumoMedio": 6.12, "costePorKilometro": 0.094,
  "precioMedioLitro": 1.512, "gastadoAnio": 845.30, "ultimoRepostajeFecha": "2026-11-03",
  "ultimaItvFecha": "2026-03-12", "ultimaItvResultado": "FAVORABLE", "proximaItvFecha": "2028-03-12" }
// proximaItvFecha (estimada, reglas de España): desfavorable o negativa, +2 meses; hasta 10 años de antigüedad, +2 años;
// después, +1 año; sin ITV, 1 de enero del año de fabricación + 4. null si falta el año y no hay ITV
```

La respuesta del vehículo añade `id` y `activo`. En el resumen, consumo y costes son null sin datos suficientes;
`gastadoAnio` suma todos los registros del vehículo del año actual.

### Registros del vehículo

Los cinco submódulos tienen las mismas cinco operaciones:

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/vehiculos/{vehiculoId}/<registro>` | 200 lista, más reciente primero |
| POST | `/api/vehiculos/{vehiculoId}/<registro>` | 201 (crea también su gasto) |
| GET | `/api/vehiculos/{vehiculoId}/<registro>/{id}` | 200 |
| PUT | `/api/vehiculos/{vehiculoId}/<registro>/{id}` | 200 (actualiza también su gasto) |
| DELETE | `/api/vehiculos/{vehiculoId}/<registro>/{id}` | 204 (borra también su gasto) |

`<registro>` es `repostajes`, `aceites`, `neumaticos`, `mantenimientos` o `itv`.

**Cómo se cuentan los km y el consumo** (pensado para apuntar solo el *trip*):

- Al dar de alta el vehículo se indican los km del cuentakilómetros (`kilometrosIniciales`).
- En cada repostaje se apunta `kilometrosRecorridos`: los km hechos con el depósito anterior (el *trip*).
- `kilometros` de cada repostaje lo calcula el backend: km iniciales + suma de los trips, en orden de fecha.
  Si un repostaje trae `cuentakilometros` (lectura real), la cuenta continúa desde ese valor. Se recalcula
  todo el vehículo al crear, editar o borrar un repostaje o al cambiar los km iniciales.
- **Consumo real solo de lleno a lleno**: en un repostaje con `lleno`, litros e importe del tramo son los suyos
  más los de los parciales desde el lleno anterior; los km del tramo, la suma de sus trips. Los parciales no
  tienen consumo propio. `consumoReal` = litros × 100 / km; `costePorKilometro` = importe / km.
- `precioLitro` se guarda tal como se escribe (el del surtidor); si no llega, precioTotal / litros.

Todos los cuerpos llevan `categoriaId` y `metodoPago` (para el gasto) y aceptan `notas`. Todas las respuestas incluyen `id`, `vehiculoId`, `categoriaId`, `categoriaNombre` y `metodoPago`.

```json
// repostajes (hace falta kilometrosRecorridos —el trip— o cuentakilometros; precioLitro y lleno son opcionales)
{ "fecha": "2026-11-03", "litros": 40.03, "precioTotal": 60, "precioLitro": 1.499, "kilometrosRecorridos": 612,
  "lleno": true, "cuentakilometros": null, "consumoOrdenador": 5.8, "velocidadMedia": 62, "categoriaId": 2, "metodoPago": "TARJETA" }
// La respuesta añade: kilometros (cuentakilómetros calculado), kilometrosTramo, consumoReal y costePorKilometro
// (estos tres solo en los llenos, de lleno a lleno; null en los parciales)

// aceites
{ "fecha": "2026-11-03", "kilometros": 50000, "precio": 80, "categoriaId": 2, "metodoPago": "TARJETA" }

// neumaticos (posicion: DELANTEROS, TRASEROS, TODOS, DELANTERO_IZQUIERDO, DELANTERO_DERECHO, TRASERO_IZQUIERDO, TRASERO_DERECHO)
{ "fecha": "2026-11-03", "kilometros": 50000, "posicion": "DELANTEROS", "precio": 180, "categoriaId": 2, "metodoPago": "TARJETA" }

// mantenimientos (tipo: MANTENIMIENTO o AVERIA_REPARACION)
{ "tipo": "MANTENIMIENTO", "titulo": "Revisión", "descripcion": "Filtros", "fecha": "2026-11-03",
  "kilometros": 50000, "precio": 120, "categoriaId": 2, "metodoPago": "TARJETA" }

// itv (resultado: FAVORABLE, DESFAVORABLE o NEGATIVA)
{ "fecha": "2026-11-03", "kilometros": 50000, "resultado": "FAVORABLE", "precio": 45, "categoriaId": 2, "metodoPago": "TARJETA" }
```

---

## Tickets

La app crea los tickets **escaneando**: la IA lee la foto (`/leer`), rellena el gasto y, al guardarlo (`/gasto`),
el ticket con su foto queda dentro del gasto. El resto de rutas son de la versión anterior y siguen disponibles.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/tickets/leer` | multipart, campo `imagen` | 200 LecturaTicket (no guarda nada) · 503 IA sin configurar · 429 límite gratuito agotado · 502 Groq no responde |
| POST | `/api/tickets/gasto` | multipart: `datos` (JSON GastoConTicket) e `imagen` | 201 Gasto con `ticketId` · 400 imagen no válida |
| POST | `/api/tickets/gasto/{gastoId}` | multipart: `imagen` y `comercio` (opcional) | 201 Gasto · 409 ya tiene ticket. Guarda la foto en un gasto ya creado (el de un registro de vehículo escaneado) |
| GET | `/api/tickets` | — | 200 lista, más reciente primero |
| POST | `/api/tickets` | TicketRegistro | 201 |
| GET | `/api/tickets/{id}` | — | 200 |
| PUT | `/api/tickets/{id}` | TicketRegistro | 200 |

### Chat con la IA

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/ia/chat` | `{ pregunta (máx. 500), historial: [{ rol: user/assistant, texto }], moneda }` | 200 `{ respuesta }` · 400 pregunta vacía · 503 IA sin configurar · 429 límite gratuito agotado · 502 Groq no responde |

La conversación no se guarda: la app manda los últimos mensajes y el backend solo usa los 6 últimos. Como contexto
se manda un resumen compacto (totales y categorías de los últimos tres meses, presupuesto, pagos y cobros fijos y
objetivos), nunca los movimientos uno a uno, para gastar pocos tokens.
| DELETE | `/api/tickets/{id}` | — | 204 (borra la imagen; el gasto se conserva) |
| POST | `/api/tickets/{id}/imagen` | multipart, campo `imagen` | 200 Ticket · 400 formato no permitido · 413 más de 5 MB · 415 no es multipart |
| GET | `/api/tickets/{id}/imagen` | — | 200 la imagen (`image/jpeg`, `image/png` o `image/webp`) · 404 sin imagen |
| DELETE | `/api/tickets/{id}/imagen` | — | 204 · 404 sin imagen |
| POST | `/api/tickets/{id}/gasto` | TicketConversion | 201 Gasto · 409 ya convertido |

```json
// TicketRegistro
{ "fecha": "2026-11-03", "comercio": "Mercadona", "importe": 23.45, "descripcion": "Compra semanal" }

// Ticket
{ "id": 5, "fecha": "2026-11-03", "comercio": "Mercadona", "importe": 23.45, "descripcion": "Compra semanal",
  "imagenUrl": "/api/tickets/5/imagen", "gastoId": null }

// TicketConversion (si no se envía descripción se usa el comercio)
{ "categoriaId": 1, "metodoPago": "TARJETA", "descripcion": null }

// LecturaTicket: cada campo es null si la IA no lo ha podido leer. categoriaId es siempre una de las del usuario
// (la más parecida). tipo: COMPRA, REPOSTAJE, ITV, ACEITE, NEUMATICOS o MANTENIMIENTO (sin vehículos, siempre COMPRA).
// vehiculoId: el vehículo cuya matrícula sale en el ticket (admite letras cambiadas de orden). litros y precioLitro, solo en repostajes
{ "comercio": "ITV DE SIERO", "fecha": "2026-10-19", "importe": 45.32, "metodoPago": "TARJETA", "categoriaId": 4,
  "tipo": "ITV", "vehiculoId": 1, "litros": null, "precioLitro": null }

// GastoConTicket (parte "datos", con Content-Type application/json): un GastoRegistro más el comercio
{ "importe": 23.45, "fecha": "2026-11-08T13:20:00", "descripcion": "Mercadona", "metodoPago": "TARJETA",
  "categoriaId": 2, "comercio": "Mercadona" }
```

Lectura con IA:

- Usa un modelo de visión de **Groq** del plan gratuito (`app.ia.groq.modelo`, por defecto `qwen/qwen3.8-27b`, sin razonamiento). Se manda una sola foto (la app la reduce a 1600 px) y se pide un JSON corto.
- La clave **no va en el repositorio**: variable de entorno `GROQ_API_KEY` o el archivo `secretos.properties` (junto al `pom.xml`, en `.gitignore`) con `app.ia.groq.api-key=...`.
- Al borrar un gasto con ticket (también al borrar el registro de vehículo que lo creó) se borran el ticket y su foto. Los gastos llevan `ticketId` para pedir la foto con `GET /api/tickets/{ticketId}/imagen`.
- Los registros de vehículo (repostaje, aceite, neumáticos, mantenimiento, ITV) llevan `gastoId` y `ticketId`. La app, con un ticket de vehículo, crea el registro y después guarda la foto con `POST /api/tickets/gasto/{gastoId}`.

Notas para el frontend:

- La imagen se sube con `FormData` (`formData.append("imagen", archivo)`).
- Solo se aceptan JPG, PNG y WEBP. El tipo se comprueba por el contenido del archivo, no por la extensión.
- `imagenUrl` necesita el token: hay que pedirla con `fetch`/`HttpClient` y mostrarla como blob, no con un `<img src>` directo.
- Al subir una imagen nueva se sustituye la anterior.

---

## Estado del servidor

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/livez` | `{ "status": "UP" }` — el proceso está vivo |
| GET | `/readyz` | `{ "status": "UP" }` — listo para recibir peticiones |

Públicas. Las métricas completas están en el puerto de gestión (ver `10_Despliegue.md`).

---

# 8. Documentación y pruebas

Solo en el perfil de desarrollo:

| URL | Para qué |
|---|---|
| `http://localhost:8090/swagger-ui.html` | Swagger UI: todos los endpoints con sus modelos. Pulsa *Authorize* y pega el token |
| `http://localhost:8090/v3/api-docs` | Especificación OpenAPI en JSON |
| `http://localhost:8090/pruebas.html` | Página de pruebas: suite automática de 186 pruebas y consola manual |

---

# 9. Pendiente

Endpoints del diseño inicial que todavía no existen:

- Configuración.
- Etiquetas.
- Objetivos.
- IA: chat, OCR de tickets, resúmenes.
- Copias de seguridad.
- Estadísticas de vehículos.
- Ayuda.

---

# Objetivo final

La API REST es el único punto de comunicación entre el frontend y el backend. Mantiene un formato coherente en todos los módulos: DTOs directos, códigos HTTP estándar y un único formato de error.
