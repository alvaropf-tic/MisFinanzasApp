# Arquitectura

> Documento: 02_Arquitectura.md
>
> Versión: 1.1
>
> Estado: Backend implementado · Frontend pendiente
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Arquitectura general
3. Cambios respecto al diseño inicial
4. Principios de diseño
5. Tecnologías
6. Arquitectura del Frontend
7. Arquitectura del Backend
8. Base de datos
9. Inteligencia Artificial
10. Almacenamiento de archivos
11. Seguridad
12. Monitorización
13. Entornos
14. Despliegue
15. Convenciones del proyecto

---

# 1. Objetivo

Este documento define la arquitectura de Mis Finanzas.

Su finalidad es establecer una estructura sólida, mantenible y escalable que permita evolucionar el proyecto sin necesidad de rehacer componentes importantes.

---

# 2. Arquitectura general

Mis Finanzas sigue una arquitectura cliente-servidor.

```
┌─────────────────────────┐
│   App Ionic / Angular   │
│   (Android y web)       │
└──────────┬──────────────┘
           │  REST API + JWT
           │  puerto 8090
┌──────────▼──────────────┐      ┌────────────────────────┐
│      Spring Boot        │──────│ Actuator / Prometheus  │
│                         │      │ puerto 8091 (solo local)│
└──────────┬──────────────┘      └────────────────────────┘
           │ JPA
┌──────────▼──────────────┐      ┌────────────────────────┐
│   H2 (V0) / PostgreSQL  │      │ data/tickets/ (imágenes)│
└─────────────────────────┘      └────────────────────────┘
```

Toda la lógica de negocio reside en el backend.

El frontend únicamente muestra información y consume la API REST.

---

# 3. Cambios respecto al diseño inicial

| Diseño inicial | Implementación actual |
|---|---|
| SQLite en la V0 | **H2** en archivo (PostgreSQL sigue previsto para la V1) |
| Paquetes por capas (`controller/`, `service/`…) | **Paquetes por funcionalidad** (`gasto/`, `vehiculo/`…) |
| JWT en la V1 | **JWT desde la V0** |
| Sin monitorización | **Actuator, Micrometer y Prometheus** |
| Un solo entorno | **Perfiles `dev` y `prod`** |
| Capa de mappers | Conversión a DTO dentro de cada Service (`convertirAResponseDTO`) |

---

# 4. Principios de diseño

## Separación de responsabilidades

Cada capa tiene una única responsabilidad. No se mezcla lógica de negocio con lógica de presentación.

## Modularidad

Cada módulo (gastos, vehículos, tickets…) vive en su propio paquete y puede evolucionar de forma independiente.

## Reutilización

Lo común (errores, paginación, periodos) está en el paquete `common`.

## Escalabilidad

Añadir un módulo nuevo no obliga a modificar los existentes.

## Simplicidad

La solución más sencilla es siempre la preferida si ofrece el mismo resultado.

---

# 5. Tecnologías

## Frontend (pendiente)

- Angular
- Ionic
- Capacitor (Android)
- TypeScript
- SCSS

## Backend

- Java 21 LTS
- Spring Boot 4.1
- Spring Web MVC
- Spring Data JPA / Hibernate
- Spring Security + JWT (jjwt 0.12)
- Jakarta Validation
- Lombok
- springdoc-openapi 3 (Swagger)
- Spring Boot Actuator + Micrometer (Prometheus)

## Base de datos

- V0: H2
- V1: PostgreSQL

## Control de versiones

Git y GitHub.

## Contenedores (pendiente)

Docker y Docker Compose.

## IA (pendiente)

Groq como proveedor inicial. La arquitectura permitirá añadir otros.

---

# 6. Arquitectura del Frontend

Pendiente de desarrollo. La estructura prevista está en `07_Frontend.md`.

---

# 7. Arquitectura del Backend

Arquitectura por capas dentro de cada módulo:

```
Controller  →  recibe la petición y devuelve la respuesta
    ↓
Service     →  toda la lógica de negocio (uno por módulo)
    ↓
Repository  →  acceso a datos con Spring Data JPA
    ↓
Base de datos
```

Los módulos se organizan por funcionalidad:

```
com.misfinanzas.backend
├── auth            login y JWT
├── usuario
├── categoria
├── gasto
├── ingreso         ingresos y sus categorías
├── gastoRecurrente
├── presupuesto
├── resumen
├── estadistica
├── vehiculo
├── repostaje
├── aceite
├── neumatico
├── mantenimiento
├── itv
├── ticket
├── common          excepciones, DTO de paginación, utilidades
└── config          seguridad, CORS, OpenAPI
```

