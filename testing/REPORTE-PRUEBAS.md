# BizSmart — Reporte consolidado de pruebas

Fecha: 2026-10-13/14. Proyecto académico UTS (Análisis y Diseño). Stack: Angular +
NestJS (8 microservicios) + PostgreSQL, levantado con `docker compose up --build`.

Este documento consolida los **6 niveles de prueba** del panorama completo, con
resultados reales (no estimados) obtenidos ejecutando el sistema localmente.

## 0. Pirámide de pruebas de BizSmart

```
        /\
       /  \      UAT (checklist manual, testing/UAT-checklist.md)
      /----\     Rendimiento/carga (autocannon) · Seguridad (manual, parcial)
     /      \
    / Sistema \   API / Postman+Newman — testing/postman/
   /----------\
  / Integración \  Supertest con mocks (auth) + Supertest REAL (testing/integration/)
 /----------------\
/   Unitarias       \  Jest+mocks — 8 microservicios
/______________________\
```

Regresión: no es un nivel nuevo, es correr todo lo anterior en cada cambio.
`testing/run-all.sh` lo hace local; `.github/workflows/ci-cd.yml` lo hace en CI.

## 1. Pruebas unitarias

**Qué son:** prueban una función/método aislado, con mocks, sin BD ni red.
**Herramienta:** Jest (incluido por NestJS).
**Cómo correr:** `cd backend/<servicio> && npm test -- --coverage`.

| Servicio | Suites | Tests | Cobertura (líneas) |
|---|---|---|---|
| api-gateway | 1 | 6 | 31.7% |
| auth-service | 2 | 16 | 36.8% |
| product-service | 1 | 8 | 36.0% |
| inventory-service | 1 | 12 | 40.8% |
| sales-service | 1 | 6 | 44.7% |
| customer-service | 1 | 5 | 24.6% |
| reporting-service | 1 | 2 | 7.5% |
| ai-service | 1 | 6 | 12.1% |
| **Total** | **9** | **61** | — |

**Resultado:** 61/61 pruebas pasan. **Honestidad:** cobertura cubre las reglas de
negocio principales de cada Service; los Controllers (capa delgada) casi no se
prueban aparte, y `reporting-service`/`ai-service` tienen cobertura baja (7-12%).

## 2. Pruebas de integración

**Qué son:** verifican que varias piezas trabajen juntas de verdad.

### 2a. Integración con mocks (capa HTTP/validación)
`backend/auth-service/test/auth.e2e-spec.ts` — Supertest contra Nest levantado en
memoria, `AuthService` mockeado. Prueba la ruta, el `ValidationPipe` y los status
codes reales, **no** la lógica de negocio ni la BD.
**Resultado:** 5/5 pruebas pasan. `npm run test:e2e` (auth-service).

### 2b. Integración REAL (sin mocks) — nueva
`testing/integration/sales-inventory.int-spec.js` — Supertest contra el api-gateway
del stack Docker real (BD Postgres real, red real entre contenedores). Cubre:
- `product-service` ↔ `inventory-service` (stock recién cargado es consultable).
- `sales-service` → `product-service` + `inventory-service` (venta real descuenta
  stock real, persistido en BD).
- `sales-service` ↔ `customer-service` (historial de compras, validación cruzada
  de cliente inexistente).

**Resultado:** 4/4 pruebas pasan (2 corridas consecutivas, deterministas).
**Cómo correr:** stack arriba (`docker compose up -d`) + `cd testing/integration && npm install && npm test`.

## 3. Pruebas de sistema / API

