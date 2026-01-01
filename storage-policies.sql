-- วิธีแก้ไขปัญหาอัปโหลดรูปภาพ
-- เนื่องจากไม่สามารถสร้าง Policy ผ่าน SQL ได้ ให้ใช้ Dashboard แทน

-- Step 1: สร้าง images bucket ผ่าน SQL (ทำได้)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ตรวจสอบว่า policies ถูกสร้างแล้ว
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects';

-- ตรวจสอบ bucket ที่สร้าง
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'images';