Cada módulo sigue la misma estructura:

```
gasto/
├── GastoController
├── GastoService
├── GastoRepository
└── model/
    ├── Gasto            (entidad)
    └── dto/
        ├── GastoRegistroDTO
        └── GastoResponseDTO
```

Toda la comunicación con el frontend se hace mediante DTOs. Nunca se devuelven entidades.

El detalle está en `06_Backend.md`.

---

# 8. Base de datos

Durante la V0 se utiliza **H2 en archivo** (`./data/misfinanzas`).

Motivos:

- Integrado con Spring Boot, sin instalación.
- Un único archivo, fácil de copiar y respaldar.
- Consola web incluida para desarrollo.

En la V1 se migrará a PostgreSQL. Spring Data JPA minimiza los cambios: basta con el driver y las variables `DB_URL`, `DB_USER` y `DB_PASSWORD`.

---

# 9. Inteligencia Artificial

Pendiente. El diseño se mantiene:

```
Usuario → Spring Boot → Proveedor IA → Spring Boot → Usuario
```

- Groq como proveedor inicial.
- Cada usuario introduce su propia API Key.
- La IA nunca modifica datos sin confirmación del usuario.

El OCR partirá de los tickets que ya se pueden subir con imagen.

---

# 10. Almacenamiento de archivos

Las imágenes de los tickets se guardan en disco, en `./data/tickets/` (configurable con `app.tickets.directorio`).

- El nombre del archivo es un UUID generado por el servidor.
- Solo JPG, PNG y WEBP, comprobados por su contenido. Máximo 5 MB.
- Solo el propietario puede descargarlas, siempre a través de la API con su token.

Pendiente: compresión de imágenes, borrado automático tras X días y copias de seguridad.

---

# 11. Seguridad

- Registro y login con usuario y contraseña. Contraseñas cifradas con **BCrypt**.
- **JWT** (HS256, 24 h) en la cabecera `Authorization: Bearer`.
- Sesión sin estado (`STATELESS`), CSRF desactivado.
- Cada usuario solo accede a sus datos; lo ajeno responde 404.
- **CORS** limitado a los orígenes configurados (`ionic serve`, Capacitor).
- En producción el secreto JWT viene de la variable `JWT_SECRET` (mínimo 32 caracteres) y el servidor no arranca sin él.
- En producción no hay consola H2, Swagger ni página de pruebas.
- Errores sin trazas internas hacia el cliente.

---

# 12. Monitorización

- `/livez` y `/readyz` en el puerto principal para saber si el servidor está vivo.
- Actuator (`health`, `info`, `metrics`, `prometheus`) en el **puerto 8091, solo accesible desde la propia máquina**.
- Métricas automáticas: peticiones HTTP por endpoint, JVM y pool de conexiones.
- Métricas de negocio: logins (ok / fallido), gastos creados por origen y tickets convertidos.

---

# 13. Entornos

| Perfil | Uso | Base de datos | Herramientas |
|---|---|---|---|
| `dev` (por defecto) | Desarrollo | `./data/misfinanzas` | Consola H2, Swagger, `/pruebas.html`, SQL en el log |
| `prod` | Producción | `DB_URL` (por defecto `./data/misfinanzas-prod`) | Ninguna; secreto JWT obligatorio |

---

# 14. Despliegue

## V0

```
Docker (pendiente)
└── Spring Boot + H2 en archivo
```

La aplicación móvil se conecta al backend por la red local.

## V1

```
Internet → Reverse proxy (HTTPS) → Spring Boot → PostgreSQL
```

La aplicación web y la móvil comparten el mismo backend.

Detalle en `10_Despliegue.md`.

---

# 15. Convenciones del proyecto

## Backend

- Paquetes por funcionalidad; `common` y `config` para lo general.
- Un único Service por módulo, sin interfaces `ServiceImpl`.
- DTOs en `model/dto`: `XRegistroDTO` para la entrada y `XResponseDTO` para la salida.
- Los Controllers solo reciben y responden.
- Los errores se lanzan como excepciones propias y los traduce `GlobalExceptionHandler`.

## Frontend

- Las páginas no contienen lógica de negocio.
- Los componentes son reutilizables.
- Los servicios gestionan toda la comunicación con la API.

## General

- Código limpio y nombres descriptivos en español.
- Comentarios solo cuando aportan.
- Documentar cualquier cambio importante.

---

# Resumen

La arquitectura de Mis Finanzas es modular, escalable y fácil de mantener. El backend ya está implementado siguiendo esta estructura y preparado para que el frontend lo consuma.
