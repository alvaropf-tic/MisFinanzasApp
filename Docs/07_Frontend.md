# Frontend

> Documento: 07_Frontend.md
>
> Versión: 1.1
>
> Estado: En diseño
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Tecnologías
3. Filosofía del Frontend
4. Arquitectura
5. Organización del proyecto
6. Navegación
7. Pantallas
8. Componentes reutilizables
9. Gestión del estado
10. Comunicación con el backend
11. Temas y diseño
12. Rendimiento
13. Buenas prácticas

---

# 1. Objetivo

El frontend será la interfaz mediante la que el usuario interactuará con Mis Finanzas.

Su principal objetivo será ofrecer una experiencia rápida, sencilla e intuitiva.

Toda la lógica de negocio permanecerá en el backend.

---

# 2. Tecnologías

## Framework

Angular

---

## Plataforma

Ionic

---

## Lenguaje

TypeScript

---

## Estilos

SCSS

---

## Componentes

Ionic Components

---

## Iconos

Ionicons

---

# 3. Filosofía del Frontend

Durante el desarrollo deberán respetarse los siguientes principios.

## Simplicidad

La aplicación nunca deberá mostrar más información de la necesaria.

---

## Rapidez

Registrar un gasto deberá requerir el menor número posible de pasos.

---

## Coherencia

Todos los botones, colores y componentes deberán seguir el mismo estilo.

---

## Reutilización

Siempre que sea posible se reutilizarán componentes.

---

## Modularidad

Cada pantalla será independiente.

---

# 4. Arquitectura

El frontend seguirá una arquitectura modular.

```
Pages

↓

Components

↓

Services

↓

REST API
```

No existirá comunicación directa entre componentes y backend.

Siempre pasará por un Service.

---

# 5. Organización del proyecto

```
src/

└── app/

    ├── core/

    ├── shared/

    ├── pages/

    ├── components/

    ├── services/

    ├── models/

    ├── guards/

    ├── pipes/

    ├── assets/

    ├── environments/

    └── app.routes.ts
```

---

## Core

Servicios globales.

Ejemplos.

- AuthService
- ApiService
- StorageService
- ThemeService

---

## Shared

Componentes reutilizables.

Ejemplos.

- Tarjetas
- Inputs
- Botones
- Modales
- Chips
- Loader
- Confirmaciones

---

## Pages

Pantallas principales.

- Login
- Registro
- Inicio
- Finanzas
- Calendario
- Vehículos
- IA
- Perfil
- Configuración

---

## Components

Componentes reutilizables específicos.

Ejemplos.

- Barra de presupuesto
- Tarjeta de movimiento
- Tarjeta de vehículo
- Selector de categoría
- Selector de etiquetas
- Lista de movimientos

---

## Services

Comunicación con la API.

Ejemplos.

- MovimientoService
- VehiculoService
- UsuarioService
- IAService

---

## Models

Representación de los DTO recibidos del backend.

---

# 6. Navegación

La aplicación utilizará una barra inferior.

```
Inicio

Finanzas

Calendario

Vehículos

IA
```

El perfil será accesible desde el avatar situado en la parte superior.

---

# 7. Pantallas

## Login

- Usuario
- Contraseña
- Recordarme

---

## Registro

Creación de cuenta.

---

## Onboarding

Primer acceso.

Preguntas iniciales.

Ejemplos.

- ¿Cuál es tu sueldo?
- ¿Qué día cobras?
- ¿Tienes coche?
- ¿Quieres configurar la IA?

Todos los pasos podrán omitirse.

---

## Inicio

Mostrará únicamente la información importante.

- Presupuesto.
- Barra prevista.
- Últimos movimientos.
- Próximos eventos.
- Objetivo principal.

---

## Finanzas

Pantalla principal de gestión.

Permitirá.

- Buscar.
- Filtrar.
- Crear gasto.
- Crear ingreso.
- Editar.
- Eliminar.

---

## Calendario

Mostrará.

- Recurrentes.
- Recordatorios.
- ITV.
- Seguros.
- Nómina.

No mostrará compras normales.

---

## Vehículos

Listado de vehículos.

Acceso al detalle.

Dentro del detalle.

- Repostajes.
- Mantenimientos.
- Estadísticas.
- Historial.

---

## IA

Pantalla tipo chat.

Al entrar podrá mostrar.

- Resumen financiero.
- Consejo del mes.
- Avisos relevantes.

Nunca enviará mensajes automáticamente fuera del chat.

---

## Perfil

- Configuración.
- Estadísticas.
- Evolución financiera.
- Copias de seguridad.
- Exportar datos.
- Ayuda.

