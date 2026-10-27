-- ============================================================================
-- Migración: aislamiento por cuenta (multi-tenant) + registro crea 1 ADMIN
-- ============================================================================
-- Para ejecutar en un proyecto de Supabase que ya tiene la app funcionando
-- (indistinto si se creó con schema.sql o con schema-simple.sql).
--
-- Cómo:  Supabase Dashboard -> SQL Editor -> pegar este archivo -> Run.
--
-- Qué hace:
--   1. Añade restaurant_id (la cuenta/propietario de los datos) a todas las
--      tablas de negocio, con DEFAULT automático según el usuario logueado.
--   2. Reescribe RLS: cada cuenta solo lee/escribe SU información.
--   3. Al registrarse un usuario nuevo se crea SOLO un perfil con rol ADMIN
--      y su propio restaurante (trigger handle_new_user). Ya no se crea un
--      perfil de cajero.
--   4. Elimina los datos de prueba (productos, clientes, ventas, caja...).
--      Las cuentas de usuario existentes se conservan y pasan al mismo
--      restaurante; bórralas desde Authentication si también quieres limpiarlas.
--
-- Es idempotente: puede volver a ejecutarse sin que falle.
-- Nota: el orden importa. profiles.restaurant_id tiene que existir antes de
-- crear current_restaurant_id(), porque PostgreSQL valida el cuerpo de una
-- función SQL al momento de crearla.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. profiles.restaurant_id (primero la columna, después las funciones)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'f'
      AND conname = 'profiles_restaurant_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_restaurant_id_fkey
      FOREIGN KEY (restaurant_id) REFERENCES public.restaurant(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Funciones de contexto del tenant
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER para poder leer profiles() sin recursión de RLS.
CREATE OR REPLACE FUNCTION public.current_restaurant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.restaurant_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_restaurant_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'ADMIN'
  );
$$;

ALTER FUNCTION public.current_restaurant_id() OWNER TO postgres;
ALTER FUNCTION public.is_restaurant_admin() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.current_restaurant_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_restaurant_admin() TO authenticated, anon, service_role;

-- ----------------------------------------------------------------------------
-- 3. restaurante: deja de ser una fila única global
-- ----------------------------------------------------------------------------
ALTER TABLE public.restaurant ALTER COLUMN nit DROP NOT NULL;
ALTER TABLE public.restaurant DROP CONSTRAINT IF EXISTS restaurant_nit_key;
DROP INDEX IF EXISTS public.restaurant_nit_key;

-- ----------------------------------------------------------------------------
-- 4. Las cuentas ya registradas pasan a un restaurante
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_restaurant UUID;
BEGIN
  SELECT id INTO v_restaurant FROM public.restaurant ORDER BY created_at LIMIT 1;

  IF v_restaurant IS NULL THEN
    INSERT INTO public.restaurant (name, nit)
    VALUES ('Mi Restaurante', NULL)
    RETURNING id INTO v_restaurant;
  END IF;

  UPDATE public.profiles
  SET restaurant_id = v_restaurant
  WHERE restaurant_id IS NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_restaurant_id_idx ON public.profiles (restaurant_id);

ALTER TABLE public.profiles ALTER COLUMN restaurant_id SET NOT NULL;

-- ----------------------------------------------------------------------------
-- 5. Datos de prueba afuera
-- ----------------------------------------------------------------------------
TRUNCATE TABLE
  public.audit_logs,
  public.dian_documents,
  public.electronic_invoicing_config,
  public.accounts_payable,
  public.accounts_receivable,
  public.expenses,
  public.cash_movements,
  public.cash_registers,
  public.payments,
  public.debit_notes,
  public.credit_notes,
  public.invoice_items,
  public.invoices,
  public.sale_items,
  public.sales,
  public.purchase_items,
  public.purchases,
  public.inventory_movements,
  public.inventory,
  public.recipe_items,
  public.recipes,
  public.ingredients,
  public.products,
  public.categories,
  public.suppliers,
  public.customers
RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- 6. restaurant_id en todas las tablas de negocio
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'customers', 'suppliers', 'categories', 'products', 'ingredients',
    'recipes', 'recipe_items', 'inventory', 'inventory_movements',
    'purchases', 'purchase_items', 'sales', 'sale_items', 'invoices',
    'invoice_items', 'credit_notes', 'debit_notes', 'payments',
    'cash_registers', 'cash_movements', 'expenses', 'accounts_receivable',
    'accounts_payable', 'electronic_invoicing_config', 'dian_documents',
    'audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS restaurant_id UUID DEFAULT public.current_restaurant_id()',
      t
    );
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      t, t || '_restaurant_id_fkey'
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (restaurant_id) REFERENCES public.restaurant(id) ON DELETE CASCADE',
      t, t || '_restaurant_id_fkey'
    );
    -- Después del TRUNCATE no quedan filas huérfanas.
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN restaurant_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (restaurant_id)',
      t || '_restaurant_id_idx', t);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Unicidades por cuenta (antes eran globales y chocaban entre clientes)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN
    SELECT * FROM (VALUES
      ('customers',    'customers_document_number_key', 'document_number'),
      ('suppliers',    'suppliers_nit_key',             'nit'),
      ('ingredients',  'ingredients_code_key',         'code'),
      ('invoices',     'invoices_invoice_number_key',  'invoice_number'),
      ('credit_notes', 'credit_notes_note_number_key', 'note_number'),
      ('debit_notes',  'debit_notes_note_number_key',  'note_number')
    ) AS p(tbl, old_constraint, col)
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', pair.tbl, pair.old_constraint);
    EXECUTE format('DROP INDEX IF EXISTS public.%I', pair.old_constraint);
    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (restaurant_id, %I)',
      pair.tbl || '_restaurant_' || pair.col || '_uq', pair.tbl, pair.col
    );
  END LOOP;
