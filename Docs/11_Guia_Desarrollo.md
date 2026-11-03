# Guía de Desarrollo

> Documento: 11_Guia_Desarrollo.md
>
> Versión: 1.1
>
> Estado: Activo
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Filosofía del proyecto
3. Puesta en marcha del backend
4. Herramientas de desarrollo
5. Flujo de desarrollo
6. Control de versiones
7. Convenciones de código
8. Estructura de ramas
9. Commits
10. Desarrollo de nuevas funcionalidades
11. Gestión de errores
12. Testing
13. Documentación
14. Checklist antes de publicar

---

# 1. Objetivo

Este documento define las normas de desarrollo del proyecto **Mis Finanzas**.

Su finalidad es mantener un código limpio, consistente y fácil de mantener a medida que la aplicación evolucione.

---

# 2. Filosofía del proyecto

## Simplicidad

La solución más sencilla será siempre la primera opción.

## Escalabilidad

Toda nueva funcionalidad debe permitir futuras ampliaciones.

## Legibilidad

El código debe ser fácil de entender meses después de haber sido escrito.

## Reutilización

Evitar duplicar código. Lo común va en el paquete `common`.

## Coherencia

Todo el proyecto deberá seguir las mismas convenciones.

---

# 3. Puesta en marcha del backend

Requisitos: **Java 21**. Maven no hace falta: el proyecto incluye el wrapper `./mvnw`.

```bash
cd Backend/mis-finanzas-backend
./mvnw spring-boot:run
```

Arranca en `http://localhost:8090` con el perfil `dev` y la base de datos en `./data/misfinanzas`.

Para trabajar sin tocar esa base de datos (por ejemplo, al usar la página de pruebas):

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:pruebas"
```

Solo compilar:

```bash
./mvnw compile
```

La configuración de producción y sus variables de entorno están en `10_Despliegue.md`.

> **Nota:** desde la versión 1.1 la clave JWT de desarrollo cambió; los tokens anteriores ya no sirven y hay que volver a hacer login.

---

# 4. Herramientas de desarrollo

Disponibles solo en el perfil `dev`:

| URL | Para qué |
|---|---|
| `http://localhost:8090/swagger-ui.html` | Documentación interactiva. *Authorize* → pegar el token |
| `http://localhost:8090/pruebas.html` | Suite automática de 186 pruebas y consola manual para lanzar peticiones |
| `http://localhost:8090/h2-console` | Consola de la base de datos. JDBC URL: `jdbc:h2:file:./data/misfinanzas`, usuario `sa`, sin contraseña |
| `http://127.0.0.1:8091/actuator/prometheus` | Métricas |

La página de pruebas crea usuarios de prueba con nombre aleatorio, recorre todos los endpoints y borra lo que crea (salvo los usuarios). Conviene usarla con la base de datos en memoria.

---

# 5. Flujo de desarrollo

Cada nueva funcionalidad seguirá este orden.

1. Actualizar la documentación si es necesario.
2. Diseñar el modelo de datos.
3. Crear entidades.
4. Crear repositorios.
5. Crear servicios.
6. Crear controladores.
7. Documentar la API (`08_API_REST.md`).
8. Añadir sus pruebas a `pruebas.html`.
9. Desarrollar el frontend.
10. Realizar pruebas.
11. Fusionar en la rama principal.

---

# 6. Control de versiones

El proyecto utiliza Git y GitHub.

Nunca se desarrollará directamente sobre `main`.

## Ramas principales

```
main
```

Versión estable.

```
develop
```

Integración de nuevas funcionalidades.

## Ramas de trabajo

Cada funcionalidad tendrá su propia rama.

```
feature/login
feature/etiquetas
feature/calendario
feature/ia
```

## Correcciones

```
fix/backend-revision
fix/presupuesto
fix/api
```

## Versiones

```
release/v1.0.0
release/v1.1.0
```

## Qué no se sube

