# Mis Finanzas

> Documento: 00_Visión_del_Proyecto.md
>
> Versión: 1.1
>
> Estado: En desarrollo
>
> Última actualización: Noviembre 2026

---

# Índice

1. Introducción
2. Objetivo del proyecto
3. Filosofía de la aplicación
4. Público objetivo
5. Funcionalidades principales
6. Organización de la aplicación
7. Inteligencia Artificial
8. Filosofía del efectivo
9. Versiones del proyecto
10. Objetivos a largo plazo
11. Principios de desarrollo

---

# 1. Introducción

**Mis Finanzas** es una aplicación multiplataforma orientada a la gestión de finanzas personales.

Su objetivo principal no es sustituir a un banco ni convertirse en un software de contabilidad, sino ofrecer una herramienta sencilla, rápida e inteligente que ayude al usuario a comprender mejor sus hábitos financieros y tomar mejores decisiones.

El proyecto nace con una filosofía muy clara:

> Registrar el dinero debe ser rápido.
>
> Comprender las finanzas debe ser sencillo.
>
> La tecnología debe ayudar sin complicar la experiencia.

Mis Finanzas estará disponible para dispositivos móviles y, en versiones posteriores, también mediante una aplicación web.

---

# 2. Objetivo del proyecto

El objetivo es desarrollar una aplicación que permita al usuario:

- Registrar ingresos y gastos.
- Controlar presupuestos.
- Analizar su evolución financiera.
- Gestionar objetivos de ahorro.
- Controlar el coste de sus vehículos.
- Gestionar gastos recurrentes.
- Escanear tickets mediante Inteligencia Artificial.
- Obtener recomendaciones financieras mediante un asistente inteligente.

Todo ello manteniendo una interfaz sencilla y agradable.

---

# 3. Filosofía de la aplicación

Toda decisión de diseño deberá respetar los siguientes principios.

## Simplicidad

La aplicación debe ser fácil de utilizar incluso para personas sin conocimientos financieros.

Registrar un movimiento nunca debe convertirse en una tarea pesada.

---

## Rapidez

Las acciones más frecuentes deberán poder realizarse en pocos segundos.

Ejemplo:

- Registrar un gasto.
- Registrar un ingreso.
- Escanear un ticket.
- Consultar el presupuesto.

---

## Privacidad

Los datos pertenecen exclusivamente al usuario.

La aplicación no dependerá de servicios externos para almacenar la información personal.

En la primera versión todos los datos permanecerán bajo el control del usuario.

---

## IA útil

La Inteligencia Artificial será una herramienta de ayuda.

Nunca tomará decisiones automáticamente.

Siempre será el usuario quien confirme cualquier cambio antes de guardarlo.

La IA podrá:

- responder preguntas.
- analizar gastos.
- clasificar movimientos.
- leer tickets.
- generar resúmenes.

---

## Organización

Cada pantalla tendrá un objetivo claro.

No se mezclarán funcionalidades diferentes en la misma vista.

La información mostrada será únicamente la necesaria.

---

## Evolución

El proyecto se desarrollará por versiones.

No se intentará implementar todas las funcionalidades desde el primer momento.

Cada versión deberá ser completamente funcional antes de comenzar la siguiente.

---

# 4. Público objetivo

Mis Finanzas está pensada para cualquier persona que quiera controlar sus finanzas personales sin utilizar herramientas complejas.

Especialmente para usuarios que:

- desean conocer en qué gastan su dinero.
- quieren establecer presupuestos.
- buscan ahorrar.
- utilizan varias suscripciones.
- desean controlar el coste de su vehículo.
- valoran la privacidad.

No está orientada a empresas ni a contabilidad profesional.

---

# 5. Funcionalidades principales

La aplicación estará formada por varios módulos.

## Inicio

Panel principal con la información más relevante.

Incluye:

- presupuesto mensual.
- gasto previsto.
- próximos eventos.
- últimos movimientos.
- objetivo principal.

---

## Finanzas

Centro de gestión económica.

Permitirá:

- registrar ingresos.
- registrar gastos.
- consultar el historial.
- gestionar categorías.
- gestionar etiquetas.
- gestionar presupuestos.
- gestionar gastos recurrentes.

---

## Calendario

Mostrará únicamente eventos relevantes.

Ejemplos:

- nómina.
- suscripciones.
- seguros.
- ITV.
- mantenimientos.
- recordatorios.

No mostrará todas las compras realizadas.

---

## Vehículos

Cada usuario podrá registrar hasta cinco vehículos.

Cada vehículo dispondrá de:

- repostajes.
- mantenimientos.
- costes.
- consumo.
- kilómetros.
- estadísticas.

