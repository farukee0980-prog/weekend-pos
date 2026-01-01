-- =============================================
-- Weekend POS - Complete Database Schema
-- =============================================
-- รันคำสั่งนี้ใน Supabase SQL Editor เพื่อสร้างฐานข้อมูลทั้งหมด
-- วันที่สร้าง: 2026-01-01

-- =============================================
-- 1. CATEGORIES TABLE (หมวดหมู่สินค้า)
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- =============================================
-- 2. PRODUCTS TABLE (สินค้า)
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  points_per_item INTEGER DEFAULT 1, -- แต้มสะสมต่อชิ้น
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- =============================================
-- 3. MEMBERS TABLE (สมาชิก)
-- =============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,      -- แต้มสะสมปัจจุบัน
  total_spent DECIMAL(12, 2) DEFAULT 0, -- ยอดใช้จ่ายสะสม
  visit_count INTEGER DEFAULT 0,        -- จำนวนครั้งที่ซื้อ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);

-- =============================================
-- 4. STORE_SESSIONS TABLE (รอบการขาย/เปิด-ปิดร้าน)
-- =============================================
CREATE TABLE IF NOT EXISTS store_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by VARCHAR(255),                   -- ผู้ปิดร้าน (optional)
  opening_cash DECIMAL(10, 2) DEFAULT 0,   -- เงินเปิดร้าน
  closing_cash DECIMAL(10, 2),              -- เงินปิดร้าน
  total_sales DECIMAL(10, 2) DEFAULT 0,     -- ยอดขายรวม (deprecated)
  total_revenue DECIMAL(10, 2) DEFAULT 0,   -- ยอดขายรวม
  total_orders INTEGER DEFAULT 0,           -- จำนวนออเดอร์
  total_items INTEGER DEFAULT 0,            -- จำนวนรายการทั้งหมด
  cash_revenue DECIMAL(10, 2) DEFAULT 0,    -- ยอดขายเงินสด
  transfer_revenue DECIMAL(10, 2) DEFAULT 0, -- ยอดขายโอน
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_store_sessions_opened_at ON store_sessions(opened_at DESC);

-- =============================================
-- 5. ORDERS TABLE (ออเดอร์)
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  session_id UUID REFERENCES store_sessions(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  member_phone VARCHAR(20),             -- เก็บเบอร์สมาชิกไว้ด้วย
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,      -- แต้มที่ได้รับจากออเดอร์นี้
  points_redeemed INTEGER DEFAULT 0,    -- แต้มที่ใช้ในออเดอร์นี้
  points_discount DECIMAL(10, 2) DEFAULT 0, -- ส่วนลดจากการใช้แต้ม
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  payment_received DECIMAL(10, 2) DEFAULT 0, -- เงินที่รับมา (optional)
  change_amount DECIMAL(10, 2) DEFAULT 0,    -- เงินทอน (optional)
  notes TEXT,                            -- หมายเหตุ (optional)
  created_by VARCHAR(255),               -- ผู้สร้างออเดอร์ (optional)
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- =============================================
-- 6. ORDER_ITEMS TABLE (รายการในออเดอร์)
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,   -- เก็บชื่อไว้กรณีสินค้าถูกลบ
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =============================================
-- 7. MEMBER_POINTS_HISTORY TABLE (ประวัติแต้มสมาชิก)
-- =============================================
CREATE TABLE IF NOT EXISTS member_points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'redeem', 'adjust', 'expire')),
  points INTEGER NOT NULL,              -- บวก = ได้รับ, ลบ = ใช้
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_points_history_member_id ON member_points_history(member_id);
CREATE INDEX IF NOT EXISTS idx_member_points_history_created_at ON member_points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_points_history_type ON member_points_history(type);

-- =============================================
-- 8. STORE_SETTINGS TABLE (การตั้งค่าร้าน)
-- =============================================
CREATE TABLE IF NOT EXISTS store_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. TRIGGERS สำหรับ updated_at
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for members
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for store_settings
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. DEFAULT SETTINGS (ค่าเริ่มต้น)
-- =============================================
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'Weekend POS'),
  ('store_address', ''),
  ('store_phone', ''),
  ('tax_id', ''),
  ('footer_message', 'ขอบคุณที่ใช้บริการ'),
  ('points_to_redeem', '100'),      -- แต้มที่ต้องครบเพื่อแลก
  ('redeem_value', '40'),           -- มูลค่าส่วนลดเมื่อแลก (บาท)
  ('default_points_per_item', '1')  -- แต้มเริ่มต้นต่อสินค้า
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- 11. SAMPLE DATA (ข้อมูลตัวอย่าง - Optional)
-- =============================================

-- Sample Categories
INSERT INTO categories (name, icon, sort_order) VALUES
  ('เครื่องดื่มร้อน', 'coffee', 1),
  ('เครื่องดื่มเย็น', 'glass-water', 2),
  ('ขนม', 'cake', 3),
  ('อื่นๆ', 'package', 4)
ON CONFLICT DO NOTHING;

-- Sample Products (ต้อง insert หลัง categories)
-- INSERT INTO products (name, price, category_id, is_available, points_per_item)
-- SELECT 'อเมริกาโน่ร้อน', 45, id, true, 1 FROM categories WHERE name = 'เครื่องดื่มร้อน';

-- =============================================
-- 12. ROW LEVEL SECURITY (Optional - ถ้าต้องการ)
-- =============================================
-- หมายเหตุ: ถ้าใช้ anon key สำหรับทุกการเข้าถึง ไม่จำเป็นต้องเปิด RLS
-- แต่ถ้าต้องการความปลอดภัยเพิ่มเติม สามารถเปิด RLS ได้

-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE member_points_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE store_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all access for anon (public)
-- CREATE POLICY "Allow all" ON categories FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON products FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON orders FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON order_items FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON members FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON member_points_history FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON store_sessions FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON store_settings FOR ALL USING (true);

-- =============================================
-- 13. STORAGE BUCKET สำหรับรูปภาพ
-- =============================================
-- รันคำสั่งนี้แยกต่างหาก หรือสร้างผ่าน Dashboard

-- สร้าง bucket
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('images', 'images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Policy: ทุกคนอ่านได้
-- CREATE POLICY "Public Read" ON storage.objects
-- FOR SELECT USING (bucket_id = 'images');

-- Policy: ทุกคนอัปโหลดได้
-- CREATE POLICY "Public Upload" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'images');

-- Policy: ทุกคนลบได้
-- CREATE POLICY "Public Delete" ON storage.objects
-- FOR DELETE USING (bucket_id = 'images');

-- =============================================
-- สรุปตาราง:
-- 1. categories        - หมวดหมู่สินค้า
-- 2. products          - สินค้า
-- 3. members           - สมาชิกสะสมแต้ม
-- 4. store_sessions    - รอบการขาย (เปิด-ปิดร้าน)
-- 5. orders            - ออเดอร์
-- 6. order_items       - รายการในออเดอร์
-- 7. member_points_history - ประวัติแต้มสมาชิก
-- 8. store_settings    - การตั้งค่าร้าน
-- =============================================
