'use strict';
/**
 * Microservicio 2: evaluador-stock (sin Docker)
 *
 * Todo en un solo archivo, en cuatro bloques:
 *   1. IDENTIDAD     -> quién es el servicio; se define en el propio código.
 *   2. VALIDADOR     -> reglas que debe cumplir la entrada.
 *   3. ENDPOINTS     -> lógica de negocio y rutas HTTP.
 *   4. MICROSERVICIO -> servidor HTTP y autovalidación.
 *
 * Solo usa módulos nativos de Node.js (18 o superior). No necesita npm install
 * ni Docker.
 *
 * Uso:
 *   node evaluador-stock.js            -> levanta el servicio (puerto 4002)
 *   node evaluador-stock.js --validar  -> se prueba a sí mismo y termina
 *   PORT=5001 node evaluador-stock.js  -> cambia el puerto (PowerShell: $env:PORT=5001)
 *
 * Endpoints:
 *   GET  /health     -> estado del servicio
 *   GET  /identidad  -> datos de identidad del servicio
 *   POST /evaluar    -> { "productos": [{ "id": 1, "nombre": "Agua", "stock": 3, "minimo": 10 }] }
 *
 * Regla: stock 0 -> SIN_STOCK; stock menor o igual al mínimo -> STOCK_BAJO.
 */
const http = require('http');
const os = require('os');

// ---------------------------------------------------------------------------
// 1. IDENTIDAD
// ---------------------------------------------------------------------------
const IDENTIDAD = Object.freeze({
  servicio: 'evaluador-stock',
  version: '1.0.0',
  descripcion: 'Evalúa una lista de productos y detecta los que tienen stock bajo o agotado',
  puertoPorDefecto: 4002,
});
const PUERTO = Number(process.env.PORT) || IDENTIDAD.puertoPorDefecto;

// ---------------------------------------------------------------------------
// 2. VALIDADOR
// ---------------------------------------------------------------------------
function validarEvaluacion(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['El cuerpo debe ser un objeto JSON'];
  }
  if (!Array.isArray(body.productos) || body.productos.length === 0) {
    return ['productos debe ser un arreglo con al menos un elemento'];
  }
  const errores = [];
  body.productos.forEach((p, i) => {
    if (!p || (typeof p.id !== 'number' && (typeof p.id !== 'string' || p.id.trim() === ''))) {
      errores.push(`productos[${i}].id es obligatorio (número o texto)`);
    }
    if (!p || typeof p.nombre !== 'string' || p.nombre.trim() === '') {
      errores.push(`productos[${i}].nombre debe ser un texto no vacío`);
    }
    if (!p || !Number.isInteger(p.stock) || p.stock < 0) {
      errores.push(`productos[${i}].stock debe ser un entero mayor o igual a 0`);
    }
    if (!p || !Number.isInteger(p.minimo) || p.minimo < 0) {
      errores.push(`productos[${i}].minimo debe ser un entero mayor o igual a 0`);
    }
  });
  return errores;
}

// ---------------------------------------------------------------------------
// 3. ENDPOINTS (lógica de negocio)
// ---------------------------------------------------------------------------
function evaluar({ productos }) {
  const alertas = productos
    .filter((p) => p.stock <= p.minimo)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      stock: p.stock,
      minimo: p.minimo,
      tipo: p.stock === 0 ? 'SIN_STOCK' : 'STOCK_BAJO',
    }));
  return {
    totalEvaluados: productos.length,
    totalAlertas: alertas.length,
    sinProblemas: productos.length - alertas.length,
    alertas,
  };
}

// ---------------------------------------------------------------------------
// 4. MICROSERVICIO (servidor HTTP)
// ---------------------------------------------------------------------------
function responder(res, status, data) {
  const cuerpo = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
}

