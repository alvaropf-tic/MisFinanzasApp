# Despliegue e Infraestructura

> **Despliegue actual (noviembre 2026):** homelab en Raspberry Pi 4 con Docker Compose (PostgreSQL 16, backend
> Spring Boot y web servida por Nginx, que reenvía `/api` al backend). Acceso privado por Tailscale en
> `http://finanzas.alvaro-homelab`. Archivos y guía paso a paso en `deploy/homelab/` (README, docker-compose,
> `.env.example`, `backup.sh` y `deploy.sh`).

> Documento: 10_Despliegue.md
>
> Versión: 1.1
>
> Estado: Perfiles implementados · Docker pendiente
>
> Última actualización: Noviembre 2026

---

# Índice

1. Objetivo
2. Filosofía
3. Cambios respecto al diseño inicial
4. Entornos y perfiles
5. Puertos
6. Variables de entorno
7. Arranque
8. Arquitectura V0
9. Arquitectura V1
10. Docker
11. Base de datos
12. Almacenamiento
13. Copias de seguridad
14. Seguridad
15. Monitorización
16. Escalabilidad

---

# 1. Objetivo

Definir cómo se ejecuta y despliega Mis Finanzas en cada versión.

La infraestructura debe permitir evolucionar desde una aplicación local hasta un sistema accesible desde cualquier dispositivo sin modificar la lógica del proyecto.

---

# 2. Filosofía

- Simplicidad.
- Portabilidad.
- Escalabilidad.
- Nunca datos sensibles en el código: todo lo sensible llega por variables de entorno.

---

# 3. Cambios respecto al diseño inicial

| Diseño inicial | Implementación |
|---|---|
| SQLite | H2 en archivo |
| `storage/` | `data/` (base de datos e imágenes de tickets) |
| Configuración "por variables o archivos" | Perfiles `dev` / `prod` concretos y variables de entorno documentadas |
| Sin monitorización | Actuator en un puerto de gestión local |

---

# 4. Entornos y perfiles

| | Desarrollo (`dev`) | Producción (`prod`) |
|---|---|---|
| Cómo se activa | Por defecto, sin indicar nada | `--spring.profiles.active=prod` |
| Base de datos | `./data/misfinanzas` | `DB_URL` (por defecto `./data/misfinanzas-prod`) |
| Secreto JWT | Valor de desarrollo incluido | **Obligatorio** en `JWT_SECRET` |
| Consola H2 | ✅ `/h2-console` | ❌ |
| Swagger | ✅ `/swagger-ui.html` | ❌ |
| Página de pruebas | ✅ `/pruebas.html` | ❌ |
| SQL en el log | ✅ | ❌ |
| CORS | `ionic serve` y Capacitor | `CORS_ORIGINS` |

La base de datos de producción está separada de la de desarrollo, así una prueba en un perfil nunca toca los datos del otro.

---

# 5. Puertos

| Puerto | Escucha en | Contenido |
|---|---|---|
| 8090 | Todas las interfaces | API REST, `/livez`, `/readyz` (y en dev Swagger, consola H2 y pruebas) |
| 8091 | Solo `127.0.0.1` | Actuator: `health`, `info`, `metrics`, `prometheus` |

---

# 6. Variables de entorno

Solo se usan en el perfil `prod`.

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `JWT_SECRET` | **Sí** | — | Clave de firma de los tokens. Mínimo 32 caracteres. Sin ella el servidor no arranca |
| `DB_URL` | No | `jdbc:h2:file:./data/misfinanzas-prod` | URL JDBC de la base de datos |
| `DB_USER` | No | `sa` | Usuario de la base de datos |
| `DB_PASSWORD` | No | (vacía) | Contraseña de la base de datos |
| `CORS_ORIGINS` | No | `http://localhost,https://localhost,capacitor://localhost` | Orígenes permitidos, separados por comas |

Para generar un secreto seguro:

```bash
openssl rand -base64 48
```

---

# 7. Arranque

## Desarrollo

