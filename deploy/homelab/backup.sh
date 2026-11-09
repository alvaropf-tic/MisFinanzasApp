#!/bin/sh
# Copia de seguridad de Mis Finanzas: volcado de PostgreSQL + fotos de los tickets.
# Uso (desde /opt/homelab/stacks/misfinanzas):  ./backup.sh
# Programado a diario a las 3:30 con cron (crontab -e):
#   30 3 * * * /opt/homelab/stacks/misfinanzas/backup.sh >> /opt/homelab/stacks/misfinanzas/backup.log 2>&1
#
# Restaurar (con el stack parado salvo la base de datos):
#   gunzip -c misfinanzas-AAAAMMDD-HHMM.sql.gz | docker exec -i misfinanzas-db psql -U misfinanzas -d misfinanzas
#   tar -xzf tickets-AAAAMMDD-HHMM.tar.gz -C data/

set -eu

STACK=/opt/homelab/stacks/misfinanzas
DESTINO=${BACKUP_DIR:-/opt/homelab/backups/misfinanzas}
DIAS=${BACKUP_DIAS:-14}
FECHA=$(date +%Y%m%d-%H%M)

mkdir -p "$DESTINO"

docker exec misfinanzas-db pg_dump -U misfinanzas -d misfinanzas --clean --if-exists \
  | gzip > "$DESTINO/misfinanzas-$FECHA.sql.gz"

tar -czf "$DESTINO/tickets-$FECHA.tar.gz" -C "$STACK/data" tickets

# Borra las copias de más de $DIAS días
find "$DESTINO" -name 'misfinanzas-*.sql.gz' -mtime +"$DIAS" -delete
find "$DESTINO" -name 'tickets-*.tar.gz' -mtime +"$DIAS" -delete

echo "$(date '+%F %T') copia hecha en $DESTINO ($FECHA)"
