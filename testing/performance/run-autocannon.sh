#!/usr/bin/env bash
# Pruebas de RENDIMIENTO/CARGA ligeras con autocannon (vía npx, sin
# instalación pesada ni imagen Docker) contra el api-gateway del stack
# YA levantado con docker compose. Mide 3 endpoints representativos:
# login (escritura+hash bcrypt, el más costoso), listado de productos
# (lectura con JOIN) y dashboard (lectura agregada). 20 conexiones
# concurrentes, 20s por endpoint -> carga moderada para un entorno
# académico local, sin tumbar los 8 microservicios de un portátil.
set -e
BASE=${BASE_URL:-http://localhost:3000}
OUT_DIR="$(dirname "$0")/resultados"
mkdir -p "$OUT_DIR"

echo "== Obteniendo token OWNER para los endpoints protegidos =="
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"owner@bizsmart.test","password":"Password123"}' \
  | sed -E 's/.*"accessToken":"([^"]*)".*/\1/')

run() {
  local name="$1"; shift
  echo "== $name =="
  npx --yes autocannon "$@" | tee "$OUT_DIR/$name.txt"
}

# 1) Login: POST con password hashing (bcrypt) - el más costoso en CPU.
run login -c 20 -d 20 -m POST \
  -H 'Content-Type: application/json' \
  -b '{"email":"owner@bizsmart.test","password":"Password123"}' \
  "$BASE/auth/login"

# 2) Listado de productos (lectura con JOIN a categorías).
run productos -c 20 -d 20 \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE/products"

# 3) Dashboard (lectura agregada: KPIs, top productos, tendencia).
run dashboard -c 20 -d 20 \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE/dashboard/summary"

echo "Resultados guardados en $OUT_DIR"
