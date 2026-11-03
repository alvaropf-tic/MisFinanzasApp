# Mis Finanzas

Aplicación de finanzas personales: gastos, ingresos, presupuestos, gastos recurrentes, vehículos y tickets.

Su filosofía: registrar el dinero debe ser rápido y comprender las finanzas, sencillo.

## Estado

| Parte | Estado |
|---|---|
| Backend (Spring Boot) | V0 en desarrollo avanzado |
| Frontend (Ionic + Angular) | Pendiente |
| IA (chat y OCR de tickets) | Pendiente |

## Tecnologías del backend

Java 21 · Spring Boot 4.1 · Spring Security + JWT · Spring Data JPA · H2 · springdoc (Swagger) · Actuator + Prometheus

## Arrancar el backend

Requisito: Java 21. Maven no hace falta, el proyecto incluye `./mvnw`.

```bash
cd Backend/mis-finanzas-backend
./mvnw spring-boot:run
```

Arranca en `http://localhost:8090` con el perfil de desarrollo y la base de datos en `data/misfinanzas`.

Para probar sin tocar esa base de datos:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:pruebas"
```

## URLs útiles (perfil de desarrollo)

| URL | Para qué |
|---|---|
| http://localhost:8090/swagger-ui.html | Documentación interactiva de la API |
| http://localhost:8090/pruebas.html | Suite de 186 pruebas automáticas y consola manual |
| http://localhost:8090/h2-console | Consola de la base de datos (`jdbc:h2:file:./data/misfinanzas`, usuario `sa`) |
| http://localhost:8090/livez | Estado del servidor |
| http://127.0.0.1:8091/actuator/prometheus | Métricas (solo desde la propia máquina) |

## Producción

```bash
./mvnw clean package
JWT_SECRET="una-clave-de-al-menos-32-caracteres" java -jar target/mis-finanzas-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Variables de entorno: `JWT_SECRET` (obligatoria), `DB_URL`, `DB_USER`, `DB_PASSWORD` y `CORS_ORIGINS`. En producción no están disponibles Swagger, la consola H2 ni la página de pruebas.

## Estructura del backend

Paquetes por funcionalidad (`gasto`, `ingreso`, `vehiculo`, `ticket`…), cada uno con su Controller, Service, Repository y `model/dto`. Lo común está en `common` y la configuración en `config`.

## Datos

La carpeta `Backend/mis-finanzas-backend/data/` guarda la base de datos y las imágenes de los tickets. Está en el `.gitignore` y nunca se sube al repositorio.

## Documentación

La documentación del proyecto (visión, roadmap, arquitectura, modelo de datos, API, despliegue…) se mantiene fuera del repositorio, en la carpeta `docs/` del proyecto. La referencia completa de la API está en `08_API_REST.md`.
