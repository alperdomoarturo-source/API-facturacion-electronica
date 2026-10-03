-- Seed data for API Software
-- This script inserts test data for development purposes

-- Insert restaurant
INSERT INTO restaurant (name, nit, address, phone, email, city) VALUES
('Restaurante API', '900123456-1', 'Calle 123 #45-67', '3001234567', 'contact@restauranteapi.com', 'Bogotá');

-- Insert tax rates (already inserted in schema, but we'll ensure they exist)
INSERT INTO tax_rates (name, rate, type) VALUES
('IVA 19%', 19.00, 'iva'),
('IVA 5%', 5.00, 'iva'),
('IVA 0%', 0.00, 'iva'),
('ICA 0.3%', 0.30, 'ica'),
('ICA 0.4%', 0.40, 'ica')
ON CONFLICT DO NOTHING;

-- Insert categories
INSERT INTO categories (name, description, sort_order, active) VALUES
('Hamburguesas', 'Deliciosas hamburguesas artesanales', 1, true),
('Acompañamientos', 'Papas, ensaladas y más', 2, true),
('Bebidas', 'Gaseosas, jugos y aguas', 3, true),
('Postres', 'Dulces para finalizar', 4, true);

-- Insert ingredients
INSERT INTO ingredients (name, code, category, unit, current_stock, min_stock, unit_cost) VALUES
('Carne de res', 'ING001', 'Carnes', 'g', 5000, 1000, 8000),
('Pan hamburguesa', 'ING002', 'Panadería', 'unidad', 100, 20, 1500),
('Queso cheddar', 'ING003', 'Lácteos', 'unidad', 80, 15, 800),
('Tomate', 'ING004', 'Vegetales', 'g', 2000, 500, 2000),
('Lechuga', 'ING005', 'Vegetales', 'g', 1500, 300, 1500),
('Cebolla', 'ING006', 'Vegetales', 'g', 1000, 200, 1000),
('Papas', 'ING007', 'Vegetales', 'g', 8000, 2000, 1500),
('Aceite vegetal', 'ING008', 'Grasas', 'ml', 5000, 1000, 3000),
('Coca-Cola 350ml', 'ING009', 'Bebidas', 'unidad', 50, 10, 2500),
('Agua 500ml', 'ING010', 'Bebidas', 'unidad', 100, 20, 1000),
('Salsa tomate', 'ING011', 'Salsas', 'ml', 2000, 500, 1500),
('Mayonesa', 'ING012', 'Salsas', 'ml', 1500, 300, 2000);

-- Insert products
INSERT INTO products (category_id, name, description, price, cost, active) VALUES
((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'Hamburguesa API', 'Hamburguesa especial con carne, queso y vegetales frescos', 25000, 11000, true),
((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'Hamburguesa Doble', 'Hamburguesa con doble carne y queso extra', 32000, 16000, true),
((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'Hamburguesa Pollo', 'Hamburguesa de pollo crujiente', 24000, 10000, true),
((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'Combo API', 'Hamburguesa + papas + gaseosa', 35000, 15000, true),
((SELECT id FROM categories WHERE name = 'Acompañamientos'), 'Papas Fritas', 'Papas fritas crujientes', 8000, 3000, true),
((SELECT id FROM categories WHERE name = 'Acompañamientos'), 'Aros de Cebolla', 'Aros de cebolla dorados', 9000, 3500, true),
((SELECT id FROM categories WHERE name = 'Acompañamientos'), 'Ensalada César', 'Ensalada fresca con aderezo césar', 12000, 5000, true),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Coca-Cola 350ml', 'Gaseosa cola 350ml', 5000, 2500, true),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Agua 500ml', 'Agua purificada 500ml', 3000, 1000, true),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Jugo de Naranja', 'Jugo natural de naranja', 6000, 2500, true),
((SELECT id FROM categories WHERE name = 'Postres'), 'Helado Vainilla', 'Helado de vainilla artesanal', 7000, 3000, true),
((SELECT id FROM categories WHERE name = 'Postres'), 'Brownie', 'Brownie de chocolate con nueces', 9000, 4000, true);

-- Insert inventory
INSERT INTO inventory (ingredient_id, current_stock, min_stock, unit_cost) 
SELECT id, current_stock, min_stock, unit_cost FROM ingredients;

-- Insert recipes
INSERT INTO recipes (product_id, calculated_cost) VALUES
((SELECT id FROM products WHERE name = 'Hamburguesa API'), 5600),
((SELECT id FROM products WHERE name = 'Hamburguesa Doble'), 9200),
((SELECT id FROM products WHERE name = 'Combo API'), 9600);

-- Insert recipe items for Hamburguesa API
INSERT INTO recipe_items (recipe_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Hamburguesa API')),
  id,
  CASE name
    WHEN 'Pan hamburguesa' THEN 1
    WHEN 'Carne de res' THEN 150
    WHEN 'Queso cheddar' THEN 2
    WHEN 'Tomate' THEN 30
    WHEN 'Lechuga' THEN 20
    WHEN 'Salsa tomate' THEN 15
    ELSE 0
  END
FROM ingredients
WHERE name IN ('Pan hamburguesa', 'Carne de res', 'Queso cheddar', 'Tomate', 'Lechuga', 'Salsa tomate');

-- Insert recipe items for Hamburguesa Doble
INSERT INTO recipe_items (recipe_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Hamburguesa Doble')),
  id,
  CASE name
    WHEN 'Pan hamburguesa' THEN 1
    WHEN 'Carne de res' THEN 300
    WHEN 'Queso cheddar' THEN 3
    WHEN 'Tomate' THEN 40
    WHEN 'Lechuga' THEN 30
    WHEN 'Salsa tomate' THEN 20
    ELSE 0
  END
FROM ingredients
WHERE name IN ('Pan hamburguesa', 'Carne de res', 'Queso cheddar', 'Tomate', 'Lechuga', 'Salsa tomate');

-- Insert recipe items for Combo API
INSERT INTO recipe_items (recipe_id, ingredient_id, quantity)
SELECT 
  (SELECT id FROM recipes WHERE product_id = (SELECT id FROM products WHERE name = 'Combo API')),
  id,
  CASE name
    WHEN 'Pan hamburguesa' THEN 1
    WHEN 'Carne de res' THEN 150
    WHEN 'Queso cheddar' THEN 2
    WHEN 'Papas' THEN 150
    WHEN 'Coca-Cola 350ml' THEN 1
    ELSE 0
  END
FROM ingredients
WHERE name IN ('Pan hamburguesa', 'Carne de res', 'Queso cheddar', 'Papas', 'Coca-Cola 350ml');

-- Insert suppliers
INSERT INTO suppliers (name, nit, phone, email, address, contact_person, products) VALUES
('Carnes Premium', '900111111-1', '3111111111', 'contact@carnespremium.com', 'Calle 50 #10-20', 'Carlos Pérez', 'Carne de res, pollo'),
('Panadería Central', '900222222-2', '3222222222', 'ventas@panaderiacentral.com', 'Carrera 20 #30-40', 'María García', 'Pan, productos de panadería'),
('Lácteos del Valle', '900333333-3', '3333333333', 'info@lacteosdelvalle.com', 'Avenida 1 #50-60', 'Pedro López', 'Queso, leche, yogur'),
('Bebidas Andinas', '900444444-4', '3444444444', 'sales@bebidasandinas.com', 'Calle 80 #70-80', 'Ana Martínez', 'Gaseosas, jugos, aguas'),
('Verduras Frescas', '900555555-5', '3555555555', 'orders@verdurasfrescas.com', 'Carrera 100 #90-100', 'Roberto Sánchez', 'Vegetales, frutas');

-- Update ingredients with suppliers
UPDATE ingredients SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Carnes Premium') WHERE name = 'Carne de res';
UPDATE ingredients SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Panadería Central') WHERE name = 'Pan hamburguesa';
UPDATE ingredients SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Lácteos del Valle') WHERE name = 'Queso cheddar';
UPDATE ingredients SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Verduras Frescas') WHERE name IN ('Tomate', 'Lechuga', 'Cebolla', 'Papas');
UPDATE ingredients SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Bebidas Andinas') WHERE name IN ('Coca-Cola 350ml', 'Agua 500ml');

-- Insert customers
INSERT INTO customers (document_type, document_number, name, email, phone, address, city, tax_regime) VALUES
('CC', '12345678', 'Juan Pérez', 'juan.perez@email.com', '3101234567', 'Calle 10 #20-30', 'Bogotá', '49'),
('CC', '87654321', 'María López', 'maria.lopez@email.com', '3202345678', 'Carrera 15 #25-35', 'Medellín', '49'),
('NIT', '900999999-9', 'Empresa XYZ SAS', 'contacto@empresaxyz.com', '3053456789', 'Avenida 5 #10-15', 'Cali', '48'),
('CC', '45678901', 'Carlos Rodríguez', 'carlos.r@email.com', '3154567890', 'Calle 30 #40-50', 'Barranquilla', '49'),
('CC', '23456789', 'Ana González', 'ana.g@email.com', '3255678901', 'Carrera 20 #30-40', 'Pereira', '49');

-- Insert purchases
INSERT INTO purchases (supplier_id, total, tax, status, notes) VALUES
((SELECT id FROM suppliers WHERE name = 'Carnes Premium'), 400000, 76000, 'received', 'Compra semanal de carne'),
((SELECT id FROM suppliers WHERE name = 'Panadería Central'), 150000, 28500, 'received', 'Compra de pan'),
((SELECT id FROM suppliers WHERE name = 'Bebidas Andinas'), 125000, 23750, 'received', 'Reposición de gaseosas');

-- Insert purchase items
INSERT INTO purchase_items (purchase_id, ingredient_id, quantity, unit_price, total)
SELECT 
  (SELECT id FROM purchases WHERE notes = 'Compra semanal de carne'),
  id,
  50,
  8000,
  400000
FROM ingredients
WHERE name = 'Carne de res';

INSERT INTO purchase_items (purchase_id, ingredient_id, quantity, unit_price, total)
SELECT 
  (SELECT id FROM purchases WHERE notes = 'Compra de pan'),
  id,
  100,
  1500,
  150000
FROM ingredients
WHERE name = 'Pan hamburguesa';

INSERT INTO purchase_items (purchase_id, ingredient_id, quantity, unit_price, total)
SELECT 
  (SELECT id FROM purchases WHERE notes = 'Reposición de gaseosas'),
  id,
  50,
  2500,
  125000
FROM ingredients
WHERE name = 'Coca-Cola 350ml';

-- Update inventory after purchases
UPDATE inventory SET current_stock = current_stock + 50 WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Carne de res');
UPDATE inventory SET current_stock = current_stock + 100 WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Pan hamburguesa');
UPDATE inventory SET current_stock = current_stock + 50 WHERE ingredient_id = (SELECT id FROM ingredients WHERE name = 'Coca-Cola 350ml');

-- Insert expenses
INSERT INTO expenses (category, description, amount, payment_method, date, user_id) VALUES
('rent', 'Arriendo local octubre', 2000000, 'transfer', '2026-10-01', '00000000-0000-0000-0000-000000000000'),
('services', 'Servicios públicos octubre', 150000, 'transfer', '2026-10-05', '00000000-0000-0000-0000-000000000000'),
('advertising', 'Publicidad redes sociales', 50000, 'card', '2026-10-10', '00000000-0000-0000-0000-000000000000'),
('equipment', 'Mantenimiento equipos', 80000, 'cash', '2026-10-15', '00000000-0000-0000-0000-000000000000');

-- Insert electronic invoicing config (test mode)
INSERT INTO electronic_invoicing_config (environment, provider, resolution_number, prefix, range_from, range_to, start_date, end_date, status) VALUES
('test', 'Pruebas DIAN', '18760000001', 'FE', 1, 1000, '2026-01-01', '2026-12-31', 'incomplete');

-- Note: Profiles will be created automatically when users sign up through Supabase Auth
-- The admin user will need to be created through the signup process first

-- Note: Accounts receivable and payable are commented out because they require real sales/purchases
-- These will be created automatically when actual sales and purchases are made in the application
