# แก้ไขปัญหาอัปโหลดรูปภาพ

เมื่อพบ error: **"new row violates row-level security policy"** แสดงว่า Supabase Storage ยังไม่มี policies ที่จำเป็น

## วิธีแก้ไข (ใช้ Dashboard - แนะนำ)

### ขั้นตอนที่ 1: สร้าง Bucket
1. เข้า Supabase Dashboard → **Storage**
2. คลิก **"New bucket"**
3. ตั้งค่า:
   - Name: `images`
   - Public bucket: ✅ เปิด
   - File size limit: 10MB
4. คลิก **Save**

### ขั้นตอนที่ 2: ตั้งค่า Policies
1. คลิกที่ bucket `images` ที่เพิ่งสร้าง
2. ไปที่แท็บ **Policies**
3. คลิก **"New policy"** สำหรับแต่ละ operation:

**Policy 1: INSERT (อัปโหลด)**
- Template: "Give users access to own folder"
- หรือ Custom: `bucket_id = 'images'`

**Policy 2: SELECT (ดูรูป)**  
- Template: "Give public access to folder"
- หรือ Custom: `bucket_id = 'images'`

**Policy 3: UPDATE & DELETE (แก้ไข/ลบ)**
- Template: "Give users access to own folder" 
- หรือ Custom: `bucket_id = 'images'`

### ขั้นตอนที่ 3: ทดสอบ
- กลับมาที่แอป Weekend POS
- ลองอัปโหลดรูปภาพในหน้า Products
- ควรทำงานได้แล้ว

## วิธีทางเลือก (SQL)
หากต้องการใช้ SQL แทน ให้รันเฉพาะ:

```sql
-- สร้าง bucket เท่านั้น
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 10485760, 
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;
```

แล้วไปตั้งค่า Policies ใน Dashboard แทน