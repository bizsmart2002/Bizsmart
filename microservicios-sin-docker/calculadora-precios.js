'use strict';
/**
 * Microservicio 1: calculadora-precios (sin Docker)
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
 *   node calculadora-precios.js            -> levanta el servicio (puerto 4001)
 *   node calculadora-precios.js --validar  -> se prueba a sí mismo y termina
 *   PORT=5000 node calculadora-precios.js  -> cambia el puerto (PowerShell: $env:PORT=5000)
 *
 * Endpoints:
 *   GET  /health     -> estado del servicio
 *   GET  /identidad  -> datos de identidad del servicio
 *   POST /calcular   -> { "items": [{ "precio": 1000, "cantidad": 2 }], "descuentoPct": 10 }
 */
const http = require('http');
const os = require('os');

// ---------------------------------------------------------------------------
// 1. IDENTIDAD
// ---------------------------------------------------------------------------
const IDENTIDAD = Object.freeze({
  servicio: 'calculadora-precios',
  version: '1.0.0',
  descripcion: 'Calcula subtotal, descuento, IVA y total de una venta',
  puertoPorDefecto: 4001,
});
const IVA = 0.19;
const PUERTO = Number(process.env.PORT) || IDENTIDAD.puertoPorDefecto;

// ---------------------------------------------------------------------------
// 2. VALIDADOR
// ---------------------------------------------------------------------------
function validarCalculo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['El cuerpo debe ser un objeto JSON'];
  }
  const errores = [];
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errores.push('items debe ser un arreglo con al menos un elemento');
  } else {
    body.items.forEach((item, i) => {
      if (!item || !Number.isFinite(item.precio) || item.precio < 0) {
        errores.push(`items[${i}].precio debe ser un número mayor o igual a 0`);
      }
      if (!item || !Number.isInteger(item.cantidad) || item.cantidad < 1) {
        errores.push(`items[${i}].cantidad debe ser un entero mayor o igual a 1`);
      }
    });
  }
  if (
    body.descuentoPct !== undefined &&
    (!Number.isFinite(body.descuentoPct) || body.descuentoPct < 0 || body.descuentoPct > 100)
  ) {
    errores.push('descuentoPct debe ser un número entre 0 y 100');
  }
  return errores;
}

// ---------------------------------------------------------------------------
// 3. ENDPOINTS (lógica de negocio)
// ---------------------------------------------------------------------------
const redondear = (n) => Math.round(n * 100) / 100;

function calcular({ items, descuentoPct = 0 }) {
  const subtotal = redondear(items.reduce((acc, it) => acc + it.precio * it.cantidad, 0));
  const descuento = redondear((subtotal * descuentoPct) / 100);
  const base = redondear(subtotal - descuento);
  const iva = redondear(base * IVA);
  return { subtotal, descuento, base, iva, total: redondear(base + iva) };
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
      if (req.method === 'POST' && pathname === '/calcular') {
        const body = await leerJson(req);
        const errores = validarCalculo(body);
        if (errores.length > 0) return responder(res, 400, { errores });
        return responder(res, 200, calcular(body));
      }
      return responder(res, 404, { error: 'Ruta no encontrada' });
    } catch (err) {
      return responder(res, 400, { errores: [err.message] });
    }
  });
}

// ---------------------------------------------------------------------------
// Autovalidación: node calculadora-precios.js --validar
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
    ['POST /calcular con descuento calcula bien', async () => {
      const r = await pedir('POST', '/calcular', {
        items: [{ precio: 1000, cantidad: 2 }, { precio: 500, cantidad: 1 }],
        descuentoPct: 10,
      });
      assert.strictEqual(r.status, 200);
      assert.deepStrictEqual(r.data, { subtotal: 2500, descuento: 250, base: 2250, iva: 427.5, total: 2677.5 });
    }],
    ['POST /calcular sin descuento aplica solo IVA', async () => {
      const r = await pedir('POST', '/calcular', { items: [{ precio: 100, cantidad: 1 }] });
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.data.total, 119);
    }],
    ['rechaza items vacío (400)', async () => {
      const r = await pedir('POST', '/calcular', { items: [] });
      assert.strictEqual(r.status, 400);
      assert.ok(r.data.errores.length > 0);
    }],
    ['rechaza precio negativo y cantidad 0 (400)', async () => {
      const r = await pedir('POST', '/calcular', { items: [{ precio: -5, cantidad: 0 }] });
      assert.strictEqual(r.status, 400);
      assert.strictEqual(r.data.errores.length, 2);
    }],
    ['rechaza descuento mayor a 100 (400)', async () => {
      const r = await pedir('POST', '/calcular', { items: [{ precio: 10, cantidad: 1 }], descuentoPct: 150 });
      assert.strictEqual(r.status, 400);
    }],
    ['rechaza JSON inválido (400)', async () => {
      const r = await pedir('POST', '/calcular', 'esto no es json');
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
  servidor.close();
  console.log(fallidas === 0 ? `\nTodas las pruebas pasaron (${pruebas.length}/${pruebas.length})` : `\n${fallidas} prueba(s) fallaron`);
  process.exit(fallidas === 0 ? 0 : 1);
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

module.exports = { IDENTIDAD, validarCalculo, calcular, crearServidor };
