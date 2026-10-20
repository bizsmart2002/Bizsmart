# Pruebas automatizadas de BizSmart

Este documento explica cómo quedó armada la parte de pruebas del proyecto. Se hizo
después de revisar el material de la clase de Marcos de Trabajo y del ciclo de vida
del software con herramientas open source, así que acá se explica también cómo se
relaciona lo que se hizo con lo que se vio en esas diapositivas.

## 1. Por qué se necesitan pruebas automatizadas

Durante el desarrollo de BizSmart, cada vez que se arreglaba un error se probaba el
sistema a mano: se abría el navegador, se iniciaba sesión, se hacía clic por toda la
pantalla y se revisaba que no se hubiera dañado nada más. Eso funciona, pero tiene un
problema grande: cada vez toca repetir todo desde cero, y es fácil que algo se quede
sin revisar.

En el material de la clase (etapa "Test" o "Ensayo" del ciclo de vida del software) se
explica que esta etapa existe justo para eso: verificar que el software hace lo que
tiene que hacer y que no quedó roto nada, antes de pasar a la siguiente etapa
(Liberación / Despliegue). La diferencia entre probar a mano y tener pruebas
automatizadas es que las automatizadas se pueden correr en segundos, tantas veces como
se quiera, y quedan conectadas al pipeline de CI/CD para que corran solas cada vez que
alguien sube un cambio.

## 2. La pirámide de pruebas (y qué se hizo de cada nivel)

Hay distintos niveles de pruebas, de los más rápidos/baratos a los más lentos/caros:

```
        /\
       /  \      E2E (extremo a extremo, navegador real)
      /----\     -> no se implementó todavía (ver sección 7)
     /      \
    / API    \   Pruebas de API (Postman / Newman)
   /----------\  -> colección en testing/postman/
  /            \
 / Integración  \  Pruebas de integración HTTP (Supertest)
/----------------\ -> auth-service (test/auth.e2e-spec.ts)
/                  \
/   Unitarias       \  Pruebas unitarias (Jest)
/______________________\ -> los 8 microservicios
```

Entre más abajo en la pirámide, más pruebas conviene tener (son rápidas y prueban una
sola cosa a la vez). Entre más arriba, menos hacen falta pero prueban que todo el
sistema funcione junto de verdad. BizSmart tiene una base sólida de pruebas unitarias
en los 8 microservicios, una prueba de integración HTTP en auth-service, y una
colección de pruebas de API que cubre el flujo completo del negocio.

## 3. Herramientas elegidas y por qué

BizSmart está hecho en NestJS (backend) y Angular (frontend), con TypeScript en los
dos. En las diapositivas de la clase se mencionan herramientas de pruebas para otros
lenguajes (JUnit para Java, pytest para Python). Como BizSmart no usa esos lenguajes,
se usó el equivalente para JavaScript/TypeScript, que es **Jest** (el mismo framework
que trae NestJS por defecto). La idea de fondo es la misma que explica el material:
"un framework de pruebas que te deja escribir casos de prueba fáciles de leer y correr
automáticamente", solo que aplicado al lenguaje del proyecto.

| En el material de la clase | Para qué sirve | En BizSmart |
|---|---|---|
| JUnit (Java) / pytest (Python) | Pruebas unitarias | **Jest** (ya viene con NestJS) |
| Postman | Pruebas de API | **Postman + Newman** (`testing/postman/`) |
| Selenium / Cypress | Pruebas end-to-end en el navegador | No implementado todavía (ver sección 7) |
| Jenkins / GitLab CI/CD | Correr las pruebas automáticamente en cada cambio | **GitHub Actions** (`.github/workflows/ci-cd.yml`), que cumple el mismo papel |

No se usó un framework distinto a Jest para no mezclar dos herramientas de pruebas en
el mismo proyecto sin necesidad: Jest ya cubre pruebas unitarias y pruebas de
integración HTTP (con la librería Supertest), que es casi todo lo que hace falta acá.

## 4. Qué se probó exactamente

Se escogieron los servicios y las reglas de negocio más importantes de probar, no
todo el código línea por línea (eso también lo menciona el material: no se trata de
alcanzar el 100% de cobertura a toda costa, sino de cubrir bien la lógica que más
importa). En total quedaron **66 pruebas automatizadas**, todas corridas y pasando:

| Servicio | Qué se prueba | Pruebas |
|---|---|---|
| `auth-service` | Registro, login con contraseña, login con Google (OAuth 2.0), que no se pueda hacer login por contraseña en una cuenta que solo existe por Google, y el `RolesGuard` (quién puede entrar a qué) | 16 unitarias + 5 de integración HTTP |
| `inventory-service` | Que el stock nunca quede negativo, que se genere la alerta de stock mínimo una sola vez (sin duplicarse), entradas/salidas/ventas | 12 unitarias |
| `sales-service` | El flujo completo de una venta: validar producto, validar stock, calcular el total, descontar inventario; y que se rechace si el cliente o el producto no existen | 6 unitarias |
| `product-service` | Crear, actualizar y dar de baja productos, validación de categoría | 8 unitarias |
| `ai-service` | Las reglas de la "IA simulada": cuándo recomienda reabastecer y cómo clasifica una tendencia de ventas como UP/DOWN/STABLE | 6 unitarias |
| `customer-service` | Crear cliente sin duplicar documento, historial de compras | 5 unitarias |
| `reporting-service` | Que el resumen del dashboard combine bien los datos de ventas, stock bajo y alertas | 2 unitarias |
| `api-gateway` | Que las peticiones se enruten al microservicio correcto, que un redirect de Google se reenvíe tal cual (y no se siga del lado del servidor), y que un servicio caído devuelva 503 sin filtrar detalles internos | 6 unitarias |

A nivel de API, la colección de Postman (`testing/postman/BizSmart.postman_collection.json`)
revisa el flujo de principio a fin: iniciar sesión, crear un producto, intentar hacer
cosas que un rol no debería poder hacer (por ejemplo un SELLER creando un producto),
registrar una venta real y confirmar que el dashboard la refleja.

## 5. Cómo correr las pruebas

Pruebas unitarias de un microservicio (ejemplo con `auth-service`):

```bash
cd backend/auth-service
npm install
npm test            # pruebas unitarias (Jest)
npm run test:cov     # con reporte de cobertura
npm run test:e2e     # pruebas de integración HTTP (Supertest), solo auth-service por ahora
```

El mismo patrón sirve para los otros 7 servicios, cambiando la carpeta.

Pruebas de API con Postman (con el sistema corriendo vía `docker compose up`):

```bash
npx newman run testing/postman/BizSmart.postman_collection.json \
  --environment testing/postman/BizSmart-local.postman_environment.json
```

También se puede abrir la colección directamente en la aplicación de Postman e irla
corriendo request por request, viendo las pruebas (pestaña "Tests") de cada una.

## 6. Integración con el pipeline de CI/CD

En `.github/workflows/ci-cd.yml` ya estaba armado un pipeline (lo que en el material
de la clase se llama Jenkins o GitLab CI/CD, acá con GitHub Actions porque el proyecto
vive en GitHub). Antes, el paso de pruebas no hacía nada real: solo imprimía un
mensaje de "sin pruebas todavía" y seguía. Ahora:

1. El job `backend` corre `npm test` de verdad para cada uno de los 8 microservicios
   (matriz de GitHub Actions, un trabajo por servicio).
2. Para `auth-service` también corre `npm run test:e2e` (las pruebas con Supertest).
3. Un job nuevo, `api-tests-newman`, levanta todo el sistema con `docker compose up`
   (igual que en un ambiente real) y corre la colección de Postman completa contra el
   api-gateway, con `newman`.
4. Solo si todo lo anterior pasa, el pipeline sigue a construir las imágenes de Docker
   y, en la rama principal, al despliegue.

Esto es justo la idea de integración continua que se ve en el material: las pruebas no
son un paso aparte que alguien corre "cuando se acuerda", sino una condición para que
el código pueda avanzar.

## 7. Qué falta (honestamente)

Siguiendo la misma lógica con la que se documentaron los pendientes anteriores del
proyecto (multi-negocio, por ejemplo):

- **Pruebas end-to-end de navegador real** (con Cypress o Selenium, como se menciona en
  el material): no se implementaron. Hoy la prueba más "de extremo a extremo" que hay
  es la colección de Postman, que prueba la API pero no hace clic en la interfaz de
  Angular. Sería el siguiente paso natural.
- **Pruebas unitarias del frontend Angular**: tampoco se hicieron. Angular trae Jasmine
  + Karma por defecto (mencionados en el material), que sería lo indicado para
  componentes como el login o el formulario de ventas.
- **Cobertura**: se cubrieron las reglas de negocio más importantes de cada servicio,
  no cada línea de código (por ejemplo, los controllers casi no se probaron aparte,
  porque son delgados y solo delegan al Service, que sí está probado).

## 8. Cómo exponer este tema

Para la sustentación en clase, además de este documento hay una presentación
(`BizSmart-Pruebas-Automatizadas.pptx`) que resume en diapositivas: qué son las
pruebas, la pirámide, la tabla de equivalencia de herramientas, ejemplos reales de
código de BizSmart, los números (66 pruebas, 8 servicios) y cómo se conecta todo con
el pipeline de CI/CD. La idea es mostrar en vivo, desde la terminal, cómo corren las
pruebas de `auth-service` o `inventory-service` y que el profesor vea que de verdad
pasan (`npm test`), y de ahí pasar a explicar la lógica de una o dos pruebas puntuales
(por ejemplo, la de que el stock nunca puede quedar negativo) para mostrar que no son
pruebas superficiales sino que están revisando reglas reales del negocio.
