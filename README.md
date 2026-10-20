# BizSmart — Sistema Inteligente de Gestión para Pequeños Negocios

Proyecto académico (UTS — Análisis y Diseño). Arquitectura de microservicios
con Angular + NestJS + PostgreSQL, patrón MVP, JWT + roles.

## Estado del proyecto: TODAS las fases construidas (17/17)

- **Fase 1** — Diseño técnico (documento separado: `bizsmart-fase1-diseno-tecnico.md`)
- **Fase 2** — Base de datos: `db/schema.sql` + `db/seed-demo.sql`
- **Fase 3** — Estructura de proyectos (este repo)
- **Fase 4** — Auth Service completo (JWT, roles, permisos, auditoría)
- **Fase 5** — Frontend Authentication (login, registro, guards, interceptor)
- **Fase 6** — Productos (backend + frontend + MVP)
- **Fase 7** — Inventario (backend + frontend + MVP)
- **Fase 8** — Clientes (backend + frontend + MVP)
- **Fase 9** — Ventas (backend + frontend + MVP, transacción venta↔inventario)
- **Fase 10** — Dashboard (KPIs, top productos, stock bajo, tendencia 7 días)
- **Fase 11** — Reportes (ventas/productos/inventario/clientes/top-selling, con filtros)
- **Fase 12** — Alertas (stock mínimo, generación automática)
- **Fase 13** — Auditoría (transversal, todos los servicios escriben en `audit.audit_logs`)
- **Fase 14** — Docker (`Dockerfile` por servicio + `docker-compose.yml`)
- **Fase 15** — CI/CD (`.github/workflows/ci-cd.yml`)
- **Fase 16** — Kubernetes (`k8s/`)
- **Fase 17** — IA (recomendaciones y agente conversacional simulados por reglas sobre datos reales, `ai-service`)

Los 8 servicios backend (`api-gateway` + 7 microservicios) **compilan sin
errores** (`npx tsc --noEmit`, verificado durante la construcción). El
frontend Angular no se compiló en este entorno (no tiene Node con soporte
completo del Angular CLI /esbuild disponible), así que revísalo con
`npm install && npm run build` como primer paso — es el punto más probable
de necesitar un ajuste menor (ver "Limitaciones conocidas" abajo).

## Credenciales de prueba (seed demo)

Contraseña para los 4 usuarios: **`Password123`**

| Rol | Correo |
|---|---|
| ADMIN | admin@bizsmart.test |
| OWNER | owner@bizsmart.test |
| SELLER | seller@bizsmart.test |
| VIEWER | viewer@bizsmart.test |

## Cómo levantar TODO con Docker (recomendado)

```bash
docker compose up --build
```

Esto levanta PostgreSQL (con `schema.sql` + `seed-demo.sql` cargados
automáticamente vía `docker-entrypoint-initdb.d`), los 7 microservicios,
el Gateway y el frontend.

- Frontend: http://localhost:4200
- API Gateway: http://localhost:3000
- Cada microservicio expone `/health` en su puerto (3001-3007)

## Cómo levantar en desarrollo local (sin Docker)

```bash
# 1. Base de datos
createdb bizsmart
psql -U postgres -d bizsmart -f db/schema.sql
psql -U postgres -d bizsmart -f db/seed-demo.sql

# 2. Cada microservicio (repetir para los 8: api-gateway, auth-service,
#    product-service, inventory-service, sales-service, customer-service,
#    reporting-service, ai-service)
cd backend/auth-service
cp .env.example .env
npm install
npm run start:dev

# 3. Frontend
cd frontend
npm install
npm start
```

## Kubernetes

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml -f k8s/02-secret.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl create configmap bizsmart-db-init -n bizsmart \
  --from-file=schema.sql=db/schema.sql --from-file=seed-demo.sql=db/seed-demo.sql
kubectl apply -f k8s/04-db-init-job.yaml
kubectl apply -f k8s/   # el resto de Deployments/Services/Ingress
```

Requiere haber construido y publicado las imágenes `bizsmart/<servicio>:latest`
en un registry accesible por el clúster (el CI/CD ya arma esas imágenes;
falta configurar el `push` a un registry real, ver comentarios en
`.github/workflows/ci-cd.yml`).

## Arquitectura y estructura

```
bizsmart/
  db/
    schema.sql        → modelo físico completo (Fase 2)
    seed-demo.sql      → datos de ejemplo (usuarios, productos, ventas)
  backend/
    api-gateway/        → proxy único (puerto 3000)
    auth-service/        → usuarios, roles, permisos, JWT (3001)
    product-service/     → productos, categorías (3002)
    inventory-service/   → inventario, movimientos, alertas (3003)
    sales-service/       → ventas (3004)
    customer-service/    → clientes (3005)
    reporting-service/   → dashboard, reportes (3006)
    ai-service/          → recomendaciones + agente simulado (3007)
  frontend/               → Angular 18 + Angular Material
  k8s/                    → manifiestos de Kubernetes
  .github/workflows/      → pipeline CI/CD
```

Cada microservicio backend sigue la misma estructura interna:
`common/auth/` (JWT strategy + guards + decoradores, réplica del patrón de
`auth-service`), `common/audit/` (AuditService compartido), y un módulo por
dominio (`products/`, `sales/`, etc.) con `entities/`, `dto/`, `*.controller.ts`,
`*.service.ts`.

## Usuarios/roles y permisos

Ver la matriz completa en `bizsmart-fase1-diseno-tecnico.md`, sección 7.
El seed de `db/schema.sql` implementa esa matriz exactamente.

## Limitaciones conocidas / próximos pasos sugeridos

- El frontend **no se compiló en este entorno** (no había Angular CLI con
  soporte esbuild disponible) — es real, completo y sigue el patrón MVP en
  cada feature, pero corre `npm install && npm run build` primero y ajusta
  cualquier detalle menor de versiones que aparezca.
- El sistema **no se probó end-to-end** contra una base de datos real en
  este entorno (no había Docker ni Postgres corriendo aquí). Los 8 backends
  sí se verificaron con `tsc --noEmit` (compilación TypeScript limpia).
- No hay pruebas unitarias/integración automatizadas todavía (los `npm test`
  del pipeline son placeholders) — recomendado añadir para la sustentación.
- Refresh tokens y OAuth 2.0 (HU02) quedaron como ampliación futura, según
  lo acordado en la Fase 1.
- El componente `<mat-chip>` standalone con `color`/`selected` usado en
  algunas tablas puede requerir ajustarse a `<mat-chip-set>` según la
  versión exacta de Angular Material que se instale.
