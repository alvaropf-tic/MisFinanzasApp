# Diseño UI/UX

> Documento: 12_UI_UX.md
>
> Versión: 1.0
>
> Estado: En diseño
>
> Última actualización: Agosto 2026

---

# Índice

1. Objetivo
2. Filosofía de diseño
3. Identidad visual
4. Navegación
5. Pantallas
6. Componentes reutilizables
7. Patrones de interacción
8. Accesibilidad
9. Animaciones
10. Responsive
11. Futuras mejoras

---

# 1. Objetivo

Este documento define la experiencia de usuario y el diseño visual de Mis Finanzas.

El objetivo es crear una aplicación sencilla, rápida y agradable de utilizar.

Cada pantalla deberá permitir realizar una tarea concreta con el menor número posible de pulsaciones.

---

# 2. Filosofía de diseño

Toda la interfaz seguirá estos principios.

## Simple

No mostrar información innecesaria.

---

## Clara

El usuario debe saber siempre dónde está.

---

## Consistente

Todos los botones y pantallas deberán comportarse igual.

---

## Moderna

Diseño limpio.

Sin elementos recargados.

---

## Rápida

Registrar un gasto debe tardar menos de 10 segundos.

---

# 3. Identidad visual

## Color principal

Azul.

---

## Colores secundarios

Verde

Éxito.

Rojo

Errores.

Naranja

Avisos.

Gris

Información secundaria.

---

## Tema

- Claro
- Oscuro

En futuras versiones se añadirán nuevos colores.

---

## Iconografía

Ionicons.

---

## Bordes

Redondeados.

---

## Tarjetas

Elevación ligera.

---

# 4. Navegación

Barra inferior.

```
🏠 Inicio

💳 Finanzas

📅 Calendario

🚗 Vehículos

🤖 IA
```

---

Parte superior.

```
☰ Logo

            Avatar
```

Al pulsar el avatar.

- Perfil
- Configuración
- Estadísticas
- Evolución financiera
- Copias de seguridad
- Ayuda

---

Botón flotante.

```
+
```

Abrirá un modal.

- Nuevo gasto
- Nuevo ingreso
- Escanear ticket

---

# 5. Pantallas

## Login

Muy simple.

- Usuario
- Contraseña
- Recordarme

---

## Registro

Formulario breve.

---

## Onboarding

Solo el primer inicio.

Pantallas independientes.

- Bienvenida
- Sueldo
- Día de cobro
- Presupuesto
- Vehículos
- IA

Todo podrá omitirse.

---

## Inicio

La pantalla principal mostrará únicamente:

- Presupuesto mensual.
- Barra prevista.
- Últimos movimientos.
- Próximos eventos.
- Objetivo de ahorro.

Nada más.

---

## Finanzas

Lista cronológica.

Filtros superiores.

Buscador.

Botón +.

---

## Calendario

Vista mensual.

Colores según evento.

---

## Vehículos

Lista.

Cada tarjeta mostrará.

- Marca.
- Modelo.
- Kilómetros.
- Próximo mantenimiento.

---

## IA

Chat.

Al abrir.

Resumen financiero.

No aparecerán mensajes fuera del chat.

---

# 6. Componentes reutilizables

## BudgetProgress

Barra doble.

- Presupuesto gastado.
- Presupuesto previsto.

---

## MovementCard

Movimiento.

---

## VehicleCard

Vehículo.

---

## StatCard

Estadísticas.

---

## EmptyState

Cuando no existan datos.

---

## ConfirmDialog

Confirmaciones.

---

## Loading

Carga.

---

## FAB

Botón flotante.

---

## Modal

Nuevo movimiento.

---

# 7. Patrones de interacción

## Deslizar

En movimientos.

- Editar.
- Eliminar.

---

## Mantener pulsado

Seleccionar varios movimientos.

(Futura mejora)

---

## Pull to Refresh

Actualizar.

---

## Animaciones

Suaves.

Máximo 250 ms.

---

# 8. Accesibilidad

Contraste suficiente.

Botones grandes.

Textos legibles.

No depender únicamente del color.

---

# 9. Responsive

V0.

Solo móvil.

---

V1.

Responsive para web.

---

# 10. Animaciones

Solo donde aporten valor.

Ejemplos.

- Abrir modal.
- Crear gasto.
- Cambiar pestañas.

Nunca ralentizar la aplicación.

---

# 11. Futuras mejoras

- Widgets.
- Temas personalizados.
- Personalización del Dashboard.
- Vista Tablet.
- Animaciones avanzadas.

---

# Objetivo final

Crear una aplicación elegante, intuitiva y rápida, donde cualquier usuario pueda gestionar sus finanzas sin necesidad de aprender a utilizarla.