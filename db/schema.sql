-- ============================================================
-- BizSmart - Script de base de datos PostgreSQL
-- Fase 2: Modelo físico
-- ============================================================
-- Convención: snake_case, PK "id" tipo BIGSERIAL, timestamps
-- created_at / updated_at en toda entidad mutable, estado
-- "active" en catálogos maestros (users, products, customers).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid() si se requiere en el futuro

-- ============================================================
-- ESQUEMA: auth  (roles, permisos, usuarios)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.roles (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,   -- ADMIN, OWNER, SELLER, VIEWER
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth.permissions (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(100) NOT NULL UNIQUE,  -- ej: products:manage, sales:create
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth.role_permissions (
    role_id         BIGINT NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES auth.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE auth.users (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255),              -- NULL para usuarios que solo entran por OAuth 2.0 (HU02)
    oauth_provider  VARCHAR(30),                -- ej: 'google'. NULL si el usuario usa correo+clave
    oauth_id        VARCHAR(255),               -- id del usuario en el proveedor externo (ej. Google "sub")
    role_id         BIGINT NOT NULL REFERENCES auth.roles(id),
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT chk_users_auth_method CHECK (password_hash IS NOT NULL OR oauth_provider IS NOT NULL)
);

-- Un mismo (proveedor, id externo) solo puede estar ligado a un usuario.
CREATE UNIQUE INDEX idx_users_oauth_identity ON auth.users(oauth_provider, oauth_id)
    WHERE oauth_provider IS NOT NULL;

CREATE INDEX idx_users_role_id ON auth.users(role_id);
CREATE INDEX idx_users_active ON auth.users(active);

-- ============================================================
-- ESQUEMA: catalog  (categorías y productos)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.categories (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog.products (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    category_id     BIGINT REFERENCES catalog.categories(id),
    price           NUMERIC(12,2) NOT NULL,
    minimum_stock   INTEGER NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_products_price_positive CHECK (price >= 0),
    CONSTRAINT chk_products_min_stock_nonneg CHECK (minimum_stock >= 0)
);

CREATE INDEX idx_products_category_id ON catalog.products(category_id);
CREATE INDEX idx_products_active ON catalog.products(active);
CREATE INDEX idx_products_name ON catalog.products(name);

-- ============================================================
-- ESQUEMA: inventory (existencias, movimientos, alertas)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS inventory;

CREATE TABLE inventory.inventory (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL UNIQUE REFERENCES catalog.products(id) ON DELETE CASCADE,
    current_stock   INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_inventory_stock_nonneg CHECK (current_stock >= 0)
);

CREATE TABLE inventory.inventory_movements (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES catalog.products(id),
    movement_type   VARCHAR(20) NOT NULL,  -- IN, OUT, SALE, ADJUSTMENT
    quantity        INTEGER NOT NULL,
    previous_stock  INTEGER NOT NULL,
    new_stock       INTEGER NOT NULL,
    reference       VARCHAR(150),          -- ej: número de venta
    created_by      BIGINT NOT NULL REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_movement_type CHECK (movement_type IN ('IN','OUT','SALE','ADJUSTMENT')),
    CONSTRAINT chk_movement_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_inv_movements_product_id ON inventory.inventory_movements(product_id);
CREATE INDEX idx_inv_movements_created_at ON inventory.inventory_movements(created_at);

CREATE TABLE inventory.alerts (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES catalog.products(id),
    alert_type      VARCHAR(30) NOT NULL DEFAULT 'LOW_STOCK',
    message         VARCHAR(255) NOT NULL,
    resolved        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_alerts_product_id ON inventory.alerts(product_id);
CREATE INDEX idx_alerts_resolved ON inventory.alerts(resolved);

-- ============================================================
-- ESQUEMA: crm (clientes)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS crm;

CREATE TABLE crm.customers (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    document        VARCHAR(30) NOT NULL UNIQUE,
    email           VARCHAR(150),
    phone           VARCHAR(30),
    address         VARCHAR(255),
    active          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_document ON crm.customers(document);
CREATE INDEX idx_customers_active ON crm.customers(active);

-- ============================================================
-- ESQUEMA: sales (ventas)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS sales;

CREATE TABLE sales.sales (
    id              BIGSERIAL PRIMARY KEY,
    customer_id     BIGINT REFERENCES crm.customers(id),
    seller_id       BIGINT NOT NULL REFERENCES auth.users(id),
    sale_date       TIMESTAMPTZ NOT NULL DEFAULT now(),
    subtotal        NUMERIC(14,2) NOT NULL,
    total           NUMERIC(14,2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, CANCELLED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_sale_status CHECK (status IN ('COMPLETED','CANCELLED')),
    CONSTRAINT chk_sale_totals_nonneg CHECK (subtotal >= 0 AND total >= 0)
);

CREATE INDEX idx_sales_customer_id ON sales.sales(customer_id);
CREATE INDEX idx_sales_seller_id ON sales.sales(seller_id);
CREATE INDEX idx_sales_sale_date ON sales.sales(sale_date);

CREATE TABLE sales.sale_details (
    id              BIGSERIAL PRIMARY KEY,
    sale_id         BIGINT NOT NULL REFERENCES sales.sales(id) ON DELETE CASCADE,
    product_id      BIGINT NOT NULL REFERENCES catalog.products(id),
    quantity        INTEGER NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    subtotal        NUMERIC(14,2) NOT NULL,
    CONSTRAINT chk_sale_detail_qty_positive CHECK (quantity > 0),
    CONSTRAINT chk_sale_detail_price_nonneg CHECK (unit_price >= 0)
);

CREATE INDEX idx_sale_details_sale_id ON sales.sale_details(sale_id);
CREATE INDEX idx_sale_details_product_id ON sales.sale_details(product_id);

-- ============================================================
-- ESQUEMA: audit (trazabilidad, HU17)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES auth.users(id),
    action          VARCHAR(50) NOT NULL,   -- LOGIN, CREATE, UPDATE, DEACTIVATE, ROLE_CHANGE, PERMISSION_CHANGE, SALE, INVENTORY_ADJUSTMENT
    entity          VARCHAR(50) NOT NULL,   -- User, Product, Sale, Inventory, ...
    entity_id       BIGINT,
    details         JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs(created_at);

-- ============================================================
-- DATOS INICIALES
-- Seed alineado EXACTAMENTE con la matriz de roles y permisos
-- de la ERS, sección 2.3.5 (HU01-HU17). El ADMIN administra la
-- plataforma pero NO opera el negocio (no vende, no gestiona
-- clientes, no usa IA) - ver tabla de la ERS.
-- ============================================================
INSERT INTO auth.roles (name, description) VALUES
    ('ADMIN', 'Administrador del sistema'),
    ('OWNER', 'Propietario / administrador del negocio'),
    ('SELLER', 'Vendedor / empleado'),
    ('VIEWER', 'Usuario de consulta');

INSERT INTO auth.permissions (code, description) VALUES
    ('users:manage', 'Gestionar usuarios'),
    ('roles:manage', 'Gestionar roles'),
    ('permissions:manage', 'Gestionar permisos'),
    ('products:manage', 'Gestionar productos'),
    ('products:read', 'Consultar productos'),
    ('inventory:manage', 'Gestionar inventario (entradas, salidas, ajustes)'),
    ('inventory:read', 'Consultar inventario'),
    ('sales:create', 'Registrar ventas'),
    ('sales:read', 'Consultar ventas (todas)'),
    ('sales:read:own', 'Consultar únicamente las ventas propias'),
    ('customers:manage', 'Gestionar clientes'),
    ('dashboard:read', 'Consultar dashboard completo'),
    ('dashboard:read:basic', 'Consultar indicadores básicos del dashboard'),
    ('reports:read', 'Consultar reportes completos'),
    ('reports:read:basic', 'Consultar reportes limitados/autorizados'),
    ('ai:use', 'Usar recomendaciones y análisis de tendencias de IA'),
    ('agent:use', 'Consultar el agente inteligente (preguntas sobre el negocio)'),
    ('agent:use:basic', 'Consultar el agente inteligente con alcance limitado'),
    ('audit:read', 'Consultar auditoría del sistema');

-- ADMIN: gobierno de la plataforma (HU03, HU04, HU17) + supervisión
-- (consulta productos/inventario/ventas/dashboard/reportes), pero
-- SIN operar el negocio: no vende (sales:create), no gestiona
-- clientes, y no usa IA/agente (columna "Admin. sistema" de la ERS).
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.name = 'ADMIN'
  AND p.code IN ('users:manage','roles:manage','permissions:manage',
                 'products:manage','products:read',
                 'inventory:manage','inventory:read',
                 'sales:read',
                 'dashboard:read','reports:read','audit:read');

-- OWNER: dueño del negocio, controla todo el flujo operativo y usa IA.
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.name = 'OWNER'
  AND p.code IN ('users:manage','products:manage','products:read',
                 'inventory:manage','inventory:read',
                 'sales:create','sales:read',
                 'customers:manage',
                 'dashboard:read','reports:read',
                 'ai:use','agent:use');

-- SELLER: opera ventas y clientes del día a día; acceso limitado (⚠)
-- a inventario (solo lectura, sin ajustes manuales), a sus propias
-- ventas, a un dashboard básico y al agente con alcance reducido.
-- No tiene reportes ni IA de recomendaciones.
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.name = 'SELLER'
  AND p.code IN ('products:read','inventory:read',
                 'sales:create','sales:read:own',
                 'customers:manage',
                 'dashboard:read:basic','agent:use:basic');

-- VIEWER: solo lectura autorizada, sin ventas ni clientes.
INSERT INTO auth.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM auth.roles r, auth.permissions p
WHERE r.name = 'VIEWER'
  AND p.code IN ('products:read','inventory:read',
                 'dashboard:read:basic','reports:read:basic');
