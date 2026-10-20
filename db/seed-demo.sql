-- ============================================================
-- BizSmart - Datos de ejemplo (demo) para sustentación
-- Ejecutar DESPUÉS de db/schema.sql
-- Contraseña de TODOS los usuarios de prueba: "Password123"
-- (hash bcrypt, costo 10, generado una sola vez para este seed)
-- ============================================================

-- ------------------------------------------------------------
-- USUARIOS DE PRUEBA (uno por rol)
-- ------------------------------------------------------------
INSERT INTO auth.users (name, email, password_hash, role_id, active)
SELECT 'Administradora del Sistema', 'admin@bizsmart.test',
       '$2b$10$qTwYK5ZdwfqEE0uwKr8Nb.AaqQv/ZguH8a3eqjr4YkJMRdh0eUA3i',
       r.id, true
FROM auth.roles r WHERE r.name = 'ADMIN';

INSERT INTO auth.users (name, email, password_hash, role_id, active)
SELECT 'Camila Owner - Tienda La Esquina', 'owner@bizsmart.test',
       '$2b$10$qTwYK5ZdwfqEE0uwKr8Nb.AaqQv/ZguH8a3eqjr4YkJMRdh0eUA3i',
       r.id, true
FROM auth.roles r WHERE r.name = 'OWNER';

INSERT INTO auth.users (name, email, password_hash, role_id, active)
SELECT 'Julián Vendedor', 'seller@bizsmart.test',
       '$2b$10$qTwYK5ZdwfqEE0uwKr8Nb.AaqQv/ZguH8a3eqjr4YkJMRdh0eUA3i',
       r.id, true
FROM auth.roles r WHERE r.name = 'SELLER';

INSERT INTO auth.users (name, email, password_hash, role_id, active)
SELECT 'Usuario de Consulta', 'viewer@bizsmart.test',
       '$2b$10$qTwYK5ZdwfqEE0uwKr8Nb.AaqQv/ZguH8a3eqjr4YkJMRdh0eUA3i',
       r.id, true
FROM auth.roles r WHERE r.name = 'VIEWER';

-- ------------------------------------------------------------
-- CATEGORÍAS Y PRODUCTOS
-- ------------------------------------------------------------
INSERT INTO catalog.categories (name, description) VALUES
    ('Bebidas', 'Gaseosas, jugos, agua y bebidas en general'),
    ('Snacks', 'Pasabocas y productos empacados'),
    ('Aseo', 'Productos de limpieza e higiene'),
    ('Panadería', 'Pan y productos de panadería');

INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Gaseosa 400ml', 'Bebida gaseosa personal', c.id, 2500, 20 FROM catalog.categories c WHERE c.name = 'Bebidas';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Agua 600ml', 'Agua embotellada', c.id, 1800, 15 FROM catalog.categories c WHERE c.name = 'Bebidas';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Jugo de mango 250ml', 'Jugo de fruta natural', c.id, 2200, 10 FROM catalog.categories c WHERE c.name = 'Bebidas';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Papas fritas 45g', 'Papas fritas sabor natural', c.id, 2000, 25 FROM catalog.categories c WHERE c.name = 'Snacks';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Galletas surtidas', 'Paquete de galletas dulces', c.id, 1500, 20 FROM catalog.categories c WHERE c.name = 'Snacks';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Jabón en barra', 'Jabón para lavar ropa', c.id, 2800, 10 FROM catalog.categories c WHERE c.name = 'Aseo';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Detergente 1kg', 'Detergente en polvo', c.id, 9500, 8 FROM catalog.categories c WHERE c.name = 'Aseo';
INSERT INTO catalog.products (name, description, category_id, price, minimum_stock)
SELECT 'Pan tajado', 'Pan de molde tajado', c.id, 6500, 12 FROM catalog.categories c WHERE c.name = 'Panadería';

-- ------------------------------------------------------------
-- INVENTARIO INICIAL (algunos productos deliberadamente en/bajo el mínimo
-- para poder demostrar alertas y recomendaciones de IA)
-- ------------------------------------------------------------
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 80 FROM catalog.products WHERE name = 'Gaseosa 400ml';
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 60 FROM catalog.products WHERE name = 'Agua 600ml';
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 8 FROM catalog.products WHERE name = 'Jugo de mango 250ml';     -- por debajo del mínimo (10)
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 90 FROM catalog.products WHERE name = 'Papas fritas 45g';
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 5 FROM catalog.products WHERE name = 'Galletas surtidas';       -- por debajo del mínimo (20)
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 40 FROM catalog.products WHERE name = 'Jabón en barra';
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 0 FROM catalog.products WHERE name = 'Detergente 1kg';          -- agotado
INSERT INTO inventory.inventory (product_id, current_stock)
SELECT id, 30 FROM catalog.products WHERE name = 'Pan tajado';

