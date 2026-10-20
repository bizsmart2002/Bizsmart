# UAT — Checklist de pruebas de aceptación de usuario (BizSmart)

Pruebas manuales, guiadas por casos de uso del negocio, ejecutadas por alguien
que **no programó el sistema** (el profesor u otro usuario) directamente sobre
el frontend: http://localhost:4200 (stack levantado con `docker compose up`).

No se automatizan con código (eso ya lo cubren las pruebas unitarias, de
integración y la colección Postman); aquí lo que importa es si el sistema
**hace lo que el negocio necesita**, desde la perspectiva de quien lo usa.

Marcar cada fila: ✅ Pasa / ❌ Falla / 👁️ Observación (funciona, pero con un
detalle a mejorar). Usar la columna "Observaciones" para describir lo visto.

## Preparación
- Stack arriba: `docker compose ps` → 10 contenedores en `Up` (postgres `healthy`).
- Usuarios de prueba (contraseña `Password123`): `owner@`, `admin@`, `seller@`, `viewer@bizsmart.test`.

## 1. Autenticación y control de acceso por rol (HU01-HU04)

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 1.1 | Login válido | Ir a `/login`, ingresar `owner@bizsmart.test` / `Password123` | Entra al dashboard, ve el nombre/rol OWNER | |
| 1.2 | Login con contraseña incorrecta | Mismo correo, contraseña errónea | Mensaje de error, no entra | |
| 1.3 | Sesión persiste | Login, recargar la página (F5) | Sigue autenticado (no vuelve al login) | |
| 1.4 | Acceso denegado por rol | Login como `seller@` (SELLER), intentar entrar a gestión de usuarios | La opción no aparece o el sistema la bloquea | |
| 1.5 | VIEWER es solo lectura | Login como `viewer@`, intentar crear/editar un producto | No ve botones de crear/editar, o el sistema los rechaza | |
| 1.6 | Logout | Cerrar sesión | Vuelve al login; no se puede navegar atrás a pantallas protegidas | |

## 2. Productos y categorías (HU05)

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 2.1 | Listar productos | Login OWNER/ADMIN, ir a Productos | Se ve la lista del seed (8 productos) | |
| 2.2 | Crear producto | Crear uno nuevo con nombre, precio, stock mínimo | Aparece en la lista inmediatamente | |
| 2.3 | Validación de campos | Intentar crear sin nombre o con precio negativo | El formulario rechaza, muestra el error | |
| 2.4 | Editar producto | Cambiar el precio de un producto existente | El cambio se refleja en la lista/detalle | |
| 2.5 | Desactivar producto | Desactivar un producto | Deja de aparecer en listados activos / se marca inactivo | |

## 3. Inventario y alertas (HU06, HU11)

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 3.1 | Ver stock actual | Ir a Inventario | Se ve el stock de cada producto del seed | |
| 3.2 | Entrada manual de stock | Registrar una entrada (ADMIN/OWNER) | El stock del producto sube en la cantidad indicada | |
| 3.3 | Alerta de stock bajo | Buscar un producto sembrado deliberadamente bajo el mínimo | Aparece en la sección de Alertas | |
| 3.4 | Resolver alerta | Resolver la alerta (ADMIN/OWNER) | Deja de listarse como pendiente | |

## 4. Clientes (HU09)

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 4.1 | Crear cliente | Registrar un cliente nuevo (documento único) | Aparece en el listado | |
| 4.2 | Historial de compras | Ver el detalle de un cliente con ventas previas | Se listan sus compras anteriores | |

## 5. Ventas (HU07) — flujo central del negocio

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 5.1 | Registrar venta | Login SELLER/OWNER, vender 1 unidad de un producto con stock | La venta se confirma, aparece en el historial de ventas | |
| 5.2 | Stock se descuenta | Revisar el inventario del producto vendido | El stock bajó exactamente en la cantidad vendida | |
| 5.3 | Venta sin stock suficiente | Intentar vender más unidades de las que hay disponibles | El sistema la rechaza con un mensaje claro | |
| 5.4 | VIEWER no puede vender | Login VIEWER, intentar registrar una venta | La opción no está disponible / se rechaza | |

> **Nota para quien ejecute el UAT:** este flujo (5.1-5.2) tenía un defecto
> crítico que impedía registrar CUALQUIER venta (hallazgo de la colección de
> Postman); fue corregido el 2026-10-13 en `sales-service` e `inventory-service`.
> Si este escenario falla, es una regresión y debe reportarse de inmediato.

## 6. Dashboard y reportes (HU10, HU13-HU14)

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 6.1 | Dashboard refleja ventas | Ver el dashboard tras registrar una venta (5.1) | El total/KPI de ventas del día sube | |
| 6.2 | Top productos | Ver sección de productos más vendidos | Muestra productos con unidades vendidas coherentes con el seed/las ventas hechas | |
| 6.3 | Reporte con filtro de fecha | Generar el reporte de ventas filtrando por un rango de fechas | Solo trae ventas dentro del rango | |
| 6.4 | Reporte de inventario | Ver el reporte de inventario | Coincide con el stock visto en la sección Inventario | |

## 7. Inteligencia artificial (HU17, simulada por reglas)

| # | Escenario | Pasos | Resultado esperado | Resultado |
|---|---|---|---|---|
| 7.1 | Recomendación de reabastecimiento | Login OWNER, ver recomendaciones de IA | Sugiere reabastecer los productos con stock bajo | |
| 7.2 | Agente conversacional | Hacer una pregunta simple sobre el negocio (ej. "¿qué productos tienen bajo stock?") | Responde algo coherente basado en los datos reales | |

## Resumen para sustentación

| Módulo | Total escenarios | Pasa | Falla | Observación |
|---|---|---|---|---|
| Autenticación/roles | 6 | | | |
| Productos | 5 | | | |
| Inventario/alertas | 4 | | | |
| Clientes | 2 | | | |
| Ventas | 4 | | | |
| Dashboard/reportes | 4 | | | |
| IA | 2 | | | |
| **Total** | **27** | | | |

*(Esta tabla la completa quien ejecute el UAT; no se rellena de antemano.)*
