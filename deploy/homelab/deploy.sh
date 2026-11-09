#!/bin/sh
# Actualiza Mis Finanzas en la Pi con lo último del repositorio y reconstruye las imágenes.
# Uso (desde /opt/homelab/stacks/misfinanzas):  ./deploy.sh
set -eu

cd /opt/homelab/stacks/misfinanzas

# Copia antes de actualizar, por si una versión nueva rompe algo
if docker ps --format '{{.Names}}' | grep -q '^misfinanzas-db$'; then
  ./backup.sh
fi

git -C app pull --ff-only
docker compose build
docker compose up -d
docker image prune -f >/dev/null

docker compose ps