END $$;

ALTER TABLE public.electronic_invoicing_config
  DROP CONSTRAINT IF EXISTS electronic_invoicing_config_prefix_key;
CREATE UNIQUE INDEX IF NOT EXISTS electronic_invoicing_config_restaurant_uq
  ON public.electronic_invoicing_config (restaurant_id);

-- ----------------------------------------------------------------------------
-- 8. RLS por cuenta
-- ----------------------------------------------------------------------------
ALTER TABLE public.restaurant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- 8.1 Borra TODAS las políticas actuales (sirve tanto para schema.sql como
--     para schema-simple.sql, que tienen nombres distintos).
DO $$
DECLARE
  rel RECORD;
  pol RECORD;
BEGIN
  FOR rel IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity
  LOOP
    FOR pol IN
      SELECT polname FROM pg_policy
      WHERE polrelid = format('public.%I', rel.tablename)::regclass
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.polname, rel.tablename);
    END LOOP;
  END LOOP;
END $$;

-- 8.2 Tablas que cualquier miembro de la cuenta puede leer y escribir
--     (ruta de venta: POS, caja, clientes, inventario, auditoría).
--     electronic_invoicing_config entra porque el POS avanza el contador de
--     numeración (range_from) al facturar; si un cajero no pudiera
--     actualizarlo la numeración chocaría con el índice único.
DO $$
DECLARE
  t TEXT;
  writable TEXT[] := ARRAY[
    'customers', 'sales', 'sale_items', 'invoices', 'invoice_items',
    'credit_notes', 'debit_notes', 'payments', 'cash_registers',
    'cash_movements', 'accounts_receivable', 'inventory',
    'inventory_movements', 'audit_logs', 'dian_documents',
    'electronic_invoicing_config'
  ];
BEGIN
  FOREACH t IN ARRAY writable LOOP
    EXECUTE format(
      'CREATE POLICY tenant_all ON public.%I FOR ALL TO authenticated USING (restaurant_id = public.current_restaurant_id()) WITH CHECK (restaurant_id = public.current_restaurant_id())',
      t
    );
  END LOOP;
END $$;

-- 8.3 Tablas de administración: todos leen, solo ADMIN escribe.
DO $$
DECLARE
  t TEXT;
  admin_only TEXT[] := ARRAY[
    'suppliers', 'categories', 'products', 'ingredients', 'recipes',
    'recipe_items', 'purchases', 'purchase_items', 'expenses',
    'accounts_payable', 'profiles'
  ];
BEGIN
  FOREACH t IN ARRAY admin_only LOOP
    EXECUTE format(
      'CREATE POLICY tenant_read ON public.%I FOR SELECT TO authenticated USING (restaurant_id = public.current_restaurant_id())',
      t
    );
    EXECUTE format(
      'CREATE POLICY tenant_admin_write ON public.%I FOR ALL TO authenticated USING (restaurant_id = public.current_restaurant_id() AND public.is_restaurant_admin()) WITH CHECK (restaurant_id = public.current_restaurant_id() AND public.is_restaurant_admin())',
      t
    );
  END LOOP;
END $$;

-- 8.4 Datos maestros de la cuenta y catálogo de impuestos.
CREATE POLICY tenant_read ON public.restaurant
  FOR SELECT TO authenticated USING (id = public.current_restaurant_id());
CREATE POLICY tenant_admin_write ON public.restaurant
  FOR ALL TO authenticated
  USING (id = public.current_restaurant_id() AND public.is_restaurant_admin())
  WITH CHECK (id = public.current_restaurant_id() AND public.is_restaurant_admin());

-- tax_rates es referencia global de solo lectura (IVA/ICA estándar Colombia).
CREATE POLICY tax_rates_read ON public.tax_rates
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 9. Registro: 1 sola cuenta ADMIN + su propio restaurante
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant UUID;
  v_name TEXT := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'restaurant_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    'Mi Restaurante'
  );
  v_full_name TEXT := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    split_part(NEW.email, '@', 1)
  );
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.restaurant (name, nit, email)
  VALUES (v_name, NULL, NULL)
  RETURNING id INTO v_restaurant;

  INSERT INTO public.profiles (id, user_id, role, restaurant_id, full_name)
  VALUES (NEW.id, NEW.id, 'ADMIN', v_restaurant, v_full_name);

  INSERT INTO public.electronic_invoicing_config (
    restaurant_id, environment, provider, resolution_number, prefix,
    range_from, range_to, start_date, end_date, status
  )
  VALUES (
    v_restaurant, 'test', 'Pendiente', '0', 'FAC',
    0, 9999, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'incomplete'
  );

  RETURN NEW;
END $$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- ----------------------------------------------------------------------------
-- 10. Verificación rápida (opcional)
-- ----------------------------------------------------------------------------
-- SELECT (SELECT count(*) FROM public.profiles)            AS perfiles,
--        (SELECT count(*) FROM public.restaurant)          AS restaurantes,
--        (SELECT count(*) FROM public.sales)               AS ventas,
--        (SELECT count(*) FROM public.products)            AS productos;
