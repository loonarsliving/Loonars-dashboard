-- ============================================================
-- LOONARS DASHBOARD — Database Migration
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles (extends auth.users Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  phone       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                  TEXT NOT NULL,
  sku                   TEXT UNIQUE NOT NULL,
  description           TEXT,
  category              TEXT DEFAULT 'skincare',
  price                 DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_price            DECIMAL(12,2) DEFAULT 0,
  stock_qty             INTEGER DEFAULT 0,
  initial_stock         INTEGER DEFAULT 0,
  stock_alert_pct       INTEGER DEFAULT 30,  -- alert when stock < X% of initial
  unit                  TEXT DEFAULT 'pcs',
  weight_gram           INTEGER DEFAULT 0,
  images                TEXT[] DEFAULT '{}',
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  city          TEXT,
  province      TEXT,
  notes         TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   DECIMAL(12,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  segment       TEXT DEFAULT 'new' CHECK (segment IN ('new', 'loyal', 'at_risk', 'inactive')),
  source        TEXT,  -- first channel (tokopedia/shopee/website/offline)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number        TEXT UNIQUE NOT NULL,
  channel             TEXT NOT NULL CHECK (channel IN ('tokopedia', 'shopee', 'website', 'offline')),
  external_order_id   TEXT,           -- ID dari Tokopedia/Shopee
  customer_id         UUID REFERENCES customers(id),
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  customer_address    TEXT,
  customer_city       TEXT,
  status              TEXT DEFAULT 'new' CHECK (status IN (
    'new', 'processing', 'packing', 'shipped', 'delivered', 'cancelled', 'returned'
  )),
  total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost       DECIMAL(12,2) DEFAULT 0,
  discount_amount     DECIMAL(12,2) DEFAULT 0,
  courier             TEXT,
  tracking_number     TEXT,
  notes               TEXT,
  processed_by        UUID REFERENCES profiles(id),
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id      UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id    UUID REFERENCES products(id),
  product_name  TEXT NOT NULL,
  product_sku   TEXT,
  quantity      INTEGER NOT NULL DEFAULT 1,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLE: stock_movements (audit trail semua pergerakan stok)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id      UUID REFERENCES products(id) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'return')),
  quantity        INTEGER NOT NULL,
  stock_before    INTEGER,
  stock_after     INTEGER,
  reference_type  TEXT CHECK (reference_type IN ('order', 'manual', 'return', 'initial')),
  reference_id    UUID,
  notes           TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('new_order', 'low_stock', 'report', 'system')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: settings (konfigurasi aplikasi)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value       TEXT DEFAULT '',
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
  ('store_name',          'Loonars Skincare',   'Nama toko'),
  ('store_phone',         '',                   'Nomor HP toko'),
  ('store_address',       '',                   'Alamat toko'),
  ('store_instagram',     '',                   'Instagram toko'),
  ('telegram_bot_token',  '',                   'Token Telegram Bot untuk notifikasi'),
  ('telegram_chat_id',    '',                   'Chat ID Telegram untuk notifikasi'),
  ('low_stock_threshold', '30',                 'Persentase stok minimum (%) sebelum alert'),
  ('tokopedia_api_key',   '',                   'Tokopedia API Key'),
  ('shopee_partner_id',   '',                   'Shopee Partner ID'),
  ('shopee_partner_key',  '',                   'Shopee Partner Key')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- INDEXES (untuk performa query)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel      ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id  ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_product       ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_notif_read          ON notifications(is_read);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings        ENABLE ROW LEVEL SECURITY;

-- Policy: semua user authenticated bisa akses
-- (Pembatasan owner vs admin dihandle di frontend)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products','customers','orders','order_items','stock_movements','notifications','settings']
  LOOP
    EXECUTE format('
      CREATE POLICY "auth_all_%s" ON %I
        FOR ALL USING (auth.role() = ''authenticated'')
        WITH CHECK (auth.role() = ''authenticated'');
    ', tbl, tbl);
  END LOOP;
END $$;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_products_upd   BEFORE UPDATE ON products   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_upd  BEFORE UPDATE ON customers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_upd     BEFORE UPDATE ON orders     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_upd   BEFORE UPDATE ON profiles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto create profile saat user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate nomor order otomatis
CREATE OR REPLACE FUNCTION generate_order_number(ch TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  pfx TEXT;
  cnt INTEGER;
BEGIN
  CASE ch
    WHEN 'tokopedia' THEN pfx := 'TKP';
    WHEN 'shopee'    THEN pfx := 'SHP';
    WHEN 'website'   THEN pfx := 'WEB';
    ELSE                  pfx := 'OFF';
  END CASE;
  SELECT COUNT(*) + 1 INTO cnt FROM orders WHERE DATE(created_at) = CURRENT_DATE;
  RETURN pfx || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(cnt::TEXT, 4, '0');
END; $$;

-- ============================================================
-- VIEW: ringkasan order dengan info customer
-- ============================================================
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.*,
  c.segment       AS cust_segment,
  c.total_orders  AS cust_total_orders,
  COUNT(oi.id)    AS item_count,
  SUM(oi.quantity)AS total_qty
FROM orders o
LEFT JOIN customers c  ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.segment, c.total_orders;

-- ============================================================
-- DATA CONTOH (hapus jika tidak perlu)
-- ============================================================
-- Sample produk
INSERT INTO products (name, sku, price, cost_price, stock_qty, initial_stock, description, category) VALUES
  ('Loonars Serum Glow', 'LNR-SRM-001', 189000, 75000, 50, 100, 'Serum brightening dengan niacinamide', 'serum'),
  ('Loonars Face Wash', 'LNR-FW-001',  89000, 35000, 80, 150, 'Sabun cuci muka gentle untuk semua jenis kulit', 'cleanser'),
  ('Loonars Moisturizer', 'LNR-MTZ-001', 145000, 55000, 30, 100, 'Pelembab ringan untuk kulit normal-kering', 'moisturizer'),
  ('Loonars Sunscreen SPF50', 'LNR-SS-001', 120000, 48000, 15, 100, 'Sunscreen ringan SPF 50 PA+++', 'sunscreen'),
  ('Loonars Toner', 'LNR-TNR-001', 95000, 38000, 45, 80, 'Toner hydrating dengan centella asiatica', 'toner')
ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- SELESAI ✅
-- Selanjutnya:
-- 1. Buat user pertama (owner) di Supabase Auth > Users
-- 2. Update role-nya di tabel profiles menjadi 'owner'
-- 3. Deploy aplikasi dan login
-- ============================================================
