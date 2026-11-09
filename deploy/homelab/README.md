# Despliegue en el homelab

Mis Finanzas en la Raspberry Pi 4 del homelab, con Docker Compose. Acceso privado por Tailscale, como el resto de
servicios: no se abre nada a Internet.

```text
Móvil / PC (Tailscale)
  └─ http://finanzas.alvaro-homelab ── dnsmasq ──> Nginx Proxy Manager (80)
                                                     └─> 192.168.68.58:8095
                                                           └─ misfinanzas-web (Nginx: web + /api)
                                                                └─ misfinanzas-backend (Spring Boot, 8090)
                                                                     └─ misfinanzas-db (PostgreSQL 16)
```

| Contenedor | Imagen | Puerto en la Pi | Memoria máx. |
|---|---|---|---|
| `misfinanzas-web` | Nginx con la web compilada | **8095** | 64 MB |
| `misfinanzas-backend` | Java 21 (JRE) | ninguno (métricas en 8091, solo red interna) | 640 MB |
| `misfinanzas-db` | `postgres:16-alpine` | ninguno | 256 MB |

En total menos de 1 GB de los 4 GB de la Pi.

## 1. Antes de empezar (en el PC)

1. Hacer commit y push de todo a GitHub: la Pi descarga el código del repositorio.
2. Si el repositorio es privado, la Pi necesitará acceso: un token de GitHub de solo lectura (al clonar) o una
   *deploy key*.

## 2. Primera instalación (en la Pi)

```bash
ssh server@192.168.68.58          # o server@100.91.69.0 por Tailscale

sudo mkdir -p /opt/homelab/stacks/misfinanzas
sudo chown server: /opt/homelab/stacks/misfinanzas
cd /opt/homelab/stacks/misfinanzas

git clone https://github.com/alvaropf-tic/MisFinanzasApp.git app
cp app/deploy/homelab/docker-compose.yml app/deploy/homelab/backup.sh app/deploy/homelab/deploy.sh .
cp app/deploy/homelab/.env.example .env
chmod +x backup.sh deploy.sh
chmod 600 .env
mkdir -p data/postgres data/tickets
sudo chown 10001 data/tickets     # el backend corre con el usuario 10001

# Rellenar .env: contraseña de la base de datos, secreto JWT y clave de Groq
openssl rand -base64 24           # → DB_PASSWORD
openssl rand -base64 48           # → JWT_SECRET
nano .env

docker compose build              # la primera vez tarda (Maven + Angular en la Pi): 10–20 min
docker compose up -d
docker compose ps                 # los tres "Up"; el backend pasa a "healthy" en ~1–2 min
docker logs --tail 50 misfinanzas-backend
```

Probar en casa: `http://192.168.68.58:8095`.

> La base de datos de producción empieza vacía: hay que crear la cuenta de nuevo. Los datos de desarrollo (H2 del
> PC) no se migran.

## 3. Nombre interno en Nginx Proxy Manager

En NPM (`http://192.168.68.58:81`) → **Proxy Hosts → Add Proxy Host**:

- Domain: `finanzas.alvaro-homelab`
- Scheme `http`, Forward host `192.168.68.58`, port `8095`
- Activar **Block Common Exploits**
- En **Advanced**, para las fotos de los tickets: `client_max_body_size 10m;`

dnsmasq ya responde `*.alvaro-homelab` con la IP Tailscale de la Pi, así que no hay que tocar el DNS.
Con Tailscale conectado: `http://finanzas.alvaro-homelab`.

En el móvil, desde Chrome → menú → **Añadir a pantalla de inicio** para tenerla como una app.

## 4. Monitorización

**Uptime Kuma**: el health del backend está en el puerto de gestión, que no se publica. Crear un monitor HTTP a
`http://192.168.68.58:8095/` (la web) y otro de tipo **Docker Container** a `misfinanzas-backend` (Kuma lo marca
caído si deja de estar *healthy*).

**Prometheus** (métricas de la app: logins, gastos, tickets leídos, preguntas a la IA, peticiones HTTP, JVM…):

1. Ver el nombre de la red del stack de monitorización: `docker network ls` (probablemente `monitoring_default`).
2. En `docker-compose.yml` de Mis Finanzas, descomentar `networks: [interna, monitoring]` del backend y el bloque
   `monitoring` de `networks`, con el nombre real. `docker compose up -d`.
3. En `prometheus.yml`, añadir y reiniciar Prometheus:

   ```yaml
   - job_name: misfinanzas
     metrics_path: /actuator/prometheus
     static_configs:
       - targets: ['misfinanzas-backend:8091']
   ```

4. En Grafana, las métricas empiezan por `misfinanzas_` (por ejemplo `misfinanzas_tickets_leidos_total`).

## 5. Copias de seguridad

`backup.sh` vuelca PostgreSQL y empaqueta las fotos en `/opt/homelab/backups/misfinanzas`, y guarda 14 días.

```bash
./backup.sh                       # probar a mano
crontab -e                        # y añadir:
30 3 * * * /opt/homelab/stacks/misfinanzas/backup.sh >> /opt/homelab/stacks/misfinanzas/backup.log 2>&1
```

Ojo: la copia queda en el mismo SSD. Hasta que el homelab tenga copia externa, conviene llevarla de vez en cuando
a otro sitio (PC, Syncthing…). Cómo restaurar: comentarios al principio de `backup.sh`.

## 6. Actualizar a una versión nueva

Tras hacer push desde el PC:

```bash
cd /opt/homelab/stacks/misfinanzas
./deploy.sh                       # copia, git pull, build y up -d
```

## Diagnóstico

```bash
docker compose ps
docker logs --tail 100 misfinanzas-backend
docker logs --tail 100 misfinanzas-web
docker stats --no-stream | grep misfinanzas
```

| Síntoma | Causa probable |
|---|---|
| La web carga pero no inicia sesión | Backend aún arrancando (esperar a *healthy*) o caído: ver sus logs |
| `Falta JWT_SECRET` / `Falta DB_PASSWORD` al hacer `up` | `.env` sin rellenar |
| Error al subir un ticket (413) | Falta `client_max_body_size 10m;` en NPM |
| «La lectura de tickets no está configurada» | `GROQ_API_KEY` vacía en `.env` (luego `docker compose up -d`) |
| El backend se reinicia en bucle | Memoria: revisar `docker stats` y `JAVA_OPTS` en el Dockerfile |
