# Diagrama Entidad-Relación

> Documento: 04_Diagrama_Entidad_Relación.md
>
> Versión: 1.1
>
> Estado: Implementado (backend V0)
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Visión general
3. Cambios respecto al diseño inicial
4. Diagrama principal
5. Relaciones
6. Reglas de integridad
7. Futuras ampliaciones

---

# 1. Objetivo

Este documento define las relaciones entre las entidades de Mis Finanzas tal y como están implementadas.

Sirve como referencia para:

- Diseño de la base de datos.
- Entidades JPA.
- Desarrollo de la API.
- Consultas.
- Evolución futura del proyecto.

---

# 2. Visión general

La aplicación gira alrededor del **Gasto**.

Todo el dinero que sale es un Gasto, venga de donde venga:

- Creado a mano por el usuario.
- Generado por un gasto recurrente.
- Generado por un registro de vehículo (repostaje, aceite, neumáticos, mantenimiento o ITV).
- Creado al convertir un ticket.

Así el presupuesto, el resumen mensual y las estadísticas solo tienen que sumar una tabla.

Los ingresos van en su propia entidad, **Ingreso**, con sus propias categorías.

---

# 3. Cambios respecto al diseño inicial

- La entidad central `Movimiento` se ha dividido en **Gasto** e **Ingreso**.
- Las categorías también se dividen: **Categoría** (gastos) y **CategoríaIngreso** (ingresos).
- Los registros de vehículo y el ticket **apuntan desde el Gasto** (el gasto guarda la clave del registro), no al revés.
- Se añaden **Aceite**, **Neumático** e **ITV** como registros del vehículo.
- Etiqueta, Configuración, Objetivo, Recordatorio y las entidades de IA quedan pendientes.

---

# 4. Diagrama principal

```text
                               ┌──────────────┐
                               │   Usuario    │
                               └──────┬───────┘
          ┌───────────────┬───────────┼────────────┬───────────────┬──────────────┐
          │               │           │            │               │              │
   ┌──────▼──────┐ ┌──────▼─────┐ ┌───▼────┐ ┌─────▼──────┐ ┌──────▼─────┐ ┌──────▼─────┐
   │  Categoría  │ │ Categoría  │ │Presu-  │ │  Vehículo  │ │   Ticket   │ │   Gasto    │
   │             │ │  Ingreso   │ │puesto  │ │  (máx. 5)  │ │            │ │ Recurrente │
   └──────┬──────┘ └──────┬─────┘ └────────┘ └─────┬──────┘ └──────┬─────┘ └──────┬─────┘
          │               │                        │               │              │
          │        ┌──────▼─────┐                  │               │              │ genera
          │        │  Ingreso   │                  │               │              │
          │        └────────────┘                  │               │              │
          │                                        │               │              │
          │       ┌────────────────────────────────┤               │              │
          │       │   Repostaje                    │               │              │
          │       │   Aceite                       │               │              │
          │       │   Neumático     ◄──────────────┘               │              │
          │       │   Mantenimiento                                │              │
          │       │   ITV                                          │              │
          │       └──────────────┬─────────────────                │              │
          │                      │ 0..1                            │ 0..1         │
          │               ┌──────▼─────────────────────────────────▼──────┐       │
          └──────────────►│                    Gasto                       │◄──────┘
                    N:1   └────────────────────────────────────────────────┘
```

Todas las entidades de primer nivel pertenecen a un Usuario (también Gasto e Ingreso, aunque en el diagrama se dibujan bajo sus categorías).

---

# 5. Relaciones

## Usuario

Propietario de toda la información.

| Entidad | Cardinalidad |
|---|---|
| Categoría | 1 : N |
| CategoríaIngreso | 1 : N |
| Gasto | 1 : N |
| Ingreso | 1 : N |
| GastoRecurrente | 1 : N |
| Presupuesto | 1 : N (uno por mes y año) |
| Vehículo | 1 : N (máximo 5) |
| Ticket | 1 : N |

---

## Gasto

| Entidad | Cardinalidad | Columna |
|---|---|---|
| Categoría | N : 1 | categoria_id |
| Repostaje | 0..1 : 1 | repostaje_id (única) |
| Aceite | 0..1 : 1 | aceite_id (única) |
| Neumático | 0..1 : 1 | neumatico_id (única) |
| Mantenimiento | 0..1 : 1 | mantenimiento_id (única) |
| ITV | 0..1 : 1 | itv_id (única) |
| Ticket | 0..1 : 1 | ticket_id (única) |

Como mucho una de las seis claves de origen tiene valor. Si ninguna lo tiene, el gasto es MANUAL.

---

## Ingreso

| Entidad | Cardinalidad |
|---|---|
| CategoríaIngreso | N : 1 |

---

## GastoRecurrente

| Entidad | Cardinalidad |
|---|---|
| Categoría | N : 1 |

No hay relación guardada con los gastos que genera: cada gasto generado es un Gasto normal (origen MANUAL).

---

## Vehículo

| Entidad | Cardinalidad |
|---|---|
| Repostaje | 1 : N |
| Aceite | 1 : N |
| Neumático | 1 : N |
| Mantenimiento | 1 : N |
| ITV | 1 : N |

Cada registro pertenece a un único vehículo y tiene exactamente un Gasto.

---

# 6. Reglas de integridad

## Usuarios

No puede existir ninguna entidad sin un usuario propietario.

## Gastos

- Todo el dinero que sale se guarda como Gasto.
- Un registro de vehículo o un ticket tiene, como mucho, un gasto (columna única).

## Categorías

No se pueden eliminar si tienen gastos, recurrentes o ingresos asociados: la API devuelve 409. No hay reasignación automática.

## Vehículos

- Máximo cinco por usuario.
- No se pueden eliminar si tienen registros: se desactivan.
- Al borrar un registro de vehículo se borra también su gasto.

## Tickets

- Un ticket solo se convierte en gasto una vez.
- Al borrar el ticket, su gasto se conserva y queda desenlazado.

## Presupuestos

Restricción única por `(usuario_id, mes, anio)`.

---

# 7. Futuras ampliaciones

El modelo está preparado para incorporar nuevas entidades sin modificar las actuales.

## Pendientes de la V0

- Configuración (1:1 con Usuario).
- Etiqueta (N:M con Gasto, tabla intermedia `gasto_etiqueta`).
- IngresoRecurrente.
- Objetivo.
- Recordatorio.
- Conversación IA y Mensaje IA (borrado en cascada de los mensajes).

## V2

- Cuenta compartida.
- Invitación.
- Miembro.
- Permisos.

## Vehículos

- Documentación.
- Seguros.
- Fotografías.
- Múltiples conductores.

---

# Conclusión

El modelo de Mis Finanzas gira alrededor del **Gasto**: cualquier módulo que mueva dinero (vehículos, tickets, recurrentes) termina creando un Gasto.

Esto mantiene sencillos el presupuesto, el resumen y las estadísticas, y permite añadir nuevos módulos sin cambiar la forma de calcular.
