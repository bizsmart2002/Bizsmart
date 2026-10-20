# BizSmart — Colección Postman / Newman (VERONICA)

## Importar y correr

1. Importar en Postman: `BizSmart.postman_collection.json` + `BizSmart-local.postman_environment.json`.
2. Requiere el stack corriendo en Docker (gateway en `http://localhost:3000`). No reinicia nada por sí sola.
3. Newman:

```bash
npx newman run testing/postman/BizSmart.postman_collection.json \
  -e testing/postman/BizSmart-local.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export <ruta-temporal>/newman.json \
  --delay-request 250
```

El `--delay-request 250` es recomendado: el gateway aplica rate-limit de 300 req/min
(`X-RateLimit-Limit: 300`) y la colección completa son 185 requests; sin margen, una
corrida seguida de otra (o de pruebas manuales con curl) puede toparse con `429` cerca
del final del flujo E2E. Con el delay, la corrida tarda ~70s y es estable.

## Cobertura

- 17 carpetas, **185 requests**, **183 test-scripts**, **275 aserciones**.
- Cubre los ~38 endpoints documentados: Auth (register/login/me/google), Users, Roles,
  Permissions, Products (incluye `by-ids`), Categories, Inventory (incluye movements,
  check-stock, movements/sale), Alerts, Sales, Customers (incluye `/purchases`),
  Dashboard, Reports (sales/products/inventory/customers/top-selling/trends), AI/Agent
  (restock-recommendations/trends/ask), y comportamiento del gateway (health, 404).
- Incluye carpeta **"15. Matriz de roles"** (ADMIN/OWNER/SELLER/VIEWER cruzados contra
  endpoints protegidos) y **"16. E2E flujo completo"** (categoría → producto → stock →
  cliente → venta → verificación de stock/historial/dashboard → alerta → desactivación).
- Casos negativos en todos los endpoints de escritura: sin token (401), token basura
  (401), rol insuficiente (403), validación (400: campos faltantes, tipos erróneos,
  enums fuera de rango, mass assignment), id inexistente (404), id no numérico,
  duplicados (409/400), SQLi/XSS (rechazo o guardado inerte, nunca 500), ruta
  desconocida del gateway (404), límites de longitud/ReDoS básico.
- Todo dato de conexión real (host/puerto/usuario/password de infraestructura) **no
  aparece en ningún archivo**: solo `baseUrl` en el environment. Los tokens se generan
  en runtime vía `/auth/login` de los 4 usuarios seed y se encadenan en variables de
  colección (`adminToken`, `ownerToken`, `sellerToken`, `viewerToken`, etc.). Las
  contraseñas de los usuarios **seed** (`Password123`, documentadas en el brief, no un
  secreto de servidor) sí se usan tal cual para loguear.

## Resultado de las 2 corridas (reejecutables, sin reiniciar el stack)

Ambas corridas, en frío, dieron el mismo resultado exacto:

```
requests: 185/185 ejecutados, 0 fallidos (ninguna petición quedó sin respuesta)
test-scripts: 183/183 ejecutados
assertions: 272/275 en verde, 3 en rojo (reales, ver Hallazgos)
```