```bash
cd Backend/mis-finanzas-backend
./mvnw spring-boot:run
```

Para probar sin tocar la base de datos de desarrollo:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:pruebas"
```

## Producción

```bash
./mvnw clean package
JWT_SECRET="..." java -jar target/mis-finanzas-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Si falta `JWT_SECRET` o es demasiado corto, el servidor se detiene al arrancar con un mensaje claro.

---

# 8. Arquitectura V0

```
┌─────────────────────┐
│     App Android     │
│   Ionic/Capacitor   │
└──────────┬──────────┘
           │ HTTP :8090 (red local)
┌──────────▼──────────┐
│   Spring Boot API   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐   ┌──────────────┐
│   H2 (data/)        │   │ data/tickets │
└─────────────────────┘   └──────────────┘
```

La aplicación móvil se conecta al backend por la red local. No hay acceso desde Internet.

---

# 9. Arquitectura V1

```
              Internet
                  │ HTTPS
        ┌─────────▼─────────┐
        │  Reverse Proxy    │
        └─────────┬─────────┘
                  │ :8090
        ┌─────────▼─────────┐      Prometheus ─ :8091 (local)
        │  Spring Boot API  │
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │    PostgreSQL     │
        └───────────────────┘
          ▲             ▲
          │             │
     Web Angular    App Ionic
```

Un único backend para todas las plataformas. El puerto 8091 nunca se publica en el proxy.

---

# 10. Docker

⏳ Pendiente.

Previsto:

- **V0**: un contenedor con Spring Boot y un volumen para `data/`.
- **V1**: Docker Compose con Spring Boot, PostgreSQL, el reverse proxy y, opcionalmente, Prometheus + Grafana.

Las variables de entorno de la sección 6 se pasarán al contenedor.

---

# 11. Base de datos

## V0

H2 en archivo.

- Sin instalación.
- Un único archivo, fácil de copiar.
- Suficiente para un usuario.

## V1

PostgreSQL: multiusuario, más rendimiento y mejor escalabilidad.

La migración consiste en añadir el driver al `pom.xml` y configurar `DB_URL`, `DB_USER` y `DB_PASSWORD`.

---

# 12. Almacenamiento

```
data/
├── misfinanzas.mv.db        base de datos de desarrollo
├── misfinanzas-prod.mv.db   base de datos de producción
└── tickets/                 imágenes de los tickets
```

La carpeta `data/` está en el `.gitignore`: nunca se sube al repositorio.

La carpeta de imágenes se cambia con `app.tickets.directorio`.

---

# 13. Copias de seguridad

⏳ Pendiente desde la aplicación.

Mientras tanto, basta con copiar la carpeta `data/` con el servidor parado.

Previsto: una copia incluirá la base de datos, la configuración y, si el usuario quiere, los tickets.

---

# 14. Seguridad

- Secreto JWT por variable de entorno, validado al arrancar.
- Contraseñas con BCrypt.
- Herramientas de desarrollo desactivadas en producción.
- Actuator solo en local.
- CORS limitado a los orígenes configurados.
- HTTPS en la V1 mediante el reverse proxy.
- Pendiente: cifrar las API Keys de IA cuando existan.

---

# 15. Monitorización

```bash
curl http://localhost:8090/livez                   # ¿está vivo?
curl http://127.0.0.1:8091/actuator/health         # estado
curl http://127.0.0.1:8091/actuator/prometheus     # métricas
```

Prometheus, en la misma máquina o en Docker, puede leer `http://127.0.0.1:8091/actuator/prometheus` sin token.

---

# 16. Escalabilidad

La infraestructura permitirá incorporar fácilmente:

- Nuevos servicios.
- Caché.
- Notificaciones push.
- Integraciones externas.
- Nuevos proveedores IA.
- Paneles de Grafana sobre las métricas.

---

# Objetivo final

La infraestructura de Mis Finanzas está preparada para crecer desde una aplicación personal hasta una plataforma accesible desde varios dispositivos, manteniendo una configuración sencilla, segura y portable.
