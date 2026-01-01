-- แก้ไข RLS Policies สำหรับ Members table
-- รันใน SQL Editor ของ Supabase

-- สร้างตาราง members ถ้ายังไม่มี (จาก database-schema.sql หลัก)
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เปิดใช้งาน RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- สร้าง policies อนุญาตให้ทุกคนเข้าถึงได้ (เหมาะสำหรับ POS)
CREATE POLICY "Allow all operations on members" ON members
FOR ALL 
USING (true)
WITH CHECK (true);

-- ตรวจสอบว่า policies ถูกสร้างแล้ว
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'members';