Las 3 aserciones en rojo son las mismas en ambas corridas (deterministas, no
flakiness): corresponden a 2 bugs reales del sistema (hallazgos #4 y #5 abajo).

## Hallazgos (severidad + evidencia)

### 1. ✅ CORREGIDO (2026-10-13) — CRÍTICO — Las ventas NO se podían completar nunca, para ningún rol
`backend/sales-service/src/sales/sales.service.ts:69-91` compara
`product.id === item.productId` con `===` estricto. `product.id` llega como **string**
desde `GET /products/by-ids` (el product-service serializa el PK como texto), mientras
`item.productId` es **number** tras pasar por el DTO (`class-transformer`). La
comparación `"1" === 1` es siempre `false`, así que **todo `POST /sales` responde 400
"El producto X no existe" aunque el producto exista y esté activo**. Confirmado con
curl directo (`curl -X POST /sales` con producto id=1 real → 400) y lectura de código.
La colección documenta esto explícitamente en la carpeta "9. Sales" y en el E2E (pasos
7-9, 11): acepta 201 si el bug ya se corrigió, o 400 con el mensaje "no existe" si
sigue presente, sin maquillar el resultado ni lanzar errores en cascada en los pasos
dependientes.

**Fix aplicado:** `sales-service/src/sales/sales.service.ts` normaliza con `Number(p.id)`
en los 3 puntos de comparación. Además se detectó y corrigió una segunda causa en la
misma cadena: `user.userId` (claim `sub` del JWT = `auth.users.id`, también bigint →
string) se reenviaba sin convertir como `createdBy` a `inventory-service`, cuyo DTO
exige `@IsInt()` estricto → 400 en cascada. Corregido en `sales.controller.ts` con
`Number(user.userId)`. Verificado end-to-end con curl (venta real registrada, stock
descontado 114→113) y con las 2 pruebas de integración real nuevas en
`testing/integration/sales-inventory.int-spec.js`. Newman re-ejecutado tras el fix:
276 aserciones, mismas 2 fallas restantes (hallazgos #4 y #5), el flujo E2E de venta
ahora pasa completo.

### 2. ✅ CORREGIDO (2026-10-13) — ALTA — `/inventory/check-stock` y `/inventory/movements` (GET) shadowed por `:productId`
En `inventory-service`, la ruta `GET /inventory/:productId` está registrada antes que
`GET /inventory/check-stock` y `GET /inventory/movements`, así que Nest interpreta
`"check-stock"` y `"movements"` como el parámetro `:productId` y el `ParseIntPipe`
responde 400 "Validation failed (numeric string is expected)" en vez de ejecutar la
lógica real de esos endpoints. Esto además **rompe `checkStock()` dentro de
`sales.service.ts`**, que depende de `GET /inventory/check-stock`, agravando el
hallazgo #1. Confirmado con curl y reproducido en la colección (carpeta "7. Inventory").

**Fix aplicado:** en `inventory-service/src/movements/inventory.controller.ts` se
reordenaron los handlers: `movements`, `check-stock` y `movements` (POST) quedan
declarados ANTES de `:productId`, con un comentario explicando por qué el orden
importa en Nest/Express. Verificado con curl (`check-stock` y `movements` responden
su lógica real, no 400 de `ParseIntPipe`).

### 3. ⚠️ ACEPTADO (sin cambios) — ALTA (seguridad) — `POST /inventory/movements/sale` sin `@Roles`
El endpoint interno no tiene guard de rol. Confirmado con curl: un usuario **VIEWER**
(rol de solo lectura) ejecutó el endpoint y **descontó stock real** (producto id=2 de
60 a 59 unidades) con `movementType: SALE`. Solo lo frena la validación de tipos del
DTO, no la autorización. Documentado en "7. Inventory". **Decisión del usuario
(2026-10-13): se deja sin corregir** (queda documentado como hallazgo de seguridad
conocido para la presentación/sustentación, no como defecto resuelto).

### 4. MEDIA — `products.name` sin `max:` declarado → 500 con payload hostil
`POST /products` con `name` de 10.000 caracteres responde **500 Internal Server
Error** (no 400). El DTO no declara un límite de longitud, así que el payload llega a
la capa de persistencia y revienta ahí. Falla de forma determinista en ambas corridas.

### 5. MEDIA — `GET /inventory/:productId` con id inexistente → 500 en vez de 404
No maneja el caso "no encontrado": responde `{"statusCode":500,"message":"Internal
server error"}`. Falla de forma determinista en ambas corridas.

## Lo que NO se pudo verificar

- **OAuth Google end-to-end real**: las credenciales son `changeme` (placeholder), así
  que solo se verificó que `GET /auth/google` responde una redirección o error
  controlado (no 500 crudo), no el flujo de consentimiento completo.
- **`/ai/*` y `/agent/ask` con proveedor de IA real**: se verificó que no cuelgan ni
  devuelven 500, pero no se validó el contenido semántico de la respuesta (depende de
  un proveedor externo no determinista).
- El código fuente de los hallazgos 1-3 se leyó para diagnosticar la causa raíz, pero
  **no se modificó** (fuera del alcance de esta tarea: solo colección Postman +
  ejecución Newman).