-- Alertas ya generadas para los productos que nacen bajo el mínimo
INSERT INTO inventory.alerts (product_id, alert_type, message, resolved)
SELECT id, 'LOW_STOCK', 'Stock por debajo del mínimo configurado', false
FROM catalog.products WHERE name IN ('Jugo de mango 250ml', 'Galletas surtidas', 'Detergente 1kg');

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
INSERT INTO crm.customers (name, document, email, phone, address) VALUES
    ('María Fernanda Torres', 'CC-1098765432', 'maria.torres@example.com', '3011234567', 'Cra 10 #20-30, Bucaramanga'),
    ('Carlos Andrés Gómez', 'CC-1102233445', 'carlos.gomez@example.com', '3109876543', 'Calle 45 #12-08, Bucaramanga'),
    ('Panadería El Trigal (cliente frecuente)', 'NIT-900123456', 'compras@eltrigal.com', '3123456789', 'Av. Quebradaseca #5-40');

-- ------------------------------------------------------------
-- VENTAS DE EJEMPLO (últimos días, para poblar dashboard/tendencias)
-- ------------------------------------------------------------
DO $$
DECLARE
  v_seller_id BIGINT;
  v_customer_id BIGINT;
  v_sale_id BIGINT;
  v_gaseosa_id BIGINT;
  v_agua_id BIGINT;
  v_papas_id BIGINT;
  v_galletas_id BIGINT;
BEGIN
  SELECT id INTO v_seller_id FROM auth.users WHERE email = 'seller@bizsmart.test';
  SELECT id INTO v_customer_id FROM crm.customers WHERE document = 'CC-1098765432';
  SELECT id INTO v_gaseosa_id FROM catalog.products WHERE name = 'Gaseosa 400ml';
  SELECT id INTO v_agua_id FROM catalog.products WHERE name = 'Agua 600ml';
  SELECT id INTO v_papas_id FROM catalog.products WHERE name = 'Papas fritas 45g';
  SELECT id INTO v_galletas_id FROM catalog.products WHERE name = 'Galletas surtidas';

  -- Venta 1 (hace 3 días)
  INSERT INTO sales.sales (customer_id, seller_id, sale_date, subtotal, total, status)
  VALUES (v_customer_id, v_seller_id, now() - interval '3 days', 7000, 7000, 'COMPLETED')
  RETURNING id INTO v_sale_id;
  INSERT INTO sales.sale_details (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_gaseosa_id, 2, 2500, 5000),
    (v_sale_id, v_agua_id, 1, 1800, 1800);

  -- Venta 2 (hace 2 días, sin cliente asociado)
  INSERT INTO sales.sales (customer_id, seller_id, sale_date, subtotal, total, status)
  VALUES (NULL, v_seller_id, now() - interval '2 days', 4000, 4000, 'COMPLETED')
  RETURNING id INTO v_sale_id;
  INSERT INTO sales.sale_details (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_papas_id, 2, 2000, 4000);

  -- Venta 3 (ayer)
  INSERT INTO sales.sales (customer_id, seller_id, sale_date, subtotal, total, status)
  VALUES (v_customer_id, v_seller_id, now() - interval '1 day', 6500, 6500, 'COMPLETED')
  RETURNING id INTO v_sale_id;
  INSERT INTO sales.sale_details (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_galletas_id, 3, 1500, 4500),
    (v_sale_id, v_agua_id, 1, 1800, 1800);

  -- Venta 4 (hoy)
  INSERT INTO sales.sales (customer_id, seller_id, sale_date, subtotal, total, status)
  VALUES (v_customer_id, v_seller_id, now(), 5000, 5000, 'COMPLETED')
  RETURNING id INTO v_sale_id;
  INSERT INTO sales.sale_details (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_gaseosa_id, 2, 2500, 5000);
END $$;

-- Nota: estas ventas de ejemplo se insertan directamente en la base para
-- efectos de demostración; NO pasaron por sales-service, por lo que no
-- generaron movimientos de inventario. El stock de inventory.inventory ya
-- se dejó fijado arriba en un valor consistente con el escenario de demo.
