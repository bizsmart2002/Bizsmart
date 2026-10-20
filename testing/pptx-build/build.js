const pptxgen = require("pptxgenjs");

const THEME = {
  name: "BizSmartPruebas",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B1B1F",
    lt1: "FFFFFF",
    dk2: "21295C",
    lt2: "EAF2F8",
    accent1: "065A82",
    accent2: "1C7293",
    accent3: "02C39A",
    accent4: "D64550",
    accent5: "F2A541",
    accent6: "69A297",
    hlink: "065A82",
    folHlink: "21295C",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Ana Carolina Mayorga, Juan Esteban Niño";
pres.company = "UTS - Analisis y Diseno de Software";
pres.title = "BizSmart - Estrategia y resultados de pruebas";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };

const C = pres.SchemeColor;
const W = 13.33,
  H = 7.5;

// ---------------------------------------------------------------
// LAYOUTS
// ---------------------------------------------------------------

pres.defineSlideMaster({
  title: "Portada",
  background: { color: THEME.colors.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.9, y: 2.5, w: 11.5, h: 1.6, fontSize: 40, bold: true, color: THEME.colors.lt1, fontFace: THEME.headFontFace, align: "left" }, text: "" } },
    { placeholder: { options: { name: "subtitle", type: "body", x: 0.9, y: 4.05, w: 11.5, h: 0.9, fontSize: 18, color: THEME.colors.lt2, fontFace: THEME.bodyFontFace, align: "left" }, text: "" } },
  ],
});

pres.defineSlideMaster({
  title: "Divisor",
  background: { color: THEME.colors.accent1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.9, y: 3.0, w: 11.5, h: 1.3, fontSize: 34, bold: true, color: THEME.colors.lt1, fontFace: THEME.headFontFace, align: "left" }, text: "" } },
    { placeholder: { options: { name: "subtitle", type: "body", x: 0.9, y: 4.2, w: 11.5, h: 0.8, fontSize: 16, color: THEME.colors.lt2, fontFace: THEME.bodyFontFace, align: "left" }, text: "" } },
  ],
});

pres.defineSlideMaster({
  title: "Contenido",
  background: { color: THEME.colors.lt1 },
  objects: [
    { rect: { x: 0, y: 0, w: W, h: 1.05, fill: { color: THEME.colors.lt1 } } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.32, w: 11.5, h: 0.6, fontSize: 24, bold: true, color: THEME.colors.dk2, fontFace: THEME.headFontFace, align: "left" }, text: "" } },
    { text: { options: { x: 0.6, y: 7.12, w: 8, h: 0.3, fontSize: 9, color: "8A8F98", fontFace: THEME.bodyFontFace }, text: "BizSmart - Reporte de pruebas" } },
  ],
  slideNumber: { x: 12.6, y: 7.12, fontSize: 9, color: "8A8F98" },
});

pres.defineSlideMaster({
  title: "Cierre",
  background: { color: THEME.colors.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.9, y: 2.7, w: 11.5, h: 1.2, fontSize: 32, bold: true, color: THEME.colors.lt1, fontFace: THEME.headFontFace, align: "left" }, text: "" } },
  ],
});

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

function kpiCard(slide, x, y, w, h, value, label, color) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 }, shadow: { type: "outer", color: "9AA5B1", opacity: 0.35, blur: 6, offset: 2, angle: 90 } });
  slide.addText(value, { x, y: y + 0.12, w, h: h - 0.55, fontSize: 30, bold: true, color, align: "center", fontFace: THEME.headFontFace, isTextBox: true, margin: 0 });
  slide.addText(label, { x: x + 0.1, y: y + h - 0.5, w: w - 0.2, h: 0.4, fontSize: 10.5, color: THEME.colors.dk1, align: "center", fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });
}

function pill(slide, x, y, text, color) {
  const w = 0.17 + text.length * 0.082;
  slide.addShape("roundRect", { x, y, w, h: 0.32, rectRadius: 0.16, fill: { color }, line: { color } });
  slide.addText(text, { x, y, w, h: 0.32, fontSize: 10.5, bold: true, color: THEME.colors.lt1, align: "center", valign: "middle", fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });
}

function bodyList(slide, items, opts) {
  const arr = items.map((it, i) => ({
    text: it,
    options: { bullet: { code: "25CF" }, color: THEME.colors.dk1, breakLine: i < items.length - 1, paraSpaceAfter: 10 },
  }));
  slide.addText(arr, Object.assign({ x: 0.6, y: 1.3, w: 6.0, h: 5.4, fontSize: 14, fontFace: THEME.bodyFontFace, isTextBox: true, valign: "top" }, opts));
}

const IMG_FRAME = { shadow: { type: "outer", color: "5A6472", opacity: 0.4, blur: 7, offset: 3, angle: 90 } };

function framedImage(slide, opts) {
  const o = Object.assign({}, opts);
  slide.addShape("rect", { x: o.x - 0.03, y: o.y - 0.03, w: o.w + 0.06, h: o.h + 0.06, fill: { color: THEME.colors.lt1 }, line: { color: "D7DCE2", width: 1 }, shadow: IMG_FRAME.shadow });
  slide.addImage(o);
}

