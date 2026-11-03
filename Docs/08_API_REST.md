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
| POST | `/api/usuarios` | UsuarioRegistro | 201 Usuario · 400 · 409 usuario o correo repetido |
| POST | `/api/auth/login` | Login | 200 LoginRespuesta · 401 |
| GET | `/api/usuarios/me` | — | 200 Usuario |
| PUT | `/api/usuarios/me` | UsuarioActualizar | 200 Usuario · 409 correo de otro usuario |
| PUT | `/api/usuarios/me/password` | CambioPassword | 204 · 400 contraseña actual incorrecta o igual a la nueva |

```json
// UsuarioRegistro
{ "nombre": "Ana", "apellidos": "Pérez", "nombreUsuario": "ana", "correo": "ana@correo.com", "password": "12345678" }

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

Igual que las de gasto, en `/api/categorias-ingreso`. Al borrar, 409 si tiene ingresos.

---

## Gastos

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/gastos` | — | 200 página de Gasto |
| POST | `/api/gastos` | GastoRegistro | 201 Gasto · 404 categoría |
| GET | `/api/gastos/{id}` | — | 200 Gasto |
| PUT | `/api/gastos/{id}` | GastoRegistro | 200 · 409 si lo gestiona un vehículo |
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

`metodoPago`: EFECTIVO, TARJETA o BIZUM. `origen`: MANUAL, REPOSTAJE, ACEITE, NEUMATICO, MANTENIMIENTO, ITV o TICKET.

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
  "categoriaIngresoId": 1, "categoriaIngresoNombre": "Nómina" }
```

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
| DELETE | `/api/vehiculos/{id}` | — | 204 · 409 si tiene registros (desactívalo) |

```json
// VehiculoRegistro (solo el nombre es obligatorio)
{ "nombre": "Mi coche", "marca": "Seat", "modelo": "Ibiza", "matricula": "1234ABC", "anio": 2018 }
```

La respuesta añade `id` y `activo`.

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

Todos los cuerpos llevan `categoriaId` y `metodoPago` (para el gasto) y aceptan `notas`. Todas las respuestas incluyen `id`, `vehiculoId`, `categoriaId`, `categoriaNombre` y `metodoPago`.

```json
// repostajes
{ "fecha": "2026-11-03", "litros": 40, "precioTotal": 60, "kilometros": 50000,
  "consumoOrdenador": 5.8, "velocidadMedia": 62, "categoriaId": 2, "metodoPago": "TARJETA" }
// La respuesta añade: precioLitro, kilometrosRecorridos, consumoReal, costePorKilometro
// (los tres últimos se calculan con el repostaje anterior; null si es el primero)

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

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/tickets` | — | 200 lista, más reciente primero |
| POST | `/api/tickets` | TicketRegistro | 201 |
| GET | `/api/tickets/{id}` | — | 200 |
| PUT | `/api/tickets/{id}` | TicketRegistro | 200 |
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
```

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

- Borrar la cuenta (`DELETE /api/usuarios/me`).
- Configuración.
- Etiquetas.
- Ingresos recurrentes.
- Objetivos.
- Recordatorios y calendario.
- IA: chat, OCR de tickets, resúmenes.
- Copias de seguridad.
- Estadísticas de vehículos.
- Ayuda.

---

# Objetivo final

La API REST es el único punto de comunicación entre el frontend y el backend. Mantiene un formato coherente en todos los módulos: DTOs directos, códigos HTTP estándar y un único formato de error.