La carpeta `data/` (base de datos e imágenes de tickets) y `target/` están en el `.gitignore`. Nunca se suben datos reales.

---

# 7. Convenciones de código

## Clases

PascalCase: `GastoService`.

## Métodos

camelCase y en español: `crearGasto()`.

## Variables

camelCase: `importeTotal`.

## Constantes

UPPER_CASE: `TAMANIO_MAXIMO`.

## Paquetes

Por funcionalidad y en minúsculas: `com.misfinanzas.backend.gasto`.

## Estructura de un módulo

```
modulo/
├── ModuloController
├── ModuloService          (uno por módulo, sin ServiceImpl)
├── ModuloRepository
└── model/
    ├── Entidad
    └── dto/
        ├── ModuloRegistroDTO
        └── ModuloResponseDTO
```

## Errores

Lanzar `RecursoNoEncontradoException` (404), `ConflictoException` (409), `CredencialesInvalidasException` (401) o `IllegalArgumentException` (400). Nunca devolver errores a mano desde el Controller.

## Archivos

UTF-8 y finales de línea CRLF.

---

# 8. Estructura de ramas

```
main
↓
develop
↓
feature/* · fix/*
```

Las ramas `feature` y `fix` se fusionan primero con `develop`. Solo cuando `develop` es estable se fusiona con `main`.

---

# 9. Commits

Los mensajes deberán ser claros y descriptivos.

```
feat: añadir creación de gastos
fix: corregir cálculo del presupuesto
docs: actualizar arquitectura
refactor: simplificar GastoService
style: mejorar diseño del dashboard
test: añadir pruebas del módulo IA
```

---

# 10. Desarrollo de nuevas funcionalidades

Antes de comenzar una funcionalidad comprobar:

- ¿Existe ya algo similar?
- ¿Es coherente con la filosofía de la aplicación?
- ¿Está documentada?
- ¿Es escalable?

Durante el desarrollo:

- Crear rama.
- Programar.
- Probar.
- Documentar.
- Fusionar.

---

# 11. Gestión de errores

- Todos los errores pasan por `GlobalExceptionHandler` y tienen el mismo formato JSON.
- Nunca mostrar trazas técnicas al usuario.
- Los errores no previstos se registran en el log con su traza.

---

# 12. Testing

Tipos de pruebas:

- **Integración**: `pruebas.html` (186 pruebas de todos los endpoints).
- Unitarias: pendientes (JUnit + Mockito sobre los Services).
- Manuales: consola de `pruebas.html` y Swagger.

Antes de publicar una versión se ejecutará la suite completa y deberá pasar entera.

---

# 13. Documentación

Toda modificación importante deberá reflejarse en la documentación.

Documentos afectados:

- Roadmap.
- Arquitectura.
- Modelo de datos y base de datos.
- API.
- Backend.
- Frontend.

---

# 14. Checklist antes de publicar

- Compila correctamente.
- La suite de `pruebas.html` pasa entera.
- Sin errores críticos.
- Sin código comentado innecesario.
- Sin archivos temporales ni datos reales en el commit.
- Base de datos actualizada.
- Documentación actualizada.
- API documentada.
- Copias de seguridad verificadas.

---

# Reglas del proyecto

## No programar sin documentación

Toda funcionalidad importante debe estar definida antes de implementarse.

## No romper funcionalidades existentes

Toda mejora debe mantener la compatibilidad con el resto de la aplicación.

## Pensar en el futuro

Aunque la V0 sea una aplicación sencilla, todas las decisiones deben facilitar la evolución hacia la V1 y la V2.

## Mantener la experiencia de usuario

Si una nueva funcionalidad complica el uso de la aplicación, deberá replantearse.

---

# Objetivo final

Desarrollar una aplicación sólida, mantenible y escalable, donde cada decisión técnica contribuya a construir un producto de calidad que pueda evolucionar durante años sin necesidad de rehacer su base.