También incluirá un buscador de gasolineras con los precios del combustible.

---

## Objetivos

Permitirá definir metas de ahorro.

Ejemplos:

- Viaje.
- Ordenador.
- Entrada de una vivienda.

Cada objetivo mostrará el progreso alcanzado.

---

## Estadísticas

Apartado destinado al análisis financiero.

Contendrá:

- gráficos.
- comparativas.
- evolución.
- estadísticas inteligentes.

No tendrá protagonismo dentro de la navegación principal.

---

## IA

El asistente inteligente podrá:

- responder preguntas.
- analizar hábitos financieros.
- generar resúmenes mensuales.
- leer tickets.
- clasificar automáticamente movimientos.

No enviará mensajes constantemente.

Únicamente ofrecerá información cuando el usuario acceda al chat.

---

# 6. Organización de la aplicación

La navegación principal estará formada por cinco apartados.

- Inicio
- Finanzas
- Calendario
- Mi coche
- IA

El resto de opciones estarán disponibles desde el perfil.

Ejemplo:

- Configuración.
- Estadísticas.
- Evolución financiera.
- Copias de seguridad.
- Exportar datos.
- Ayuda.

---

# 7. Inteligencia Artificial

La IA será uno de los elementos diferenciadores de Mis Finanzas.

Funciones previstas.

## Chat

Responder preguntas relacionadas con las finanzas del usuario.

---

## OCR

Escaneo automático de tickets.

El usuario únicamente deberá revisar la información antes de guardarla.

---

## Memoria financiera

La IA podrá utilizar el historial financiero para ofrecer respuestas más útiles.

---

## Resúmenes

Generará informes mensuales.

---

## Clasificación automática

Podrá sugerir categorías y etiquetas.

---

## API

La aplicación no proporcionará una API Key propia.

Cada usuario deberá introducir su propia API Key.

Inicialmente se utilizará Groq.

La arquitectura permitirá incorporar otros proveedores en futuras versiones.

---

# 8. Filosofía del efectivo

Mis Finanzas registra todo el dinero que gasta el usuario, se pague como se pague.

## Decisión actual (noviembre 2026)

**Todos los gastos consumen presupuesto**, tanto los pagados con tarjeta como en efectivo o Bizum.

- Aparecen en el historial.
- Aparecen en las estadísticas.
- Tienen categoría y método de pago.
- Pueden venir de un ticket.

Es la opción más sencilla de entender y de usar: lo que se registra como gasto, cuenta.

---

## Diseño original (descartado por ahora)

La idea inicial era controlar solo el dinero que abandona la cuenta bancaria:

- La **retirada de efectivo** consumiría presupuesto.
- El **pago en efectivo** se registraría, pero no volvería a consumir presupuesto, para no contar dos veces el mismo dinero.

Se podrá recuperar en el futuro si se añade un tipo de gasto "retirada de efectivo".

---

# 9. Versiones del proyecto

## V0

Aplicación completamente funcional.

Características principales.

- Uso desde dispositivo móvil.
- Backend ejecutándose localmente durante el desarrollo.
- Despliegue mediante Docker.
- Base de datos H2 (en el diseño inicial, SQLite).
- OCR.
- IA.
- Gestión financiera completa.

---

## V1

Migración al Home Server.

Nuevas funciones.

- Aplicación web.
- Acceso desde cualquier dispositivo.
- Base de datos centralizada.
- PostgreSQL.

---

## V2

Grandes mejoras.

Ejemplos.

- cuentas compartidas.
- automatizaciones.
- nuevos proveedores IA.
- nuevas estadísticas.
- integraciones.

---

# 10. Objetivos a largo plazo

El objetivo final del proyecto es convertirse en una aplicación financiera completa, privada y fácil de utilizar.

La prioridad nunca será incorporar cientos de funciones.

La prioridad será ofrecer una buena experiencia de usuario.

Cada nueva funcionalidad deberá aportar valor real.

---

# 11. Principios de desarrollo

Durante el desarrollo deberán respetarse las siguientes normas.

- Mantener el código limpio.
- Evitar duplicidades.
- Favorecer la reutilización.
- Diseñar pensando en futuras versiones.
- Mantener la simplicidad.
- Priorizar la experiencia del usuario.
- No añadir funcionalidades innecesarias.
- Documentar todas las decisiones importantes.
- Mantener separadas las responsabilidades del frontend y del backend.

---

# Conclusión

Mis Finanzas nace con una idea muy clara:

> Una aplicación sencilla, inteligente y privada para ayudar a las personas a comprender mejor sus finanzas.

El proyecto evolucionará progresivamente, incorporando nuevas funcionalidades sin perder nunca su filosofía inicial: simplicidad, privacidad y utilidad.