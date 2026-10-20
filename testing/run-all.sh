#!/usr/bin/env bash
# ------------------------------------------------------------------
# PRUEBAS DE REGRESIÓN — comando único local.
#
# La "prueba de regresión" no es un tipo nuevo: es correr TODAS las
# pruebas automáticas que ya existen, en orden, cada vez que se cambia
# algo, para confirmar que no se rompió lo que ya funcionaba. Este
# script es el equivalente local de lo que `.github/workflows/ci-cd.yml`
# ya hace en cada push/PR (job `backend` en matriz + `api-tests-newman`),
# pero en UN solo comando, en el PC del desarrollador.
#
# Orden: 1) unitarias (8 microservicios, Jest+mocks, rápidas y aisladas)
#        2) integración con mocks (e2e Supertest de auth-service)
#        3) integración real (testing/integration, requiere el stack arriba)
#        4) sistema/API (colección Postman vía Newman, requiere el stack arriba)
#
# Requiere: el stack levantado (`docker compose up -d` en la raíz del
# repo) para los pasos 3 y 4. Los pasos 1-2 no tocan Docker ni BD.
# ------------------------------------------------------------------
set -uo pipefail
cd "$(dirname "$0")/.."

SERVICES=(api-gateway auth-service product-service inventory-service sales-service customer-service reporting-service ai-service)
FAIL=0

echo "=============================================="
echo " 1) PRUEBAS UNITARIAS (Jest, mocks, 8 servicios)"
echo "=============================================="
for s in "${SERVICES[@]}"; do
  echo "--- $s ---"
  (cd "backend/$s" && npm test -- --silent) || { echo "❌ Unitarias FALLARON en $s"; FAIL=1; }
done

echo
echo "=============================================="
echo " 2) INTEGRACIÓN (capa HTTP con mocks) — auth-service e2e"
echo "=============================================="
(cd backend/auth-service && npm run test:e2e) || { echo "❌ e2e auth-service FALLÓ"; FAIL=1; }

echo
echo "=============================================="
echo " 3) INTEGRACIÓN REAL (sin mocks, stack Docker)"
echo "=============================================="
if curl -sf -o /dev/null http://localhost:3000/health; then
  (cd testing/integration && npm test) || { echo "❌ Integración real FALLÓ"; FAIL=1; }
else
  echo "⚠️  Stack no disponible en localhost:3000 — omitido. Levántalo con 'docker compose up -d'."
  FAIL=1
fi

echo
echo "=============================================="
echo " 4) SISTEMA / API (Postman + Newman)"
echo "=============================================="
if curl -sf -o /dev/null http://localhost:3000/health; then
  npx --yes newman run testing/postman/BizSmart.postman_collection.json \
    -e testing/postman/BizSmart-local.postman_environment.json \
    --delay-request 250 --reporters cli || { echo "❌ Newman reportó fallos (ver hallazgos conocidos en testing/postman/README.md)"; FAIL=1; }
else
  echo "⚠️  Stack no disponible — omitido."
  FAIL=1
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "✅ REGRESIÓN COMPLETA: todos los niveles automatizados pasaron."
else
  echo "❌ REGRESIÓN: hubo fallos arriba (revisa el detalle de cada sección)."
fi
exit $FAIL