---

# 8. Componentes reutilizables

Ejemplos.

## BudgetProgressComponent

Barra del presupuesto.

Mostrará.

- Gasto real.
- Gasto previsto.

---

## FloatingActionButton

Botón "+".

Al pulsarlo mostrará un modal con.

- Nuevo gasto.
- Nuevo ingreso.
- Escanear ticket.

---

## MovementCard

Tarjeta de movimiento.

Mostrará.

- Importe.
- Categoría.
- Fecha.
- Método de pago.

---

## VehicleCard

Resumen del vehículo.

---

## StatCard

Tarjetas para estadísticas.

---

## ConfirmDialog

Confirmaciones.

---

## EmptyState

Pantalla cuando no existen datos.

---

# 9. Gestión del estado

En la V0 se utilizarán Services con Signals (Angular moderno) para compartir estado entre componentes cuando sea necesario.

No se utilizarán librerías como NgRx salvo que el proyecto lo requiera en el futuro.

---

# 10. Comunicación con el backend

Toda la comunicación se realizará mediante REST.

```
Page

↓

Service

↓

ApiService

↓

Spring Boot
```

Nunca se realizarán llamadas HTTP directamente desde una página.

## Detalles de la API ya implementada (noviembre 2026)

La referencia completa está en `08_API_REST.md`. Lo que más afecta al frontend:

- **URL base**: `http://<ip-del-servidor>:8090/api`. En `ionic serve` (puerto 8100) y en la app Android con Capacitor el CORS ya está permitido.
- **Autenticación**: `POST /api/auth/login` devuelve un `token` (válido 24 h). Un interceptor HTTP lo añadirá a todas las peticiones como `Authorization: Bearer <token>`.
- **401** significa sesión caducada o inválida: el interceptor debe cerrar la sesión y volver al login. El cambio de contraseña con la contraseña actual incorrecta devuelve **400**, así que no cierra la sesión.
- **Errores**: siempre `{ timestamp, status, error, mensaje, path }`. El campo `mensaje` está en español y se puede mostrar directamente al usuario.
- **Listados paginados** (`/api/gastos`, `/api/ingresos`): la lista viene en `contenido`, junto con `pagina`, `tamanio`, `totalElementos` y `totalPaginas`. Útil para el scroll infinito.
- **Imágenes de tickets**: se suben con `FormData` (campo `imagen`, máximo 5 MB, JPG/PNG/WEBP). Para mostrarlas hay que pedirlas con el token y convertirlas en blob; un `<img src>` directo daría 401.
- **Gastos de vehículos**: los gastos con `origen` de vehículo (REPOSTAJE, ACEITE, NEUMATICO, MANTENIMIENTO, ITV) no se pueden editar desde Finanzas; la interfaz debe llevar al registro del vehículo. Los de `TICKET` y `RECURRENTE` sí se editan.
- **Pagos recurrentes**: se crean y resumen en una sección arriba de Finanzas y se administran en `/recurrentes`. Sus gastos llevan un icono de bucle junto al importe.
- **Nombre de usuario**: no se puede cambiar en el perfil.

---

# 11. Temas y diseño

Tema inicial.

- Azul.

Modo.

- Claro.
- Oscuro.

En futuras versiones podrán añadirse nuevos colores.

---

## Tipografía

Se utilizará una única tipografía para mantener coherencia.

---

## Iconografía

Ionicons.

---

## Espaciado

Todos los componentes seguirán el mismo sistema de márgenes y separaciones.

---

# 12. Rendimiento

El frontend deberá priorizar.

- Lazy Loading.
- Componentes reutilizables.
- Carga progresiva.
- Optimización de imágenes.

---

# 13. Buenas prácticas

Durante el desarrollo.

- No duplicar componentes.
- No duplicar estilos.
- No colocar lógica de negocio en las páginas.
- Mantener componentes pequeños.
- Utilizar nombres descriptivos.
- Mantener una navegación sencilla.
- Priorizar la experiencia del usuario.

---

# Flujo de navegación

```
Login

↓

Onboarding (solo primera vez)

↓

Inicio

↓

Finanzas

↓

Calendario

↓

Vehículos

↓

IA

↓

Perfil
```

---

# Objetivo final

El frontend de Mis Finanzas debe ofrecer una experiencia moderna, rápida y sencilla, permitiendo al usuario gestionar sus finanzas sin sentirse abrumado por la cantidad de información disponible.

Toda decisión de diseño deberá priorizar la facilidad de uso frente a la incorporación de nuevas funcionalidades.