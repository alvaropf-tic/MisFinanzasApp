# Backend

> Documento: 06_Backend.md
>
> Versión: 1.1
>
> Estado: Implementado (V0)
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Cambios respecto al diseño inicial
3. Tecnologías
4. Estructura del proyecto
5. Capas
6. Módulos
7. Gestión de errores
8. Validaciones
9. Seguridad
10. Procesos automáticos
11. Almacenamiento de archivos
12. Monitorización y métricas
13. Configuración y perfiles
14. Testing
15. Buenas prácticas

---

# 1. Objetivo

El backend es el núcleo de la aplicación. Toda la lógica de negocio reside aquí.

El frontend únicamente envía peticiones y muestra la información recibida.

---

# 2. Cambios respecto al diseño inicial

| Diseño inicial | Implementación |
|---|---|
| Paquetes por capas | Paquetes por funcionalidad |
| `application.yml` | `application.properties` + `application-dev.properties` + `application-prod.properties` |
| SQLite JDBC | H2 |
| Capa `mapper` | Conversión en el propio Service |
| DTOs `Request` / `Response` | `XRegistroDTO` / `XResponseDTO` |
| JWT en la V1 | JWT desde la V0 |
| Campo `message` en los errores | Campo `mensaje` |
| Sin monitorización | Actuator + Prometheus |

---

# 3. Tecnologías

## Lenguaje

Java 21 LTS.

## Framework

Spring Boot 4.1.

## Dependencias

| Dependencia | Para qué |
|---|---|
| spring-boot-starter-webmvc | API REST |
| spring-boot-starter-data-jpa | Acceso a datos |
| spring-boot-starter-security | Seguridad |
| jjwt 0.12.6 | Tokens JWT |
| spring-boot-starter-validation | Validación de DTOs |
| spring-boot-h2console + h2 | Base de datos y su consola |
| lombok | Getters, setters y constructores |
| springdoc-openapi-starter-webmvc-ui 3.1.1 | Swagger UI |
| spring-boot-starter-actuator | Health y métricas |
| micrometer-registry-prometheus | Métricas en formato Prometheus |
| spring-boot-devtools | Recarga en desarrollo |

## Utilidades

Maven (con Maven Wrapper `./mvnw`).

---

# 4. Estructura del proyecto

```
Backend/mis-finanzas-backend/
├── pom.xml
├── data/                         (no se sube a git)
│   ├── misfinanzas.mv.db         base de datos de desarrollo
│   └── tickets/                  imágenes de los tickets
└── src/main/
    ├── java/com/misfinanzas/backend/
    │   ├── MisFinanzasBackendApplication.java
    │   ├── auth/
    │   ├── usuario/
    │   ├── categoria/
    │   ├── gasto/
    │   ├── ingreso/
    │   ├── gastoRecurrente/
    │   ├── presupuesto/
    │   ├── resumen/
    │   ├── estadistica/
    │   ├── vehiculo/
    │   ├── repostaje/
    │   ├── aceite/
    │   ├── neumatico/
    │   ├── mantenimiento/
    │   ├── itv/
    │   ├── ticket/
    │   ├── common/
    │   │   ├── dto/          PaginaResponseDTO
    │   │   ├── exception/    excepciones propias y GlobalExceptionHandler
    │   │   └── util/         PeriodoUtils, PaginacionUtils
    │   └── config/           SecurityConfig, CorsConfig, OpenApiConfig
    └── resources/
        ├── application.properties
        ├── application-dev.properties
        ├── application-prod.properties
        └── static/pruebas.html
```

Dentro de cada módulo:

```
modulo/
├── ModuloController
├── ModuloService
├── ModuloRepository
└── model/
    ├── Entidad (y sus enumerados)
    └── dto/
        ├── ModuloRegistroDTO
        └── ModuloResponseDTO
```

---

# 5. Capas

## Controller

- Recibe la petición y valida el cuerpo con `@Valid`.
- Obtiene el usuario autenticado (`authentication.getPrincipal()`).
- Devuelve el código correcto: 201 al crear, 204 al borrar.
- No contiene lógica de negocio.