function leerJson(req) {
  return new Promise((resolve, reject) => {
    let crudo = '';
    req.on('data', (trozo) => {
      crudo += trozo;
      if (crudo.length > 1e6) {
        reject(new Error('Cuerpo demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(crudo ? JSON.parse(crudo) : {});
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function crearServidor() {
  const inicio = Date.now();
  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && pathname === '/health') {
        return responder(res, 200, { status: 'ok', servicio: IDENTIDAD.servicio });
      }
      if (req.method === 'GET' && pathname === '/identidad') {
        return responder(res, 200, {
          servicio: IDENTIDAD.servicio,
          version: IDENTIDAD.version,
          descripcion: IDENTIDAD.descripcion,
          puerto: req.socket.localPort,
          pid: process.pid,
          node: process.version,
          plataforma: os.platform(),
          host: os.hostname(),
          uptimeSegundos: Math.round((Date.now() - inicio) / 1000),
        });
      }
      if (req.method === 'POST' && pathname === '/evaluar') {
        const body = await leerJson(req);
        const errores = validarEvaluacion(body);
        if (errores.length > 0) return responder(res, 400, { errores });
        return responder(res, 200, evaluar(body));
      }
      return responder(res, 404, { error: 'Ruta no encontrada' });
    } catch (err) {
      return responder(res, 400, { errores: [err.message] });
    }
  });
}

// ---------------------------------------------------------------------------
// Autovalidación: node evaluador-stock.js --validar
// Levanta el servicio en un puerto libre, le hace peticiones reales y termina
// con código 0 si todo cumple o 1 si algo falla.
// ---------------------------------------------------------------------------
async function autovalidar() {
  const assert = require('assert');
  const servidor = crearServidor();
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;

  const pedir = async (metodo, ruta, cuerpo) => {
    const r = await fetch(base + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
    });
    return { status: r.status, data: await r.json() };
  };

  const pruebas = [
    ['GET /health responde ok', async () => {
      const r = await pedir('GET', '/health');
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.data.status, 'ok');
    }],
    ['GET /identidad devuelve el nombre y la versión definidos en el código', async () => {
      const r = await pedir('GET', '/identidad');
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.data.servicio, IDENTIDAD.servicio);
      assert.strictEqual(r.data.version, IDENTIDAD.version);
    }],
    ['POST /evaluar detecta SIN_STOCK y STOCK_BAJO', async () => {
      const r = await pedir('POST', '/evaluar', {
        productos: [
          { id: 1, nombre: 'Detergente 1kg', stock: 0, minimo: 8 },
          { id: 2, nombre: 'Galletas surtidas', stock: 5, minimo: 20 },
          { id: 3, nombre: 'Agua 600ml', stock: 50, minimo: 10 },
        ],
      });
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.data.totalEvaluados, 3);
      assert.strictEqual(r.data.totalAlertas, 2);
      assert.strictEqual(r.data.sinProblemas, 1);
      assert.strictEqual(r.data.alertas[0].tipo, 'SIN_STOCK');
      assert.strictEqual(r.data.alertas[1].tipo, 'STOCK_BAJO');
    }],
    ['un producto con stock igual al mínimo cuenta como STOCK_BAJO', async () => {
      const r = await pedir('POST', '/evaluar', { productos: [{ id: 'A1', nombre: 'Jugo', stock: 10, minimo: 10 }] });
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.data.alertas[0].tipo, 'STOCK_BAJO');
    }],
    ['sin alertas cuando todo está por encima del mínimo', async () => {
      const r = await pedir('POST', '/evaluar', { productos: [{ id: 1, nombre: 'Agua', stock: 30, minimo: 10 }] });
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.data.totalAlertas, 0);
    }],
    ['rechaza productos vacío (400)', async () => {
      const r = await pedir('POST', '/evaluar', { productos: [] });
      assert.strictEqual(r.status, 400);
    }],
    ['rechaza campos inválidos (400)', async () => {
      const r = await pedir('POST', '/evaluar', { productos: [{ nombre: '', stock: -1, minimo: 'x' }] });
      assert.strictEqual(r.status, 400);
      assert.strictEqual(r.data.errores.length, 4);
    }],
    ['rechaza JSON inválido (400)', async () => {
      const r = await pedir('POST', '/evaluar', 'esto no es json');
      assert.strictEqual(r.status, 400);
    }],
    ['ruta inexistente responde 404', async () => {
      const r = await pedir('GET', '/no-existe');
      assert.strictEqual(r.status, 404);
    }],
  ];

  let fallidas = 0;
  console.log(`Validando ${IDENTIDAD.servicio} v${IDENTIDAD.version}`);
  for (const [nombre, prueba] of pruebas) {
    try {
      await prueba();
      console.log(`  ✓ ${nombre}`);
    } catch (err) {
      fallidas += 1;
      console.log(`  ✗ ${nombre}\n      ${err.message}`);
    }
  }
  servidor.closeAllConnections();
  await new Promise((ok) => servidor.close(ok));
  console.log(fallidas === 0 ? `\nTodas las pruebas pasaron (${pruebas.length}/${pruebas.length})` : `\n${fallidas} prueba(s) fallaron`);
  process.exitCode = fallidas === 0 ? 0 : 1;
}

if (require.main === module) {
  if (process.argv.includes('--validar')) {
    autovalidar();
  } else {
    crearServidor().listen(PUERTO, () => {
      console.log(`${IDENTIDAD.servicio} v${IDENTIDAD.version} escuchando en http://localhost:${PUERTO}`);
    });
  }
}

module.exports = { IDENTIDAD, validarEvaluacion, evaluar, crearServidor };
