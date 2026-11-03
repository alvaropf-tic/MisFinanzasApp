# Diseño de la Base de Datos

> Documento: 05_Diseño_Base_Datos.md
>
> Versión: 1.1
>
> Estado: Implementado (backend V0)
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Motor de base de datos
3. Cambios respecto al diseño inicial
4. Convenciones
5. Tablas
6. Restricciones
7. Estrategia de borrado
8. Pendiente

---

# 1. Objetivo

Este documento describe la base de datos que utiliza Mis Finanzas.

Las tablas las genera Hibernate a partir de las entidades JPA, así que este documento refleja exactamente esas entidades.

---

# 2. Motor de base de datos

| Entorno | Motor | Ubicación |
|---|---|---|
| Desarrollo (perfil `dev`) | H2 en archivo | `./data/misfinanzas` |
| Producción (perfil `prod`) | H2 en archivo por defecto | `./data/misfinanzas-prod`, o la que indique `DB_URL` |
| Pruebas | H2 en memoria | `jdbc:h2:mem:pruebas` |
| V1 (previsto) | PostgreSQL | Servidor doméstico |

El esquema se crea y actualiza con `spring.jpa.hibernate.ddl-auto=update`.

Gracias a JPA, pasar a PostgreSQL solo requiere añadir su driver y cambiar `DB_URL`, `DB_USER` y `DB_PASSWORD`.

**Mejora pendiente:** usar migraciones con Flyway y `ddl-auto=validate` en producción, para controlar los cambios del esquema.

---

# 3. Cambios respecto al diseño inicial

| Diseño inicial | Implementación |
|---|---|
| SQLite | H2 (más sencillo de integrar con Spring Boot; PostgreSQL sigue previsto) |
| Tablas en singular | Tablas en plural (`usuarios`, `gastos`…) |
| Columnas en camelCase | Columnas en snake_case (convención de Hibernate) |
| Claves UUID | Claves `BIGINT` autoincrementales |
| `DECIMAL(12,2)` | `DECIMAL(10,2)` (precio por litro con 3 decimales) |
| Borrado lógico (`activo`) en general | Borrado físico, salvo el vehículo y el recurrente, que se pueden desactivar |
| Tabla `movimiento` | Tablas `gastos` e `ingresos` |

---

# 4. Convenciones

- Tablas en plural y snake_case.
- Columnas en snake_case (Hibernate convierte `fechaInicio` en `fecha_inicio`).
- Clave primaria `id BIGINT` autoincremental.
- Claves ajenas `<entidad>_id`.
- Importes en `DECIMAL(10,2)`. Nunca FLOAT.
- Enumerados guardados como texto (`EnumType.STRING`), nunca como número.
- Fechas: `TIMESTAMP` para gastos e ingresos; `DATE` para el resto.

---

# 5. Tablas

## usuarios

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| nombre | VARCHAR(50) | NOT NULL |
| apellidos | VARCHAR(100) | NOT NULL |
| nombre_usuario | VARCHAR(30) | NOT NULL, UNIQUE |
| correo | VARCHAR(150) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | NOT NULL (BCrypt) |
| rol | VARCHAR(10) | NOT NULL |

## categorias

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| nombre | VARCHAR(50) | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |

## categorias_ingreso

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| nombre | VARCHAR(50) | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |

## gastos

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| importe | DECIMAL(10,2) | NOT NULL |
| fecha | TIMESTAMP | NOT NULL |
| descripcion | VARCHAR(255) | |
| metodo_pago | VARCHAR(20) | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |
| categoria_id | BIGINT | NOT NULL, FK categorias |
| repostaje_id | BIGINT | UNIQUE, FK repostajes |
| aceite_id | BIGINT | UNIQUE, FK cambios_aceite |
| neumatico_id | BIGINT | UNIQUE, FK cambios_neumaticos |
| mantenimiento_id | BIGINT | UNIQUE, FK mantenimientos |
| itv_id | BIGINT | UNIQUE, FK itv |
| ticket_id | BIGINT | UNIQUE, FK tickets |

## ingresos

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| importe | DECIMAL(10,2) | NOT NULL |
| fecha | TIMESTAMP | NOT NULL |
| descripcion | VARCHAR(255) | |
| metodo_ingreso | VARCHAR(20) | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |
| categoria_ingreso_id | BIGINT | NOT NULL, FK categorias_ingreso |

## gastos_recurrentes

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| importe | DECIMAL(10,2) | NOT NULL |
| descripcion | VARCHAR(255) | NOT NULL |
| metodo_pago | VARCHAR(20) | NOT NULL |
| periodicidad | VARCHAR(20) | NOT NULL |
| proxima_fecha | DATE | NOT NULL |
| fecha_inicio | DATE | NOT NULL |
| fecha_fin | DATE | |
| activo | BOOLEAN | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |
| categoria_id | BIGINT | NOT NULL, FK categorias |

## presupuestos

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| importe | DECIMAL(10,2) | NOT NULL |
| mes | INTEGER | NOT NULL |
| anio | INTEGER | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |

UNIQUE (`usuario_id`, `mes`, `anio`).

## vehiculos

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| nombre | VARCHAR(100) | NOT NULL |
| marca | VARCHAR(50) | |
| modelo | VARCHAR(50) | |
| matricula | VARCHAR(20) | |
| anio | INTEGER | |
| activo | BOOLEAN | NOT NULL |
| usuario_id | BIGINT | NOT NULL, FK usuarios |

## repostajes

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| fecha | DATE | NOT NULL |
| litros | DECIMAL(10,2) | NOT NULL |
| precio_total | DECIMAL(10,2) | NOT NULL |
| precio_litro | DECIMAL(10,3) | NOT NULL |
| kilometros | INTEGER | NOT NULL |
| consumo_ordenador | DECIMAL | |
| velocidad_media | DECIMAL | |
| notas | VARCHAR(500) | |
| metodo_pago | VARCHAR(20) | NOT NULL |
| vehiculo_id | BIGINT | NOT NULL, FK vehiculos |

## cambios_aceite

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| fecha | DATE | NOT NULL |
| kilometros | INTEGER | NOT NULL |
| precio | DECIMAL(10,2) | NOT NULL |
| notas | VARCHAR(500) | |
| vehiculo_id | BIGINT | NOT NULL, FK vehiculos |

## cambios_neumaticos

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| fecha | DATE | NOT NULL |
| kilometros | INTEGER | NOT NULL |
| posicion | VARCHAR(30) | NOT NULL |
| precio | DECIMAL(10,2) | NOT NULL |
| notas | VARCHAR(500) | |
| vehiculo_id | BIGINT | NOT NULL, FK vehiculos |

## mantenimientos

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| tipo | VARCHAR(30) | NOT NULL |
| titulo | VARCHAR(100) | NOT NULL |
| descripcion | VARCHAR(500) | |
| fecha | DATE | NOT NULL |
| kilometros | INTEGER | NOT NULL |
| precio | DECIMAL(10,2) | NOT NULL |
| notas | VARCHAR(500) | |
| vehiculo_id | BIGINT | NOT NULL, FK vehiculos |

## itv

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| fecha | DATE | NOT NULL |
| kilometros | INTEGER | NOT NULL |
| resultado | VARCHAR(20) | NOT NULL |
| precio | DECIMAL(10,2) | NOT NULL |
| notas | VARCHAR(500) | |
| vehiculo_id | BIGINT | NOT NULL, FK vehiculos |

## tickets

| Columna | Tipo | Restricción |
|---|---|---|
| id | BIGINT | PK |
| fecha | DATE | NOT NULL |
| comercio | VARCHAR(100) | NOT NULL |
| importe | DECIMAL(10,2) | NOT NULL |
| descripcion | VARCHAR(500) | |
| ruta_imagen | VARCHAR(500) | Nombre del archivo (UUID) dentro de `app.tickets.directorio` |
| usuario_id | BIGINT | NOT NULL, FK usuarios |

Las imágenes **no** se guardan en la base de datos, sino en disco (`./data/tickets/` por defecto).

---

# 6. Restricciones

## En la base de datos

- `nombre_usuario` y `correo` únicos.
- Un presupuesto por usuario, mes y año.
- Cada registro de vehículo y cada ticket, como mucho en un gasto (claves únicas en `gastos`).
- Todas las claves ajenas obligatorias son `NOT NULL`.

## Comprobadas por el backend

- Máximo cinco vehículos por usuario.
- Nombre de categoría único dentro del usuario.
- No borrar categorías ni vehículos que estén en uso.
- Mes entre 1 y 12, año entre 2000 y 2100.

Si alguna restricción de la base de datos saltara sin haberse comprobado antes, la API responde 409 en lugar de un error interno.

---

# 7. Estrategia de borrado

| Entidad | Al borrarla |
|---|---|
| Categoría / CategoríaIngreso | Solo si no está en uso; si no, 409 |
| Gasto | Borrado físico. Los de vehículos solo desde su módulo |
| Registro de vehículo | Borra también su gasto |
| Vehículo | Solo si no tiene registros; si los tiene, se desactiva (`activo = false`) |
| GastoRecurrente | Borrado físico, o se pausa con `activo = false`. Los gastos ya generados se quedan |
| Ticket | Borra su imagen del disco y desenlaza su gasto, que se conserva |
| Usuario | Sin endpoint de borrado por ahora |

---

# 8. Pendiente

- Tablas de las entidades pendientes: configuración, etiquetas (`gasto_etiqueta`), ingresos recurrentes, objetivos, recordatorios y chat de IA.
- Índices explícitos por `usuario_id` y `fecha` en `gastos` e `ingresos` cuando crezca el volumen.
- Migraciones con Flyway.
- Migración a PostgreSQL en la V1.

---

# Conclusión

La base de datos sigue fielmente las entidades JPA: tablas sencillas, claves numéricas y una tabla central `gastos` a la que apuntan todos los módulos que mueven dinero.