## Service

- Un único Service por módulo, sin interfaz `ServiceImpl`.
- Contiene toda la lógica: comprobar que el recurso es del usuario, reglas de negocio, cálculos.
- Convierte las entidades en DTOs (`convertirAResponseDTO`).

## Repository

- Spring Data JPA.
- Consultas derivadas (`findByIdAndUsuarioId`) y `@Query` en JPQL para sumas, estadísticas y filtros opcionales.
- No contiene lógica.

## DTO

- `XRegistroDTO`: lo que envía el cliente, con sus validaciones.
- `XResponseDTO`: lo que devuelve la API.
- Nunca se exponen entidades.

---

# 6. Módulos

| Módulo | Ruta base | Notas |
|---|---|---|
| auth | `/api/auth` | Login y filtro JWT |
| usuario | `/api/usuarios` | Registro y perfil |
| categoria | `/api/categorias` | |
| ingreso | `/api/ingresos`, `/api/categorias-ingreso` | |
| gasto | `/api/gastos` | Filtros, paginación y origen |
| gastoRecurrente | `/api/gastos-recurrentes` | Incluye el scheduler |
| presupuesto | `/api/presupuestos` | Calcula gastado y previsión |
| resumen | `/api/resumen` | Resumen mensual |
| estadistica | `/api/estadisticas` | |
| vehiculo | `/api/vehiculos` | |
| repostaje, aceite, neumatico, mantenimiento, itv | `/api/vehiculos/{id}/...` | Cada registro crea su gasto |
| ticket | `/api/tickets` | Imagen y conversión en gasto |

La referencia de cada endpoint está en `08_API_REST.md`.

---

# 7. Gestión de errores

Las excepciones están centralizadas en `common/exception/GlobalExceptionHandler`.

| Excepción | Código |
|---|---|
| `RecursoNoEncontradoException` | 404 |
| `ConflictoException` | 409 |
| `CredencialesInvalidasException` | 401 |
| `IllegalArgumentException` | 400 |
| Validación de DTO (`@Valid`) | 400 con el mensaje del primer campo |
| JSON mal formado / enumerado no válido | 400 (lista los valores permitidos) |
| Tipo de parámetro incorrecto, parámetro obligatorio ausente | 400 |
| Ruta inexistente | 404 |
| Método no permitido | 405 |
| Content-Type no soportado | 415 |
| Archivo demasiado grande | 413 |
| Violación de restricción de la base de datos | 409 |
| Cualquier otra | 500, con la traza solo en el log |

Los 401 y 403 de Spring Security usan el mismo formato.

Formato de todas las respuestas de error:

```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "mensaje": "Gasto no encontrado", "path": "/api/gastos/99" }
```

---

# 8. Validaciones

- En los DTOs con Jakarta Validation: `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@DecimalMin`, `@Min`, `@Max`.
- Las reglas de negocio se comprueban en los Services: duplicados, borrados en uso, coherencia de fechas, límites de vehículos…
- Los periodos mes/año se validan con `PeriodoUtils` (mes 1–12, año 2000–2100).
- Paginación y rangos de fechas con `PaginacionUtils`.

---

# 9. Seguridad

- `SecurityConfig`: sesión sin estado, CSRF desactivado, `X-Frame-Options: SAMEORIGIN`.
- `JwtAuthFilter` valida el token en cada petición y carga el `Usuario` como principal.
- `JwtService` firma con HS256. Valida al arrancar que el secreto tenga al menos 32 caracteres.
- Contraseñas con BCrypt.
- `CorsConfig` permite solo los orígenes de `app.cors.allowed-origins`.
- Rutas públicas: registro, login, `/livez`, `/readyz` y, si están activadas (dev), consola H2, Swagger y `/pruebas.html`.
- Actuator solo es accesible por el puerto de gestión, que escucha en `127.0.0.1`.

---

# 10. Procesos automáticos

## Gastos recurrentes

`GastoRecurrenteScheduler` se ejecuta:

- Cada día a las 00:00.
- Al arrancar la aplicación, por si el servidor estaba apagado a medianoche.