**Qué son:** prueban el sistema completo desplegado, a través del api-gateway.
**Herramienta:** Postman + Newman. Colección en `testing/postman/`.
**Cobertura:** 17 carpetas, **185 requests**, 183 test-scripts, **275 aserciones**;
los ~38 endpoints documentados + matriz de roles (OWNER/ADMIN/SELLER/VIEWER) +
flujo E2E completo (categoría → producto → stock → cliente → venta → verificación
→ alerta → desactivación).
**Cómo correr:**
```bash
npx newman run testing/postman/BizSmart.postman_collection.json \
  -e testing/postman/BizSmart-local.postman_environment.json --delay-request 250
```
**Resultado (tras corregir el bug crítico de ventas):** 276 aserciones ejecutadas,
**273 en verde, 3 en rojo** — las 3 vienen de los mismos **2 defectos reales
restantes** (hallazgos #4 y #5, uno de ellos dispara 2 aserciones), deterministas en
corridas repetidas.
Detalle completo: `testing/postman/README.md`.

## 4. Pruebas de aceptación (UAT)

**Qué son:** las hace alguien que no programó el sistema, siguiendo casos de uso
del negocio. No se automatizan con código.
**Instrumento:** `testing/UAT-checklist.md` — 27 escenarios en 7 módulos (login y
roles, productos, inventario/alertas, clientes, ventas, dashboard/reportes, IA),
con pasos sobre el frontend real (`localhost:4200`) y columnas Pasa/Falla/Observación
para que el profesor (o cualquier usuario) lo diligencie.
**Resultado:** pendiente de ejecución manual por el usuario (instrumento entregado,
no autoejecutable por definición de este nivel de prueba).

## 5. Pruebas de regresión

**Qué son:** no es un tipo nuevo — es correr todas las anteriores tras cada
cambio, para confirmar que no se rompió nada.
**Instrumentos:**
- Local: `testing/run-all.sh` — un comando que encadena unitarias (8) → e2e con
  mocks → integración real → Postman/Newman, con resumen final y código de salida.
- CI/CD: `.github/workflows/ci-cd.yml` ya hace esto mismo en cada push/PR (matriz
  por servicio: lint+build+test+e2e+audit, más el job `api-tests-newman` que
  levanta todo el stack con Docker y corre la colección).
**Resultado de `run-all.sh`:** corrida completa de los 4 niveles automatizados
(9 suites unitarias, e2e con mocks, integración real, Postman/Newman). Todo pasó
**excepto** las 2 fallas de Newman ya conocidas y abiertas (hallazgos #4 y #5, media
severidad, fuera del alcance acordado) — el script marca la regresión en rojo por
diseño mientras esos 2 defectos sigan abiertos, que es justamente su función: avisar
que algo conocido (y solo eso) sigue roto. El flujo de venta E2E (antes el hallazgo
crítico) pasó completo: venta registrada, stock descontado 20→15, aparece en el
historial del cliente, dashboard actualizado. 276 aserciones ejecutadas, 273 en
verde, 3 en rojo (mismas de siempre, deterministas).

## 6. Pruebas de rendimiento/carga y de seguridad

### 6a. Rendimiento (nuevo)
**Herramienta:** autocannon (vía `npx`, sin instalación pesada). Script:
`testing/performance/run-autocannon.sh`. 3 endpoints, 20 conexiones, 20s cada uno:
`POST /auth/login`, `GET /products`, `GET /dashboard/summary`.

| Endpoint | Latencia p50 | Latencia p99 | Hallazgo |
|---|---|---|---|
| `/auth/login` | 7 ms | 62 ms | Solo 298 de ~33.7k requests en 2xx bajo carga sostenida |
| `/products` | 5 ms | 17 ms | 0 de ~65.6k requests en 2xx bajo carga sostenida |
| `/dashboard/summary` | 4 ms | 13 ms | 0 de ~69.8k requests en 2xx bajo carga sostenida |

**Hallazgo honesto:** la latencia individual es excelente (single-digit ms), pero
bajo 20 conexiones concurrentes sostenidas la enorme mayoría de las respuestas NO
son 2xx. Causa: el api-gateway tiene un **rate-limiter de 300 req/min** (confirmado
por `@nestjs/throttler` en el gateway y por el header `X-RateLimit-Limit: 300` visto
en la colección Postman) — es una protección deliberada, no un bug de rendimiento,
pero significa que el sistema **no está dimensionado para más de 5 req/s sostenidos
por el gateway**, algo a declarar explícitamente si se habla de "escalabilidad".

### 6b. Seguridad
**Alcance de esta entrega:** no se ejecutó un barrido adversarial adicional (decisión
del usuario). Hallazgo de seguridad ya confirmado y **dejado sin corregir a petición
del usuario**: `POST /inventory/movements/sale` no exige rol — un usuario VIEWER
puede descontar stock real (ver `testing/postman/README.md`, hallazgo #3).
**No implementado / fuera de alcance:** fuzzing de JWT (alg=none, secreto por defecto
en `docker-compose.yml`), SQLi/XSS más allá de lo ya cubierto por la colección
Postman, escaneo de dependencias más allá de `npm audit` (ya en el CI).

## Hallazgos corregidos en esta sesión

| # | Severidad | Hallazgo | Archivo | Estado |
|---|---|---|---|---|
| 1 | Crítica | Ninguna venta se podía registrar (comparación string/number de IDs bigint) | `sales-service/src/sales/sales.service.ts` | ✅ Corregido |
| 1b | Crítica (misma cadena) | `createdBy` (userId del JWT, bigint-string) rechazado por DTO `@IsInt()` | `sales-service/src/sales/sales.controller.ts` | ✅ Corregido |
| 2 | Alta | Rutas `check-stock`/`movements` de inventario tapadas por `:productId` | `inventory-service/src/movements/inventory.controller.ts` | ✅ Corregido |
| 3 | Alta (seguridad) | `POST /inventory/movements/sale` sin `@Roles` | `inventory-service/src/movements/inventory.controller.ts` | ⚠️ Dejado sin corregir (decisión del usuario) |
| 4 | Media | `products.name` sin límite de longitud → 500 con payload de 10k chars | `product-service` | 🔲 No corregido (fuera del alcance acordado) |
| 5 | Media | `GET /inventory/:productId` inexistente → 500 en vez de 404 | `inventory-service` | 🔲 No corregido (fuera del alcance acordado) |

## Lo que NO se verificó / no se implementó (honestidad)

- UAT: instrumento entregado, ejecución manual pendiente (por definición, no es
  automatizable).
- OAuth Google end-to-end real (credenciales `changeme` en el compose).
- Contenido semántico de `/ai/*` (depende de proveedor externo no determinista).
- Barrido de seguridad adversarial adicional (JWT forjado con secreto por defecto,
  fuzzing sistemático) — no ejecutado en esta entrega por decisión del usuario.
- Hallazgos #4 y #5 (media severidad) quedan abiertos, documentados y reproducibles.
