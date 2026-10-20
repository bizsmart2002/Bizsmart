// ------------------------------------------------------------------
// Pruebas de INTEGRACIÓN REALES (sin mocks).
//
// A diferencia de backend/auth-service/test/auth.e2e-spec.ts (que
// mockea AuthService y solo prueba la capa HTTP/validación de UN
// servicio), estas pruebas golpean el api-gateway REAL de un stack
// levantado con `docker compose up` y verifican que varios
// microservicios trabajen juntos de verdad, con su BD Postgres real:
//
//   sales-service --HTTP--> product-service (valida producto/precio)
//   sales-service --HTTP--> inventory-service (valida y descuenta stock)
//   sales-service --HTTP--> customer-service (valida cliente)
//   customer-service <--HTTP-- sales-service (historial de compras)
//
// Requiere el stack arriba (`docker compose up -d` en la raíz del
// repo). No usa mocks: cada petición ejercita BD + red real entre
// contenedores. Es desechable: solo escribe en la BD demo del
// contenedor `bizsmart_pgdata` (se puede limpiar con
// `docker compose down -v`).
// ------------------------------------------------------------------

const request = require('supertest');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const api = request(BASE_URL);

async function login(email) {
  const res = await api.post('/auth/login').send({ email, password: 'Password123' });
  if (res.status !== 200) {
    throw new Error(`Login falló para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken;
}

describe('Integración real: productos <-> inventario <-> ventas <-> clientes', () => {
  let sellerToken;
  let ownerToken;
  let productId;
  let customerId;

  beforeAll(async () => {
    sellerToken = await login('seller@bizsmart.test');
    ownerToken = await login('owner@bizsmart.test');

    // Producto nuevo y aislado para no interferir con el seed ni con
    // otras corridas (nombre único por timestamp -> re-ejecutable).
    const unique = Date.now();
    const productRes = await api
      .post('/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Producto integración ${unique}`, price: 1000, minimumStock: 5 });
    expect(productRes.status).toBe(201);
    // product-service devuelve `id` como STRING (columna bigint de
    // Postgres). Se normaliza aquí, igual que debe hacerlo cualquier
    // consumidor real (ver fix en sales.service.ts tras el hallazgo de
    // VERONICA: comparar/enviar sin convertir rompe los DTO @IsInt()).
    productId = Number(productRes.body.id);

    // Entrada de inventario manual (ADMIN/OWNER) -> integra
    // product-service (el producto debe existir) con inventory-service
    // (crea/actualiza el registro de stock).
    const stockInRes = await api
      .post('/inventory/movements')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ productId, movementType: 'IN', quantity: 20, reference: `INIT-${unique}` });
    expect(stockInRes.status).toBe(201);

    const customerRes = await api
      .post('/customers')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Cliente integración ${unique}`, document: `INT-${unique}` });
    expect(customerRes.status).toBe(201);
    customerId = Number(customerRes.body.id);
  });

  test('product-service <-> inventory-service: el stock recién cargado es visible y suficiente', async () => {
    const check = await api
      .get('/inventory/check-stock')
      .query({ productId, quantity: 3 })
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(check.status).toBe(200);
    expect(check.body.sufficient).toBe(true);
  });

  test('sales-service <-> product-service <-> inventory-service: registrar venta valida producto, descuenta stock real y persiste en BD', async () => {
    const before = await api
      .get(`/inventory/${productId}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(before.status).toBe(200);
    const stockBefore = before.body.currentStock;

    const sale = await api
      .post('/sales')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ customerId, items: [{ productId, quantity: 3 }] });
    expect(sale.status).toBe(201);
    expect(sale.body.status).toBe('COMPLETED');
    expect(Number(sale.body.total)).toBeCloseTo(3000, 2);

    const after = await api
      .get(`/inventory/${productId}`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(after.status).toBe(200);
    // Integración real: el descuento lo hizo inventory-service, en SU
    // BD, a partir de una llamada HTTP disparada por sales-service.
    expect(after.body.currentStock).toBe(stockBefore - 3);
  });

  test('sales-service <-> customer-service: la venta aparece en el historial real del cliente', async () => {
    const history = await api
      .get(`/customers/${customerId}/purchases`)
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(history.status).toBe(200);
    expect(Array.isArray(history.body)).toBe(true);
    const found = history.body.some((s) => Number(s.customerId) === Number(customerId));
    expect(found).toBe(true);
  });

  test('sales-service <-> customer-service: rechaza venta con cliente inexistente (integración de validación cruzada)', async () => {
    const res = await api
      .post('/sales')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ customerId: 999999999, items: [{ productId, quantity: 1 }] });
    expect(res.status).toBe(400);
  });
});