Genera un Gasto por cada fecha pendiente (`proximaFecha <= hoy`), avanza la próxima fecha respetando el día de inicio y desactiva el recurrente al superar su `fechaFin`. Nunca duplica gastos.

---

# 11. Almacenamiento de archivos

- Imágenes de tickets en `app.tickets.directorio` (por defecto `./data/tickets`).
- Nombre aleatorio (UUID). Nunca se usa el nombre que manda el cliente.
- Formato detectado por los primeros bytes: JPG, PNG o WEBP.
- Máximo 5 MB (`spring.servlet.multipart.max-file-size`).
- Al sustituir o borrar la imagen, o borrar el ticket, se borra el archivo.

Pendiente: compresión, borrado automático y copias de seguridad.

---

# 12. Monitorización y métricas

| URL | Puerto | Acceso |
|---|---|---|
| `/livez`, `/readyz` | 8090 | Público |
| `/actuator/health`, `/actuator/info` | 8091 | Solo local |
| `/actuator/metrics`, `/actuator/prometheus` | 8091 | Solo local |

Métricas de negocio (en Prometheus):

| Métrica | Etiquetas |
|---|---|
| `misfinanzas_logins_total` | `resultado` = ok / fallido |
| `misfinanzas_gastos_creados_total` | `origen` = MANUAL, TICKET, REPOSTAJE… |
| `misfinanzas_tickets_convertidos_total` | — |

El contador de gastos lo lleva `GastoMetricasListener` (`@PostPersist`), así cuenta cualquier gasto, venga del módulo que venga.

## Logging

SLF4J. Se registran los errores no controlados (con traza), las violaciones de integridad y los fallos al borrar imágenes. No se registran datos sensibles.

---

# 13. Configuración y perfiles

| Archivo | Contenido |
|---|---|
| `application.properties` | Común: puerto, JWT (duración), CORS, tickets, Actuator, perfil por defecto `dev` |
| `application-dev.properties` | H2 en archivo, consola H2, Swagger, `/pruebas.html`, secreto JWT de desarrollo |
| `application-prod.properties` | Variables de entorno, sin herramientas de desarrollo |

Las variables de entorno de producción están en `10_Despliegue.md`.

---

# 14. Testing

## Implementado

- `src/main/resources/static/pruebas.html`: **suite de 186 pruebas** de integración que recorre todos los endpoints, incluidos los casos de error, y consola manual. Solo en dev.
- Test de arranque del contexto de Spring.

## Pendiente

- Tests unitarios de los Services con JUnit y Mockito.
- Tests de integración automatizados en Maven.
- Tests de OCR, IA y copias de seguridad cuando existan.

---

# 15. Buenas prácticas

## Controllers

Solo reciben y responden peticiones.

## Services

Toda la lógica del negocio. Un Service por módulo.

## Repositories

Solo acceso a datos.

## DTOs

Nunca exponer entidades.

## Errores

Lanzar la excepción propia adecuada; nunca construir respuestas de error a mano en el Controller.

## Métodos

Pequeños y descriptivos, en español.

## Código limpio

Priorizar la legibilidad frente a soluciones complejas.

---

# Flujo de una petición

```
Frontend
↓  Authorization: Bearer <token>
JwtAuthFilter  → valida el token
↓
Controller     → @Valid sobre el DTO
↓
Service        → reglas de negocio, propiedad del recurso
↓
Repository
↓
H2
↓
Service        → entidad → ResponseDTO
↓
Frontend       (o GlobalExceptionHandler → JSON de error)
```

---

# Escalabilidad

El backend está preparado para incorporar nuevos módulos sin modificar la arquitectura principal:

- Configuración, etiquetas, objetivos y recordatorios.
- IA (chat y OCR).
- Copias de seguridad.
- Notificaciones push.
- Finanzas compartidas.

---

# Conclusión

El backend de Mis Finanzas sigue una arquitectura modular basada en Spring Boot: cada funcionalidad en su paquete, toda la lógica en los Services y un tratamiento de errores, seguridad y monitorización común para todos los módulos.
