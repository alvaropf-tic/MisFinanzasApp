# Roadmap

> Documento: 01_Roadmap.md
>
> Versión: 1.1
>
> Estado: En desarrollo
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo del roadmap
2. Filosofía de desarrollo
3. Versiones del proyecto
4. Roadmap de la V0
5. Roadmap de la V1
6. Roadmap de la V2
7. Ideas futuras
8. Criterios para añadir nuevas funcionalidades

---

# 1. Objetivo del roadmap

Este documento define la planificación del desarrollo de **Mis Finanzas**.

Su objetivo es establecer un orden lógico para implementar las funcionalidades y evitar cambios de rumbo durante el desarrollo.

Todas las nuevas ideas deberán evaluarse antes de incorporarse al roadmap.

---

# 2. Filosofía de desarrollo

Mis Finanzas se desarrollará de forma incremental.

Cada versión deberá cumplir tres requisitos:

- Ser completamente funcional.
- Ser estable.
- Poder utilizarse como aplicación principal.

No se comenzará una nueva versión hasta finalizar completamente la anterior.

---

# 3. Versiones del proyecto

Actualmente el proyecto se divide en tres grandes versiones.

| Versión | Estado | Objetivo |
|----------|---------|----------|
| V0 | En desarrollo · backend avanzado, frontend pendiente | Aplicación móvil completamente funcional |
| V1 | Pendiente | Home Server y aplicación web |
| V2 | Pendiente | Funciones colaborativas y mejoras avanzadas |

---

# 4. Roadmap V0

## Objetivo

Desarrollar una aplicación móvil completa que funcione correctamente y permita gestionar todas las finanzas personales.

## Leyenda

| Marca | Significado |
|---|---|
| ✅ | Hecho en el backend |
| 🟡 | Parcial (el backend da los datos, falta la interfaz o parte de la función) |
| ⏳ | Pendiente |
| ❌ | Descartado por ahora |

Las tareas de interfaz dependen del frontend, que todavía no se ha empezado.

---

## Fase 1 — Preparación

- ✅ Crear repositorio GitHub.
- ✅ Crear documentación.
- ⏳ Configurar Angular.
- ⏳ Configurar Ionic.
- ✅ Crear proyecto Spring Boot.
- ✅ Configurar la base de datos (H2 en lugar de SQLite).
- ✅ Definir arquitectura.
- ✅ Definir modelo de datos.

---

## Fase 2 — Usuarios

- ✅ Login (JWT).
- ✅ Registro.
- ⏳ Recordarme (el token dura 24 h; falta guardarlo en la app).
- ⏳ Onboarding inicial.
- ⏳ Configuración básica.
- ✅ Gestión del perfil y cambio de contraseña.

---

## Fase 3 — Finanzas

Es el núcleo principal de la aplicación.

- ✅ Crear gasto.
- ✅ Crear ingreso.
- ✅ Editar movimiento.
- ✅ Eliminar movimiento.
- ✅ Historial (paginado).
- ⏳ Timeline (interfaz).
- ✅ Categorías (de gasto y de ingreso).
- ⏳ Etiquetas.
- ✅ Búsquedas (fechas, categoría, método de pago y texto).

---

## Fase 4 — Presupuesto

- ✅ Presupuesto mensual.
- 🟡 Barra de progreso (el backend da los porcentajes).
- ✅ Gasto previsto (incluye los recurrentes pendientes del mes).
- ⏳ Objetivos de ahorro.
- ✅ Evolución mensual.

---

## Fase 5 — Recurrentes

- ✅ Gastos recurrentes (se generan solos cada día y al arrancar).
- ⏳ Ingresos recurrentes.
- ❌ Notificaciones (módulo eliminado; se replanteará con el calendario).
- ❌ Configuración de avisos.

---

## Fase 6 — Calendario

- ⏳ Vista mensual.
- ⏳ Vista agenda.
- ⏳ Eventos.
- ⏳ Recordatorios.
- ⏳ Suscripciones.
- ⏳ Nómina.
- ⏳ ITV.
- ⏳ Seguros.

---

## Fase 7 — Vehículos

- ✅ Crear vehículo (máximo 5, se pueden desactivar).
- ✅ Repostajes.
- ✅ Mantenimientos.
- ✅ Cambios de aceite, neumáticos e ITV (no previstos al inicio).
- ✅ Historial de cada tipo de registro.
- 🟡 Estadísticas (consumo real y coste por kilómetro de cada repostaje).
- 🟡 Coste por kilómetro (por repostaje; falta el total del vehículo).
- ⏳ Registro mensual de kilómetros.
- ⏳ Recordatorios de mantenimiento.
- ⏳ Buscador de gasolineras.

---

## Fase 8 — Inteligencia Artificial

### Chat

- ⏳ Chat financiero.
- ⏳ Memoria financiera.
- ⏳ Consejos.