function evidenceSlide(sectionTitle, title, imgPath, comoTexto, funcionTexto, imgOpts) {
  const s2 = pres.addSlide({ masterName: "Contenido", sectionTitle });
  s2.addText(title, { placeholder: "title" });
  pill(s2, 10.4, 0.38, "Evidencia real", THEME.colors.accent3);
  const img = Object.assign({ path: imgPath, x: 0.6, y: 1.25, w: 7.3, h: 3.65 }, imgOpts || {});
  framedImage(s2, img);
  const tx = img.x + img.w + 0.3;
  const tw = 12.4 - tx;
  s2.addText(
    [
      { text: "Cómo se implementa", options: { bold: true, color: THEME.colors.accent1, breakLine: true, paraSpaceAfter: 4 } },
      { text: comoTexto, options: { color: THEME.colors.dk1, breakLine: true, paraSpaceAfter: 14 } },
      { text: "Qué función cumple en esta etapa", options: { bold: true, color: THEME.colors.accent4, breakLine: true, paraSpaceAfter: 4 } },
      { text: funcionTexto, options: { color: THEME.colors.dk1 } },
    ],
    { x: tx, y: 1.3, w: tw, h: 3.6, fontSize: 12.5, fontFace: THEME.bodyFontFace, isTextBox: true, valign: "top" }
  );
  return s2;
}

// ---------------------------------------------------------------
// 1. PORTADA
// ---------------------------------------------------------------
pres.addSection({ title: "Portada" });
let s = pres.addSlide({ masterName: "Portada", sectionTitle: "Portada" });
s.addText("BizSmart", { x: 0.9, y: 1.35, w: 8, h: 0.8, fontSize: 22, bold: true, color: THEME.colors.accent3, fontFace: THEME.headFontFace, isTextBox: true, margin: 0 });
s.addText("Estrategia y resultados de pruebas de software", { placeholder: "title" });
s.addText("Pruebas unitarias, de integración, de sistema, de aceptación, de regresión, de rendimiento y de seguridad", { placeholder: "subtitle" });
s.addText("Ana Carolina Mayorga  ·  Juan Esteban Niño", { x: 0.9, y: 6.3, w: 9, h: 0.5, fontSize: 16, bold: true, color: THEME.colors.lt1, fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });
s.addText("UTS — Análisis y Diseño de Software", { x: 0.9, y: 6.78, w: 9, h: 0.4, fontSize: 12, color: THEME.colors.lt2, fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });

// ---------------------------------------------------------------
// 2. AGENDA / PIRÁMIDE
// ---------------------------------------------------------------
pres.addSection({ title: "Panorama" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Panorama" });
s.addText("El panorama completo de pruebas", { placeholder: "title" });
const pyramid = [
  { label: "UAT · Rendimiento · Seguridad", w: 10.2, color: THEME.colors.accent4 },
  { label: "Sistema / API (Postman + Newman)", w: 8.6, color: THEME.colors.accent5 },
  { label: "Integración (con mocks y real)", w: 7.0, color: THEME.colors.accent2 },
  { label: "Unitarias (Jest, 8 microservicios)", w: 5.4, color: THEME.colors.accent1 },
];
let py = 1.55;
pyramid.forEach((row) => {
  const x = 3.0 + (10.2 - row.w) / 2;
  s.addShape("roundRect", { x, y: py, w: row.w, h: 0.95, rectRadius: 0.06, fill: { color: row.color }, line: { color: row.color } });
  s.addText(row.label, { x, y: py, w: row.w, h: 0.95, fontSize: 14, bold: true, color: THEME.colors.lt1, align: "center", valign: "middle", fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });
  py += 1.12;
});
s.addText(
  [
    { text: "Regresión no es un nivel nuevo:", options: { bold: true, color: THEME.colors.dk2, breakLine: true, paraSpaceAfter: 6 } },
    { text: "es correr todos los niveles anteriores cada vez que cambia el código, para confirmar que nada que ya funcionaba se rompió.", options: { color: THEME.colors.dk1 } },
  ],
  { x: 0.5, y: 5.85, w: 6.1, h: 1.3, fontSize: 13, fontFace: THEME.bodyFontFace, isTextBox: true, valign: "top" }
);
s.addText("BizSmart: Angular + NestJS (8 microservicios) + PostgreSQL, en Docker.", { x: 0.5, y: 1.3, w: 2.3, h: 1.0, fontSize: 11.5, italic: true, color: "5A6472", fontFace: THEME.bodyFontFace, isTextBox: true });

// ---------------------------------------------------------------
// 3. UNITARIAS
// ---------------------------------------------------------------
pres.addSection({ title: "Unitarias" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Unitarias" });
s.addText("1 · Pruebas unitarias", { placeholder: "title" });
pill(s, 9.4, 0.38, "Jest · mocks · sin BD", THEME.colors.accent1);
bodyList(s, [
  "Prueban una función o método aislado, con mocks, sin tocar base de datos ni otros servicios.",
  "Responden: ¿esta pieza de lógica hace lo que debe?",
  "Cómo correrlas: npm test -- --coverage en cada microservicio.",
  "Cubren las reglas de negocio principales de cada Service; los Controllers (capa delgada) casi no se prueban aparte.",
], { y: 1.35, h: 2.6 });
s.addShape("roundRect", { x: 0.6, y: 4.05, w: 6.0, h: 0.55, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText("Resultado: 61/61 pruebas pasan en 9 suites", { x: 0.6, y: 4.05, w: 6.0, h: 0.55, fontSize: 14, bold: true, color: THEME.colors.accent1, align: "center", valign: "middle", isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace });

s.addChart(
  pres.ChartType.bar,
  [
    {
      name: "Cobertura de líneas (%)",
      labels: ["gateway", "auth", "product", "inventory", "sales", "customer", "reporting", "ai"],
      values: [31.7, 36.8, 36.0, 40.8, 44.7, 24.6, 7.5, 12.1],
    },
  ],
  {
    x: 6.9, y: 1.3, w: 5.8, h: 4.9,
    barDir: "col",
    showTitle: true, title: "Cobertura de líneas por servicio",
    titleFontSize: 13, titleColor: THEME.colors.dk2, titleFontFace: THEME.bodyFontFace,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 9, dataLabelColor: THEME.colors.dk1,
    chartColors: [THEME.colors.accent2],
    showLegend: false,
    catAxisLabelColor: "5A6472", catAxisLabelFontSize: 9, catAxisLabelFontFace: THEME.bodyFontFace,
    valAxisLabelColor: "5A6472", valAxisLabelFontSize: 9, valAxisMaxVal: 50,
    valGridLine: { color: "E3E7EC", size: 1 }, catGridLine: { style: "none" },
  }
);
s.addText("Honestidad: reporting-service y ai-service tienen cobertura baja (7-12%).", { x: 0.6, y: 4.85, w: 6.0, h: 1.2, fontSize: 12, italic: true, color: THEME.colors.accent4, isTextBox: true, fontFace: THEME.bodyFontFace });

evidenceSlide(
  "Unitarias",
  "1 · Unitarias — evidencia real de ejecución",
  "screenshots/live/12-evidencia-unitarias.jpg",
  "Jest corre cada archivo *.spec.ts dentro del propio microservicio. Las dependencias externas (BD, HTTP a otros servicios) se reemplazan por mocks (jest.fn()), así que cada prueba se ejecuta en milisegundos y de forma aislada, sin tocar ningún recurso compartido.",
  "Es la primera barrera de calidad: atrapa errores de lógica de negocio (cálculos, validaciones, reglas) en segundos, antes de que el código llegue a integrarse con nada más. Si una regla de negocio se rompe, falla aquí — no en producción."
);

// ---------------------------------------------------------------
// 4. INTEGRACIÓN
// ---------------------------------------------------------------
pres.addSection({ title: "Integración" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Integración" });
s.addText("2 · Pruebas de integración", { placeholder: "title" });
pill(s, 9.1, 0.38, "Supertest", THEME.colors.accent2);
s.addText("Verifican que varias piezas trabajen juntas de verdad (controller + service + BD, o un microservicio llamando a otro por HTTP).", { x: 0.6, y: 1.2, w: 12.0, h: 0.6, fontSize: 13, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

const col1x = 0.6, col2x = 6.85, colw = 5.9, coly = 2.0, colh = 4.5;
s.addShape("roundRect", { x: col1x, y: coly, w: colw, h: colh, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText("Con mocks (capa HTTP / validación)", { x: col1x + 0.3, y: coly + 0.25, w: colw - 0.6, h: 0.4, fontSize: 15, bold: true, color: THEME.colors.dk2, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText(
  [
    { text: "auth-service/test/auth.e2e-spec.ts", options: { bold: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: "AuthService mockeado: prueba la ruta, el ValidationPipe y los status codes reales — no la lógica de negocio ni la BD.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "Resultado: 5/5 pasan", options: { bold: true, color: THEME.colors.accent1 } },
  ],
  { x: col1x + 0.3, y: coly + 0.75, w: colw - 0.6, h: colh - 1.0, fontSize: 13, color: THEME.colors.dk1, isTextBox: true, fontFace: THEME.bodyFontFace, valign: "top" }
);
s.addShape("roundRect", { x: col2x, y: coly, w: colw, h: colh, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText("Real (sin mocks, stack Docker completo)", { x: col2x + 0.3, y: coly + 0.25, w: colw - 0.6, h: 0.4, fontSize: 15, bold: true, color: THEME.colors.dk2, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText(
  [
    { text: "testing/integration/sales-inventory.int-spec.js", options: { bold: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: "product ↔ inventory, sales → product + inventory, sales ↔ customer — contra BD Postgres real y red real entre contenedores.", options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: "Resultado: 4/4 pasan (2 corridas)", options: { bold: true, color: THEME.colors.accent1 } },
  ],
  { x: col2x + 0.3, y: coly + 0.75, w: colw - 0.6, h: colh - 1.0, fontSize: 13, color: THEME.colors.dk1, isTextBox: true, fontFace: THEME.bodyFontFace, valign: "top" }
);

evidenceSlide(
  "Integración",
  "2 · Integración — evidencia real de ejecución",
  "screenshots/live/13-evidencia-integracion.jpg",
  "Supertest levanta una aplicación Nest (en memoria o contra el stack Docker) y le dispara peticiones HTTP reales. La variante mock prueba solo la ruta y la validación; la variante real deja que la petición atraviese sales-service → product-service → inventory-service → Postgres de verdad.",
  "Confirma que los microservicios se hablan correctamente entre sí por HTTP (el contrato real), no solo que cada uno funciona aislado. Es el nivel que habría atrapado el bug crítico de ventas si hubiera existido antes de esta sesión."
);

// ---------------------------------------------------------------
// 5. SISTEMA / API
// ---------------------------------------------------------------
pres.addSection({ title: "Sistema" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Sistema" });
s.addText("3 · Pruebas de sistema / API", { placeholder: "title" });
pill(s, 9.5, 0.38, "Postman + Newman", THEME.colors.accent5);
s.addText("Prueban el sistema completo ya desplegado, a través del api-gateway. Responden: ¿el sistema completo hace lo que el negocio necesita?", { x: 0.6, y: 1.2, w: 12.0, h: 0.6, fontSize: 13, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

kpiCard(s, 0.6, 2.0, 2.7, 1.5, "185", "requests, 17 carpetas", THEME.colors.accent1);
kpiCard(s, 3.5, 2.0, 2.7, 1.5, "276", "aserciones ejecutadas", THEME.colors.accent2);
kpiCard(s, 6.4, 2.0, 2.7, 1.5, "273", "en verde", THEME.colors.accent3);
kpiCard(s, 9.3, 2.0, 2.7, 1.5, "3", "en rojo (2 defectos conocidos)", THEME.colors.accent4);

s.addText("Flujo E2E completo cubierto por la colección", { x: 0.6, y: 3.85, w: 6, h: 0.4, fontSize: 14, bold: true, color: THEME.colors.dk2, isTextBox: true, fontFace: THEME.bodyFontFace });
const flow = ["Categoría", "Producto", "Stock inicial", "Cliente", "Venta", "Verificación", "Alerta", "Desactivar"];
let fx = 0.6;
const fw = (12.1 - (flow.length - 1) * 0.15) / flow.length;
flow.forEach((step, i) => {
  s.addShape("roundRect", { x: fx, y: 4.35, w: fw, h: 0.65, rectRadius: 0.06, fill: { color: i === 4 ? THEME.colors.accent4 : THEME.colors.accent2 }, line: { color: i === 4 ? THEME.colors.accent4 : THEME.colors.accent2 } });
  s.addText(step, { x: fx, y: 4.35, w: fw, h: 0.65, fontSize: 9.5, bold: true, color: THEME.colors.lt1, align: "center", valign: "middle", isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace });
  fx += fw + 0.15;
});
s.addText("Incluye matriz de roles (OWNER/ADMIN/SELLER/VIEWER) y casos negativos en todo endpoint de escritura (sin token, rol insuficiente, datos inválidos, id inexistente).", { x: 0.6, y: 5.3, w: 12.0, h: 0.6, fontSize: 12.5, color: THEME.colors.dk1, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText("El paso “Venta” (en rojo) tenía un defecto crítico — corregido el 13-oct-2026, ver slide 9.", { x: 0.6, y: 6.0, w: 12.0, h: 0.5, fontSize: 12, italic: true, color: THEME.colors.accent4, isTextBox: true, fontFace: THEME.bodyFontFace });

// ---------------------------------------------------------------
// 5b-5c. EVIDENCIA REAL: CAPTURAS DE LA CORRIDA DE POSTMAN/NEWMAN
// Imágenes reales de screenshots/ (navegador integrado sobre una página
// generada a partir de la salida real de `newman run`; el reporte
// htmlextra oficial de Newman no renderizó en este entorno por su peso).
// ---------------------------------------------------------------
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Sistema" });
s.addText("Evidencia real · corrida de Postman/Newman (1/2)", { placeholder: "title" });
pill(s, 10.4, 0.38, "Captura real", THEME.colors.accent5);
framedImage(s, { path: "screenshots/postman-01-resumen.jpg", x: 1.55, y: 1.35, w: 10.2, h: 5.53 });
s.addText("Resumen real de la corrida: 186 requests, 183 test-scripts, 276 aserciones (273 en verde). Mismo comando documentado en testing/postman/README.md.", { x: 0.6, y: 6.95, w: 12.1, h: 0.45, fontSize: 11, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Sistema" });
s.addText("Evidencia real · corrida de Postman/Newman (2/2)", { placeholder: "title" });
pill(s, 10.4, 0.38, "Captura real", THEME.colors.accent5);
framedImage(s, { path: "screenshots/postman-02-fallas-flujo.jpg", x: 1.55, y: 1.35, w: 10.2, h: 5.53 });
s.addText("Detalle de las 3 aserciones en rojo (hallazgos ya documentados) y el flujo E2E de venta, que ahora pasa completo tras el fix del 13-oct-2026.", { x: 0.6, y: 6.95, w: 12.1, h: 0.45, fontSize: 11, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Sistema" });
s.addText("Sistema/API — cómo se implementa y qué función cumple", { placeholder: "title" });
pill(s, 10.1, 0.38, "Síntesis", THEME.colors.accent5);
s.addShape("roundRect", { x: 0.6, y: 1.5, w: 11.9, h: 2.4, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText([
  { text: "Cómo se implementa  ", options: { bold: true, color: THEME.colors.accent1 } },
  { text: "Una colección Postman (JSON) con 185 requests versionada en el repo; Newman la ejecuta por CLI contra el api-gateway real, con scripts pm.test() que validan status, shape y reglas de negocio en cada respuesta. También se corrió en vivo, petición por petición, en la propia interfaz de Postman.", options: {} },
], { x: 0.9, y: 1.75, w: 11.3, h: 1.0, fontSize: 13, fontFace: THEME.bodyFontFace, isTextBox: true, valign: "top" });
s.addText([
  { text: "Qué función cumple en esta etapa  ", options: { bold: true, color: THEME.colors.accent4 } },
  { text: "Es la prueba de caja negra definitiva: no le importa cómo está hecho cada microservicio por dentro, solo que la API responda lo que el negocio necesita, de punta a punta, a través de la misma puerta que usaría el frontend real.", options: {} },
], { x: 0.9, y: 2.85, w: 11.3, h: 0.9, fontSize: 13, fontFace: THEME.bodyFontFace, isTextBox: true, valign: "top" });

// ---------------------------------------------------------------
// 6. UAT
// ---------------------------------------------------------------
pres.addSection({ title: "UAT" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "UAT" });
s.addText("4 · Pruebas de aceptación (UAT)", { placeholder: "title" });
pill(s, 9.7, 0.38, "Manual", THEME.colors.accent6);
bodyList(s, [
  "Las hace alguien que no programó el sistema (el profesor, un usuario real), siguiendo casos de uso del negocio.",
  "No se automatizan con código: se guían con un checklist de escenarios.",
  "Instrumento entregado: testing/UAT-checklist.md",
  "27 escenarios en 7 módulos, con pasos sobre el frontend real (localhost:4200) y columnas Pasa / Falla / Observación.",
], { h: 3.0 });
const modules = [
  ["Autenticación y roles", "6"],
  ["Productos", "5"],
  ["Inventario y alertas", "4"],
  ["Clientes", "2"],
  ["Ventas", "4"],
  ["Dashboard y reportes", "4"],
  ["Inteligencia artificial", "2"],
];
let my = 1.5;
modules.forEach((m) => {
  s.addShape("roundRect", { x: 7.0, y: my, w: 5.7, h: 0.55, rectRadius: 0.05, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
  s.addText(m[0], { x: 7.2, y: my, w: 4.0, h: 0.55, fontSize: 12.5, color: THEME.colors.dk1, valign: "middle", isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace });
  s.addText(m[1], { x: 11.3, y: my, w: 1.2, h: 0.55, fontSize: 14, bold: true, color: THEME.colors.accent1, valign: "middle", align: "center", isTextBox: true, margin: 0, fontFace: THEME.bodyFontFace });
  my += 0.63;
});
s.addText("Total: 27 escenarios  ·  Estado: pendiente de ejecución manual (instrumento listo)", { x: 7.0, y: my + 0.1, w: 5.7, h: 0.5, fontSize: 12, italic: true, color: THEME.colors.accent4, isTextBox: true, fontFace: THEME.bodyFontFace });

evidenceSlide(
  "UAT",
  "4 · UAT — evidencia real del frontend",
  "screenshots/live/11-frontend-login.jpg",
  "El checklist (testing/UAT-checklist.md) define escenarios en lenguaje de negocio, sin código: pasos concretos sobre la pantalla real del frontend (aquí, el login real en localhost:4200) y una columna Pasa/Falla/Observación para que lo diligencie alguien ajeno al desarrollo.",
  "Es la única prueba que valida la experiencia completa del usuario final, incluyendo el frontend — algo que ningún nivel anterior cubre, porque todos hablan con la API, nunca con la pantalla. Confirma que el sistema sirve para el negocio, no solo que el código funciona.",
  { x: 2.1, y: 1.4, w: 3.9, h: 4.4, sizing: { type: "contain", w: 3.9, h: 4.4 } }
);

// ---------------------------------------------------------------
// 7. REGRESIÓN
// ---------------------------------------------------------------
pres.addSection({ title: "Regresión" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Regresión" });
s.addText("5 · Pruebas de regresión", { placeholder: "title" });
pill(s, 9.6, 0.38, "CI/CD + script", THEME.colors.accent1);
s.addText("No es un tipo nuevo de prueba: es correr todas las anteriores cada vez que cambia el código, para confirmar que no se rompió algo que ya funcionaba.", { x: 0.6, y: 1.2, w: 12.0, h: 0.6, fontSize: 13, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s.addShape("roundRect", { x: 0.6, y: 2.0, w: 5.9, h: 4.4, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText("Local: testing/run-all.sh", { x: 0.9, y: 2.25, w: 5.3, h: 0.4, fontSize: 15, bold: true, color: THEME.colors.dk2, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText(
  [
    { text: "1. Unitarias (8 servicios)", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "2. Integración con mocks (auth e2e)", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "3. Integración real (stack Docker)", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "4. Sistema / API (Postman + Newman)", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Un solo comando, con resumen final.", options: { italic: true, color: "5A6472" } },
  ],
  { x: 0.9, y: 2.8, w: 5.3, h: 3.4, fontSize: 13, color: THEME.colors.dk1, isTextBox: true, fontFace: THEME.bodyFontFace, valign: "top" }
);

s.addShape("roundRect", { x: 6.85, y: 2.0, w: 5.9, h: 4.4, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText("CI: .github/workflows/ci-cd.yml", { x: 7.15, y: 2.25, w: 5.3, h: 0.4, fontSize: 15, bold: true, color: THEME.colors.dk2, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText(
  [
    { text: "Matriz por servicio: lint + build + unit + e2e (auth) + npm audit.", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Job api-tests-newman: levanta el stack completo con Docker y corre la colección Postman.", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Se ejecuta en cada push/PR a main y develop.", options: { bullet: true } },
  ],
  { x: 7.15, y: 2.8, w: 5.3, h: 3.4, fontSize: 13, color: THEME.colors.dk1, isTextBox: true, fontFace: THEME.bodyFontFace, valign: "top" }
);

evidenceSlide(
  "Regresión",
  "5 · Regresión — evidencia real de ejecución",
  "screenshots/live/14-evidencia-regresion.jpg",
  "testing/run-all.sh ejecuta en orden: unitarias (8 servicios) → integración con mocks → integración real → Postman/Newman, e imprime un resumen consolidado al final; termina con código de salida distinto de cero si algo conocido sigue roto.",
  "Es la red de seguridad para CUALQUIER cambio futuro: un solo comando confirma, de un vistazo, que nada que ya funcionaba se rompió. El mismo rol lo cumple el pipeline de CI/CD en cada push, de forma automática."
);

// ---------------------------------------------------------------
// 8. RENDIMIENTO
// ---------------------------------------------------------------
pres.addSection({ title: "Rendimiento y seguridad" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Rendimiento y seguridad" });
s.addText("6 · Pruebas de rendimiento / carga", { placeholder: "title" });
pill(s, 9.7, 0.38, "autocannon", THEME.colors.accent5);
s.addText("Miden cómo se comporta el sistema bajo muchas peticiones simultáneas. Herramienta ligera (npx autocannon), 20 conexiones x 20s, 3 endpoints.", { x: 0.6, y: 1.2, w: 12.0, h: 0.6, fontSize: 13, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s.addTable(
  [
    [
      { text: "Endpoint", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.accent1 } } },
      { text: "Latencia p50", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.accent1 } } },
      { text: "Latencia p99", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.accent1 } } },
      { text: "% de 2xx bajo carga sostenida", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.accent1 } } },
    ],
    ["POST /auth/login", "7 ms", "62 ms", "~0.9% (298 / 33.7k)"],
    ["GET /products", "5 ms", "17 ms", "0% (0 / 65.6k)"],
    ["GET /dashboard/summary", "4 ms", "13 ms", "0% (0 / 69.8k)"],
  ],
  { x: 0.6, y: 2.0, w: 12.1, h: 1.8, fontSize: 12.5, fontFace: THEME.bodyFontFace, border: { type: "solid", color: "E3E7EC", pt: 1 }, autoPage: false }
);

s.addShape("roundRect", { x: 0.6, y: 4.1, w: 12.1, h: 2.3, rectRadius: 0.08, fill: { color: THEME.colors.lt2 }, line: { color: THEME.colors.lt2 } });
s.addText("Hallazgo honesto", { x: 0.9, y: 4.3, w: 4, h: 0.4, fontSize: 14, bold: true, color: THEME.colors.accent4, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText(
  "La latencia individual es excelente (milisegundos). Pero bajo 20 conexiones concurrentes, la enorme mayoría de las respuestas NO son 2xx: el api-gateway aplica un rate-limiter de 300 peticiones/minuto (confirmado en el código y en el header X-RateLimit-Limit). Es una protección deliberada, no un error — pero significa que el sistema no está dimensionado para más de ~5 peticiones/segundo sostenidas por el gateway.",
  { x: 0.9, y: 4.75, w: 11.5, h: 1.5, fontSize: 13, color: THEME.colors.dk1, isTextBox: true, fontFace: THEME.bodyFontFace, valign: "top" }
);

evidenceSlide(
  "Rendimiento y seguridad",
  "6 · Rendimiento — evidencia real de ejecución",
  "screenshots/live/15-evidencia-rendimiento.jpg",
  "autocannon abre N conexiones concurrentes (aquí 20) contra un endpoint durante un tiempo fijo (20s) y mide latencia y throughput reales; no simula usuarios, genera carga HTTP directa contra el api-gateway.",
  "Mide si el sistema aguanta carga simultánea ANTES de salir a producción. Aquí reveló un límite real y deliberado (rate-limiting de 300 req/min), información que el equipo necesita para dimensionar el despliegue, no solo para optimizar código."
);

// ---------------------------------------------------------------
// 9. SEGURIDAD
// ---------------------------------------------------------------
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Rendimiento y seguridad" });
s.addText("7 · Pruebas de seguridad y hallazgos corregidos", { placeholder: "title" });
pill(s, 10.1, 0.38, "Manual", THEME.colors.accent4);

s.addTable(
  [
    [
      { text: "Severidad", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.dk2 } } },
      { text: "Hallazgo", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.dk2 } } },
      { text: "Estado", options: { bold: true, color: THEME.colors.lt1, fill: { color: THEME.colors.dk2 } } },
    ],
    [
      { text: "Crítica", options: { color: THEME.colors.accent4, bold: true } },
      "Ninguna venta se podía registrar (IDs bigint comparados como texto vs. número, en 2 puntos de la cadena)",
      { text: "Corregido", options: { color: THEME.colors.accent3, bold: true } },
    ],
    [
      { text: "Alta", options: { color: THEME.colors.accent5, bold: true } },
      "Rutas de inventario (check-stock, movements) tapadas por el orden de declaración de rutas",
      { text: "Corregido", options: { color: THEME.colors.accent3, bold: true } },
    ],
    [
      { text: "Alta (seguridad)", options: { color: THEME.colors.accent5, bold: true } },
      "POST /inventory/movements/sale sin control de rol: un usuario de solo lectura puede descontar stock real",
      { text: "Abierto (decisión del usuario)", options: { color: THEME.colors.accent4, bold: true } },
    ],
    [
      { text: "Media", options: { color: "C98A1A", bold: true } },
      "Nombre de producto sin límite de longitud -> error 500 con 10.000 caracteres",
      { text: "Abierto", options: { color: THEME.colors.accent4, bold: true } },
    ],
    [
      { text: "Media", options: { color: "C98A1A", bold: true } },
      "Consultar un producto inexistente responde 500 en vez de 404",
      { text: "Abierto", options: { color: THEME.colors.accent4, bold: true } },
    ],
  ],
  { x: 0.6, y: 1.3, w: 12.1, h: 4.6, fontSize: 12, fontFace: THEME.bodyFontFace, border: { type: "solid", color: "E3E7EC", pt: 1 }, autoPage: false, colW: [1.8, 8.3, 2.0], valign: "middle" }
);
s.addText("No se ejecutó un barrido adversarial adicional (fuzzing de JWT, inyección sistemática) en esta entrega — decisión explícita del usuario.", { x: 0.6, y: 6.15, w: 12.1, h: 0.5, fontSize: 12, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

evidenceSlide(
  "Rendimiento y seguridad",
  "6 · Seguridad — evidencia real de ejecución",
  "screenshots/live/16-evidencia-seguridad.jpg",
  "Fuzzing manual de payloads vía Postman/curl (valores extremos, tipos inválidos) combinado con lectura directa del código fuente para confirmar la causa raíz exacta — nunca se asume, se cita el archivo:línea donde falla la validación.",
  "Encuentra fallas de validación y de autorización ANTES de que un usuario malicioso las explote. Este hallazgo concreto (500 en vez de 400) se confirmó por dos vías independientes — automatizada y en vivo — lo que descarta que sea un error de la propia prueba."
);

// ---------------------------------------------------------------
// 10. EL BUG CRÍTICO EXPLICADO
// ---------------------------------------------------------------
pres.addSection({ title: "Hallazgos" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Hallazgos" });
s.addText("Caso destacado: el bug que impedía vender", { placeholder: "title" });
pill(s, 10.3, 0.38, "Corregido", THEME.colors.accent3);
bodyList(s, [
  "PostgreSQL guarda los IDs como bigint; TypeORM los devuelve como texto (\"1\") para no perder precisión en JavaScript.",
  "sales-service comparaba ese texto con el número que mandaba el formulario (\"1\" === 1): la comparación siempre daba falso.",
  "Resultado: toda venta fallaba con \"el producto no existe\", para cualquier rol, aunque el producto sí existiera.",
  "El mismo patrón se repetía con el identificador del vendedor al registrar el movimiento de inventario.",
], { h: 4.2, w: 6.2 });

s.addShape("roundRect", { x: 7.0, y: 1.3, w: 5.7, h: 4.9, rectRadius: 0.08, fill: { color: THEME.colors.dk2 }, line: { color: THEME.colors.dk2 } });
s.addText("Evidencia antes / después", { x: 7.3, y: 1.5, w: 5.1, h: 0.4, fontSize: 14, bold: true, color: THEME.colors.lt1, isTextBox: true, fontFace: THEME.bodyFontFace });
s.addText(
  [
    { text: "Antes:", options: { bold: true, color: THEME.colors.accent4, breakLine: true } },
    { text: "\"El producto 1 no existe\" (400) con el producto activo y con stock", options: { color: THEME.colors.lt2, breakLine: true, paraSpaceAfter: 10 } },
    { text: "Después:", options: { bold: true, color: THEME.colors.accent3, breakLine: true } },
    { text: "Venta registrada; stock bajó de 114 a 113 unidades; aparece en el historial del cliente y en el dashboard", options: { color: THEME.colors.lt2, breakLine: true, paraSpaceAfter: 10 } },
    { text: "Verificado con:", options: { bold: true, color: THEME.colors.lt1, breakLine: true } },
    { text: "curl de punta a punta, 4 pruebas de integración real, y la colección Postman completa (276 aserciones) sin nuevas fallas", options: { color: THEME.colors.lt2 } },
  ],
  { x: 7.3, y: 2.05, w: 5.1, h: 4.0, fontSize: 12.5, fontFace: THEME.bodyFontFace, isTextBox: true, valign: "top" }
);

// ---------------------------------------------------------------
// 10b. EVIDENCIA EN VIVO DESDE LA INTERFAZ DE POSTMAN (web, cuenta real
// del usuario, Desktop Agent local). No son capturas de una página propia:
// son la interfaz de Postman funcionando contra el stack real.
// ---------------------------------------------------------------
pres.addSection({ title: "Postman en vivo" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Postman en vivo" });
s.addText("Evidencia en vivo · Postman (autenticación)", { placeholder: "title" });
pill(s, 9.9, 0.38, "Captura real UI", THEME.colors.accent3);
framedImage(s, { path: "screenshots/live/01-login-owner.jpg", x: 0.5, y: 1.25, w: 5.9, h: 2.6 });
framedImage(s, { path: "screenshots/live/02-login-401.jpg", x: 6.55, y: 1.25, w: 5.9, h: 2.6 });
framedImage(s, { path: "screenshots/live/03-me-401.jpg", x: 3.0, y: 4.0, w: 5.9, h: 2.6 });
s.addText("Login válido (200, token real) · login con clave incorrecta (401) · /auth/me sin token (401). Todo ejecutado en vivo desde la cuenta de Postman del usuario, contra el stack Docker real.", { x: 0.5, y: 6.7, w: 12.3, h: 0.5, fontSize: 11, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Postman en vivo" });
s.addText("Evidencia en vivo · Postman (flujo de venta)", { placeholder: "title" });
pill(s, 9.9, 0.38, "Captura real UI", THEME.colors.accent3);
framedImage(s, { path: "screenshots/live/04-stock-antes.jpg", x: 0.5, y: 1.25, w: 5.9, h: 2.6 });
framedImage(s, { path: "screenshots/live/05-venta-201.jpg", x: 6.55, y: 1.25, w: 5.9, h: 2.6 });
framedImage(s, { path: "screenshots/live/06-stock-despues.jpg", x: 3.0, y: 4.0, w: 5.9, h: 2.6 });
s.addText("Stock antes (133) → venta de 2 unidades registrada (201 Created) → stock después (131). El mismo flujo que antes del fix fallaba siempre, capturado en vivo petición por petición.", { x: 0.5, y: 6.7, w: 12.3, h: 0.5, fontSize: 11, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Postman en vivo" });
s.addText("Evidencia en vivo · Postman (endpoints más usados)", { placeholder: "title" });
pill(s, 9.9, 0.38, "Captura real UI", THEME.colors.accent3);
framedImage(s, { path: "screenshots/live/07-products-200.jpg", x: 0.5, y: 1.25, w: 5.9, h: 2.6 });
framedImage(s, { path: "screenshots/live/08-dashboard-200.jpg", x: 6.55, y: 1.25, w: 5.9, h: 2.6 });
framedImage(s, { path: "screenshots/live/09-customers-200.jpg", x: 3.0, y: 4.0, w: 5.9, h: 2.6 });
s.addText("Catálogo de productos, resumen del dashboard ($186.800 en ventas, 31 ventas) y listado de clientes — los tres endpoints de lectura más usados por el frontend, ejecutados en vivo contra el stack real.", { x: 0.5, y: 6.7, w: 12.3, h: 0.5, fontSize: 11, italic: true, color: "5A6472", isTextBox: true, fontFace: THEME.bodyFontFace });

s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Postman en vivo" });
s.addText("Evidencia en vivo · Postman (hallazgo confirmado)", { placeholder: "title" });
pill(s, 9.3, 0.38, "Captura real UI", THEME.colors.accent4);
framedImage(s, { path: "screenshots/live/10-products-500.jpg", x: 2.9, y: 1.3, w: 7.5, h: 4.85 });
s.addText("POST /products con un nombre de 2.000 caracteres responde 500 Internal Server Error (se esperaría 400). Es el mismo hallazgo que reportó VERONICA por Newman — aquí se reproduce en vivo, en la propia interfaz de Postman, confirmando que no es un artefacto de la corrida automatizada.", { x: 0.5, y: 6.35, w: 12.3, h: 0.85, fontSize: 12, italic: true, color: THEME.colors.accent4, isTextBox: true, fontFace: THEME.bodyFontFace });

// ---------------------------------------------------------------
// 11. LIMITACIONES
// ---------------------------------------------------------------
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Hallazgos" });
s.addText("Lo que no se implementó o no se verificó", { placeholder: "title" });
pill(s, 10.5, 0.38, "Honestidad", THEME.colors.accent6);
bodyList(s, [
  "UAT: el checklist está listo, pero su ejecución manual queda pendiente (por definición, no es automatizable).",
  "Flujo completo de inicio de sesión con Google: las credenciales del entorno son de prueba (changeme).",
  "Contenido semántico de las respuestas de IA: depende de un proveedor externo no determinista.",
  "Barrido de seguridad adversarial adicional (JWT forjado, fuzzing sistemático): no se ejecutó en esta entrega, por decisión del usuario.",
  "2 defectos de severidad media quedan abiertos y documentados (nombre de producto sin límite, 404 que responde 500).",
], { h: 4.6, w: 11.9 });

// ---------------------------------------------------------------
// 12. CONCLUSIONES
// ---------------------------------------------------------------
pres.addSection({ title: "Cierre" });
s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Cierre" });
s.addText("Conclusiones", { placeholder: "title" });
kpiCard(s, 0.6, 1.4, 2.95, 1.7, "61", "pruebas unitarias, todas en verde", THEME.colors.accent1);
kpiCard(s, 3.75, 1.4, 2.95, 1.7, "9", "pruebas de integración (mock + real)", THEME.colors.accent2);
kpiCard(s, 6.9, 1.4, 2.95, 1.7, "276", "aserciones de sistema/API", THEME.colors.accent3);
kpiCard(s, 10.05, 1.4, 2.95, 1.7, "27", "escenarios de aceptación listos", THEME.colors.accent6);
bodyList(s, [
  "BizSmart tiene cobertura real en los 6 niveles de prueba, no solo en el discurso: unitarias, integración (ambas variantes), sistema, aceptación, regresión y rendimiento/seguridad.",
  "Las pruebas no fueron solo documentación: encontraron un defecto crítico real (ninguna venta se podía registrar) y permitieron corregirlo y verificarlo de punta a punta.",
  "Quedan 2 defectos de severidad media y 1 hallazgo de seguridad abiertos por decisión explícita, documentados para no perderlos de vista.",
], { y: 3.5, w: 12.1, h: 3.4 });

// ---------------------------------------------------------------
// 13. CIERRE / AUTORES
// ---------------------------------------------------------------
s = pres.addSlide({ masterName: "Cierre", sectionTitle: "Cierre" });
s.addText("Gracias", { placeholder: "title" });
s.addText("Ana Carolina Mayorga  ·  Juan Esteban Niño", { x: 0.9, y: 3.95, w: 10, h: 0.5, fontSize: 18, bold: true, color: THEME.colors.lt1, fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });
s.addText("Proyecto BizSmart — UTS, Análisis y Diseño de Software", { x: 0.9, y: 4.45, w: 10, h: 0.4, fontSize: 13, color: THEME.colors.lt2, fontFace: THEME.bodyFontFace, isTextBox: true, margin: 0 });

(async () => {
  await pres.writeFile({ fileName: "BizSmart-Pruebas.pptx" });
  const { applyTheme } = require("C:\\Users\\Tito Celis\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\skills-plugin\\58906979-d18c-467e-a2ef-0af092603ae0\\e76708cb-ee1c-47a7-ab1a-542471ca1ce8\\skills\\pptx\\scripts\\apply_theme.js");
  await applyTheme("BizSmart-Pruebas.pptx", THEME);
  console.log("OK");
})();
