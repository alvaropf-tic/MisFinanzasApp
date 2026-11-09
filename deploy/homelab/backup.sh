#!/bin/sh
# Copia de seguridad de Mis Finanzas: volcado de la base de datos PostgreSQL (las fotos de los tickets no se copian).
# Uso (desde /opt/homelab/stacks/misfinanzas):  ./backup.sh
# Para programarla a diario a las 3:30 con cron (crontab -e):
#   30 3 * * * /opt/homelab/stacks/misfinanzas/backup.sh >> /opt/homelab/stacks/misfinanzas/backup.log 2>&1
#
# Restaurar:
#   gunzip -c misfinanzas-AAAAMMDD-HHMM.sql.gz | docker exec -i misfinanzas-db psql -U misfinanzas -d misfinanzas

set -eu

DESTINO=${BACKUP_DIR:-/opt/homelab/backups/misfinanzas}
DIAS=${BACKUP_DIAS:-14}
FECHA=$(date +%Y%m%d-%H%M)

mkdir -p "$DESTINO"

docker exec misfinanzas-db pg_dump -U misfinanzas -d misfinanzas --clean --if-exists \
  | gzip > "$DESTINO/misfinanzas-$FECHA.sql.gz"

# Borra las copias de más de $DIAS días
find "$DESTINO" -name 'misfinanzas-*.sql.gz' -mtime +"$DIAS" -delete

echo "$(date '+%F %T') copia de la base de datos en $DESTINO/misfinanzas-$FECHA.sql.gz"
