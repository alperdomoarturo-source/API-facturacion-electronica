-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurant table (single restaurant configuration)
CREATE TABLE restaurant (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nit TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CASHIER')),
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  tax_regime TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  nit TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  products TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_rate_id UUID REFERENCES tax_rates(id) ON DELETE SET NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  unit TEXT NOT NULL CHECK (unit IN ('unidad', 'g', 'kg', 'ml', 'litros', 'caja', 'paquete')),
  current_stock DECIMAL(12, 2) DEFAULT 0,
  min_stock DECIMAL(12, 2) DEFAULT 0,
  unit_cost DECIMAL(12, 2) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  calculated_cost DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe items table
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);

-- Inventory table
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE UNIQUE,
  current_stock DECIMAL(12, 2) DEFAULT 0,
  min_stock DECIMAL(12, 2) DEFAULT 0,
  unit_cost DECIMAL(12, 2) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory movements table
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'loss', 'expiration', 'adjustment', 'entry', 'exit')),
  reason TEXT,
  cost DECIMAL(12, 2),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  total DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'received', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase items table
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL
);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  tax DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit_card', 'credit_card', 'transfer', 'nequi', 'other')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled', 'refunded')) DEFAULT 'completed',
  cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  cufe TEXT,
  xml TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sending', 'accepted', 'rejected', 'error')) DEFAULT 'pending',
  dian_response TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) DEFAULT 0
);

-- Credit notes table
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  note_number TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'error')) DEFAULT 'pending',
  cufe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debit notes table
CREATE TABLE debit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  note_number TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'accepted', 'rejected', 'error')) DEFAULT 'pending',
  cufe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'debit_card', 'credit_card', 'transfer', 'nequi', 'other')),
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash registers table
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opening_amount DECIMAL(12, 2) NOT NULL,
  opening_date TIMESTAMP WITH TIME ZONE NOT NULL,
  closing_date TIMESTAMP WITH TIME ZONE,
  closing_amount DECIMAL(12, 2),
  expected_amount DECIMAL(12, 2),
  difference DECIMAL(12, 2),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash movements table
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_register_id UUID REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
  amount DECIMAL(12, 2) NOT NULL,
  reason TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('rent', 'services', 'payroll', 'advertising', 'transport', 'maintenance', 'equipment', 'other')),
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card')),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  support_document TEXT,
  date DATE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts receivable table
CREATE TABLE accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  balance DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'paid', 'overdue')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts payable table
CREATE TABLE accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  balance DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'paid', 'overdue')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tax rates table
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('iva', 'ica', 'other')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electronic invoicing config table
CREATE TABLE electronic_invoicing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment TEXT NOT NULL CHECK (environment IN ('test', 'production')) DEFAULT 'test',
  provider TEXT NOT NULL,
  resolution_number TEXT NOT NULL,
  prefix TEXT NOT NULL,
  range_from INTEGER NOT NULL,
  range_to INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  api_key TEXT,
  certificate TEXT,
  status TEXT NOT NULL CHECK (status IN ('configured', 'incomplete', 'error')) DEFAULT 'incomplete',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DIAN documents table
CREATE TABLE dian_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('invoice', 'credit_note', 'debit_note')),
  document_id UUID NOT NULL,
  cufe TEXT,
  xml TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'error')) DEFAULT 'pending',
  response_code TEXT,
  response_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_inventory_ingredient_id ON inventory(ingredient_id);
CREATE INDEX idx_inventory_movements_ingredient_id ON inventory_movements(ingredient_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements(created_at);
CREATE INDEX idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX idx_cash_registers_status ON cash_registers(status);
CREATE INDEX idx_cash_movements_cash_register_id ON cash_movements(cash_register_id);
CREATE INDEX idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to update stock
CREATE OR REPLACE FUNCTION update_stock(
  ingredient_id UUID,
  quantity DECIMAL,
  movement_type TEXT,
  user_id UUID
)
RETURNS VOID AS $$
DECLARE
  inv RECORD;
BEGIN
  -- Check if inventory record exists
  SELECT * INTO inv FROM inventory WHERE ingredient_id = update_stock.ingredient_id;

  IF FOUND THEN
    -- Update existing inventory
    UPDATE inventory
    SET current_stock = current_stock + quantity,
        last_updated = NOW()
    WHERE ingredient_id = update_stock.ingredient_id;
  ELSE
    -- Get ingredient info to create inventory record
    INSERT INTO inventory (ingredient_id, current_stock, min_stock, unit_cost, last_updated)
    SELECT
      update_stock.ingredient_id,
      quantity,
      0,
      (SELECT unit_cost FROM ingredients WHERE id = update_stock.ingredient_id),
      NOW();
  END IF;

  -- Record movement
  INSERT INTO inventory_movements (ingredient_id, quantity, type, user_id)
  VALUES (ingredient_id, quantity, movement_type, user_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_restaurant_updated_at BEFORE UPDATE ON restaurant
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_notes_updated_at BEFORE UPDATE ON credit_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debit_notes_updated_at BEFORE UPDATE ON debit_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON cash_registers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at BEFORE UPDATE ON accounts_payable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at BEFORE UPDATE ON tax_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electronic_invoicing_config_updated_at BEFORE UPDATE ON electronic_invoicing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dian_documents_updated_at BEFORE UPDATE ON dian_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE restaurant ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_invoicing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE dian_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Restaurant policies (admin only)
CREATE POLICY "Admins can view restaurant" ON restaurant
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update restaurant" ON restaurant
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Customers policies
CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'CASHIER'
    )
  );

