# Supabase Setup Guide

คู่มือการตั้งค่า Supabase สำหรับ POS Freedom

## 1. สร้างโปรเจ็ค Supabase

1. ไปที่ https://supabase.com
2. Sign in / Create account
3. New Project
   - ตั้งชื่อโปรเจ็ค: `pos-freedom`
   - ตั้ง Database Password (เก็บไว้ปลอดภัย)
   - เลือก Region ใกล้เคียง (เช่น Singapore)
4. รอสัก 2-3 นาทีให้โปรเจ็คสร้างเสร็จ

## 2. คัดลอก API Keys

1. ไปที่ **Settings** > **API**
2. คัดลอกค่าเหล่านี้:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (ตัว public key)

## 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` (ถ้ายังไม่มี) และเพิ่ม:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. สร้างฐานข้อมูล

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. คัดลอกทั้งหมดจากไฟล์ `supabase-schema.sql`
3. Paste ใน SQL Editor
4. กด **Run** (หรือ Ctrl+Enter)

ระบบจะสร้าง:
- ✅ 5 ตาราง: categories, products, orders, order_items, store_settings
- ✅ Indexes สำหรับ performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers สำหรับ updated_at
- ✅ ข้อมูลตัวอย่าง (demo data)

## 5. ตรวจสอบข้อมูล

ไปที่ **Table Editor** และตรวจสอบว่ามีตารางและข้อมูลครบแล้ว:
- `categories` → 5 หมวดหมู่
- `products` → 24 สินค้า
- `orders` → (ว่าง)
- `order_items` → (ว่าง)
- `store_settings` → 4 settings

## 6. ทดสอบการเชื่อมต่อ

รันแอปและทดสอบ:

```bash
npm run dev
```

เปิด `/products` หรือ `/pos` และดูว่าดึงข้อมูลจาก Supabase ได้หรือไม่

## 7. การใช้งาน Database Functions

### Products

```typescript
import { getAllProducts, createProduct } from '@/lib/db';

// Get all products
const { data: products, error } = await getAllProducts();

// Create new product
const { data: newProduct, error } = await createProduct({
  name: 'กาแฟใหม่',
  price: 50,
  category_id: 'xxx',
  is_available: true,
});
```

### Orders

```typescript
import { createOrder, getAllOrders } from '@/lib/db';

// Create order
const { data: order, error } = await createOrder({
  order_number: '20251229-001',
  items: [...],
  subtotal: 150,
  discount: 0,
  total: 150,
  payment_method: 'cash',
  status: 'completed',
}, lineUserId); // optional: staff who created

// Get all orders
const { data: orders, error } = await getAllOrders(50); // limit 50
```

### Settings

```typescript
import { getStoreSetting, setStoreSetting } from '@/lib/db';

// Get setting
const { data: storeName } = await getStoreSetting('store_name');

// Set setting
await setStoreSetting('store_name', 'Freedome Coffee Shop');
```

## 8. Security Notes

### Row Level Security (RLS)

ตาราง `products` และ `categories`:
- ทุกคนอ่านได้ (public read)
- แก้ไขได้แค่ authenticated users

ตาราง `orders` และ `order_items`:
- Authenticated users สร้างและอ่านได้
- จะต้องเพิ่ม policy สำหรับแก้ไข/ลบในอนาคต

### การจัดการสิทธิ์

ถ้าต้องการให้เฉพาะพนักงานแก้ไขสินค้าได้:

```sql
-- ใน SQL Editor
CREATE POLICY "Allow staff to manage products"
ON products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM store_settings
    WHERE key = 'staff_line_ids'
    AND value LIKE '%' || auth.jwt()->>'sub' || '%'
  )
);
```

## 9. Backup & Export

### Export Schema
```bash
# ใน Supabase Dashboard > Database > Backups
# หรือใช้ pg_dump
```

### Export Data
ไปที่ **Table Editor** → เลือกตาราง → **Export to CSV**

## 10. Troubleshooting

### ❌ ไม่สามารถเชื่อมต่อ Supabase
- ตรวจสอบ `.env.local` ว่ามี SUPABASE_URL และ ANON_KEY
- Restart dev server (`npm run dev`)

### ❌ RLS Policy Error
- ตรวจสอบว่า policies ถูกสร้างแล้ว
- ทดสอบด้วย `auth.role() = 'anon'` ก่อน

### ❌ ข้อมูลไม่แสดง
- ตรวจสอบใน Table Editor ว่ามีข้อมูล
- เปิด Browser DevTools > Network tab ดู API calls

## เอกสารเพิ่มเติม

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

✅ เสร็จสิ้น! ตอนนี้คุณพร้อมใช้ Supabase กับ POS Freedom แล้ว