### OCR

- 🟡 Escaneo de tickets (ya se suben con imagen y se convierten en gasto a mano; falta la lectura automática).
- ⏳ Extracción automática.
- ⏳ Clasificación.

### Automatización

- ⏳ Sugerencia de etiquetas.
- ⏳ Sugerencia de categorías.

---

## Fase 9 — Estadísticas

- 🟡 Gráficas (datos por categoría, por método de pago y evolución).
- ⏳ Comparativas.
- ✅ Evolución.
- ✅ Resumen mensual (ingresos, gastos, presupuesto, previsión y saldo).
- ⏳ Estadísticas inteligentes.

---

## Fase 10 — Configuración

- ⏳ Tema.
- ⏳ Moneda.
- ⏳ API Key IA.
- ⏳ Notificaciones.
- ⏳ Gestión de tickets.
- ⏳ Idioma.
- ⏳ Formato de fecha.

---

## Fase 11 — Copias de seguridad

- ⏳ Crear copia.
- ⏳ Restaurar copia.
- ⏳ Exportar datos.
- ⏳ Importar datos.

---

## Fase 12 — Ayuda

- ⏳ Preguntas frecuentes.
- ⏳ Conceptos.
- ⏳ Primeros pasos.
- ⏳ Información de la aplicación.

---

## Fase 13 — Optimización

Antes de dar por finalizada la versión.

- 🟡 Rendimiento.
- ✅ Seguridad del backend (revisión de noviembre 2026).
- ✅ Gestión de errores centralizada.
- 🟡 Limpieza de código.
- ⏳ Optimización de consultas e índices.
- ⏳ Optimización de imágenes.
- ⏳ Optimización de la IA.

---

## Añadido durante el desarrollo

Funciones que no estaban en el plan inicial y ya están hechas:

- ✅ Documentación interactiva con Swagger (solo desarrollo).
- ✅ Monitorización con Actuator y métricas de Prometheus.
- ✅ Perfiles de desarrollo y producción, secreto JWT por variable de entorno.
- ✅ Página de pruebas con 186 pruebas automáticas de la API.
- ✅ CORS preparado para `ionic serve` y Capacitor.

---

# V1

## Objetivo

Convertir Mis Finanzas en una aplicación accesible desde cualquier dispositivo.

---

## Funcionalidades

- Home Server.
- Docker.
- PostgreSQL.
- Aplicación Web.
- Acceso remoto.
- Sincronización.
- Gestión de múltiples dispositivos.

---

## Mejoras

- Mejor rendimiento.
- Administración del servidor.
- Gestión remota.

---

# V2

Objetivo:

Ampliar la aplicación con nuevas funcionalidades.

---

## Funcionalidades previstas

### Compartición

- Cuentas compartidas.
- Presupuestos compartidos.
- Objetivos compartidos.

---

### IA

- Nuevos modelos.
- Automatizaciones.
- Más memoria.
- Análisis avanzados.

---

### Finanzas

- Nuevos informes.
- Comparativas avanzadas.
- Nuevas estadísticas.

---

### Vehículos

- Mejoras del módulo.
- Más tipos de mantenimiento.
- Integraciones.

---

# 7. Ideas futuras

Estas funcionalidades no forman parte del roadmap actual.

Quedarán registradas para futuras versiones.

Ejemplos.

- Widgets.
- Integración bancaria.
- Sincronización con Google Calendar.
- Modo tablet.
- Apple Watch.
- Wear OS.
- Comparativas entre años.
- Exportaciones avanzadas.

---

# 8. Criterios para añadir nuevas funcionalidades

Toda nueva funcionalidad deberá cumplir los siguientes requisitos.

## Aporta valor

Debe resolver un problema real.

---

## Mantiene la simplicidad

No debe complicar la interfaz.

---

## Es coherente

Debe seguir la filosofía de Mis Finanzas.

---

## No rompe versiones anteriores

Siempre que sea posible.

---

## Está documentada

Toda nueva funcionalidad deberá actualizar la documentación correspondiente antes de comenzar su desarrollo.

---

# Estado actual

*Noviembre 2026*

- **Documentación**: terminada y actualizada a lo implementado (versión 1.1).
- **Backend V0**: la mayor parte hecho y probado. Funcionan usuarios, gastos, ingresos, categorías, presupuestos, recurrentes, resumen, estadísticas, vehículos con sus cinco tipos de registro y tickets con imagen. Ha pasado una revisión completa de errores, seguridad y configuración.
- **Frontend**: pendiente. Es el siguiente paso.
- **Pendiente del backend**: configuración, etiquetas, objetivos, ingresos recurrentes, calendario, IA, copias de seguridad y Docker.

---

# Objetivo final

Construir una aplicación robusta, mantenible y escalable que permita gestionar las finanzas personales de forma sencilla, inteligente y privada.