-- Suppliers policies (admin only)
CREATE POLICY "Admins can manage suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Categories policies (admin only)
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view categories" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'CASHIER'
    )
  );

-- Products policies
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'CASHIER'
    )
  );

-- Ingredients policies (admin only)
CREATE POLICY "Admins can manage ingredients" ON ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Recipes policies (admin only)
CREATE POLICY "Admins can manage recipes" ON recipes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Cashiers can view recipes (needed so POS sales can deduct stock)
CREATE POLICY "Cashiers can view recipes" ON recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADMIN', 'CASHIER')
    )
  );

-- Recipe items policies (admin only)
CREATE POLICY "Admins can manage recipe items" ON recipe_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Cashiers can view recipe items (needed so POS sales can deduct stock)
CREATE POLICY "Cashiers can view recipe items" ON recipe_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('ADMIN', 'CASHIER')
    )
  );

-- Inventory policies (admin only)
CREATE POLICY "Admins can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Inventory movements policies
CREATE POLICY "Admins can view all inventory movements" ON inventory_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "System can insert inventory movements" ON inventory_movements
  FOR INSERT WITH CHECK (true);

-- Purchases policies (admin only)
CREATE POLICY "Admins can manage purchases" ON purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Sales policies
CREATE POLICY "Admins can view all sales" ON sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view own sales" ON sales
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert sales" ON sales
  FOR INSERT WITH CHECK (true);

-- Sale items policies
CREATE POLICY "Admins can view all sale items" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "System can insert sale items" ON sale_items
  FOR INSERT WITH CHECK (true);

-- Invoices policies
CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view own invoices" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = invoices.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Cashiers can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = invoices.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert invoices" ON invoices
  FOR INSERT WITH CHECK (true);

-- Invoice items policies
CREATE POLICY "Admins can view all invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view own invoice items" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND EXISTS (
        SELECT 1 FROM sales
        WHERE sales.id = invoices.sale_id
        AND sales.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert invoice items" ON invoice_items
  FOR INSERT WITH CHECK (true);

-- Credit notes policies (admin only)
CREATE POLICY "Admins can manage credit notes" ON credit_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Debit notes policies (admin only)
CREATE POLICY "Admins can manage debit notes" ON debit_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Payments policies
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "System can insert payments" ON payments
  FOR INSERT WITH CHECK (true);

-- Cash registers policies
CREATE POLICY "Admins can view all cash registers" ON cash_registers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view own cash registers" ON cash_registers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Cashiers can insert own cash registers" ON cash_registers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Cashiers can update own cash registers" ON cash_registers
  FOR UPDATE USING (user_id = auth.uid());

-- Cash movements policies
CREATE POLICY "Admins can view all cash movements" ON cash_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Cashiers can view own cash movements" ON cash_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cash_registers
      WHERE cash_registers.id = cash_movements.cash_register_id
      AND cash_registers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert cash movements" ON cash_movements
  FOR INSERT WITH CHECK (true);

-- Expenses policies (admin only)
CREATE POLICY "Admins can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Accounts receivable policies (admin only)
CREATE POLICY "Admins can manage accounts receivable" ON accounts_receivable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Accounts payable policies (admin only)
CREATE POLICY "Admins can manage accounts payable" ON accounts_payable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Tax rates policies (admin only)
CREATE POLICY "Admins can manage tax rates" ON tax_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Electronic invoicing config policies (admin only)
CREATE POLICY "Admins can manage electronic invoicing config" ON electronic_invoicing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- DIAN documents policies (admin only)
CREATE POLICY "Admins can manage DIAN documents" ON dian_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Audit logs policies (read-only for all, insert by system)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Insert default tax rates
INSERT INTO tax_rates (name, rate, type) VALUES
  ('IVA 19%', 19.00, 'iva'),
  ('IVA 5%', 5.00, 'iva'),
  ('IVA 0%', 0.00, 'iva'),
  ('ICA 0.3%', 0.30, 'ica'),
  ('ICA 0.4%', 0.40, 'ica');
