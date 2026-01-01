# Weekend POS

ระบบ POS สำหรับร้านค้าขนาดเล็ก พัฒนาด้วย Next.js + Supabase

## Features

- ✅ ระบบขายหน้าร้าน (POS)
- ✅ จัดการสินค้าและหมวดหมู่
- ✅ อัปโหลดรูปสินค้า
- ✅ ประวัติออเดอร์
- ✅ ระบบเปิด-ปิดร้าน (Session)
- ✅ รายงานยอดขาย
- ✅ พิมพ์ใบเสร็จ
- ✅ ตั้งค่าข้อมูลร้าน
- ✅ ระบบสมาชิกสะสมแต้ม
- ✅ แลกแต้มเป็นส่วนลด

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Font**: Prompt (Google Fonts)

## Environment Variables

สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=1234
```

## Setup

1. Clone repo
2. `npm install`
3. สร้าง Supabase project
4. รัน SQL จากไฟล์ `database-schema.sql` ใน SQL Editor
5. สร้าง Storage bucket `images` (Public) - ดู Storage Setup ด้านล่าง
6. ตั้งค่า `.env.local`
7. `npm run dev`

## Storage Setup (สำหรับอัปโหลดรูปภาพ)

1. ไปที่ **Storage** ใน Supabase Dashboard
2. กด **New bucket**
3. ตั้งชื่อ: `images`
4. ✅ เลือก **Public bucket**
5. กด **Create bucket**
6. ไปที่ **Policies** และเพิ่ม policy ดังนี้:

```sql
-- Policy: ทุกคนอ่านได้
CREATE POLICY "Public Read" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Policy: ทุกคนอัปโหลดได้
CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Policy: ทุกคนลบได้
CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'images');
```

## Routes

| Route | Description |
|-------|-------------|
| `/login` | หน้า Login |
| `/pos` | หน้าขายของ |
| `/products` | จัดการสินค้า |
| `/orders` | ประวัติออเดอร์ |
| `/members` | จัดการสมาชิก |
| `/reports` | รายงาน + เปิด/ปิดร้าน |
| `/settings` | ตั้งค่าร้าน |

## Database Tables

| Table | Description |
|-------|-------------|
| `categories` | หมวดหมู่สินค้า |
| `products` | สินค้า |
| `members` | สมาชิกสะสมแต้ม |
| `store_sessions` | รอบการขาย (เปิด-ปิดร้าน) |
| `orders` | ออเดอร์ |
| `order_items` | รายการในออเดอร์ |
| `member_points_history` | ประวัติแต้มสมาชิก |
| `store_settings` | การตั้งค่าร้าน |

## ระบบสมาชิกสะสมแต้ม

- สมาชิกสะสมแต้มด้วยชื่อและเบอร์โทร
- ตั้งค่าแต้มต่อสินค้าแต่ละชนิดได้
- ตั้งค่าจำนวนแต้มที่ต้องครบเพื่อแลกส่วนลด (เช่น 100 แต้ม = 40 บาท)
- แลกแต้มได้หลายครั้งในออเดอร์เดียว
- เก็บประวัติการได้รับ/ใช้แต้มทั้งหมด

## Project Structure

```
app/
  ├── login/          → หน้า Login
  └── (dashboard)/    → หน้าหลัก (Protected)
      ├── pos/        → หน้าขายของ
      ├── products/   → จัดการสินค้า
      ├── orders/     → ประวัติออเดอร์
      ├── members/    → จัดการสมาชิก
      ├── reports/    → รายงาน
      └── settings/   → ตั้งค่า

components/
  ├── layout/   → Header, Sidebar, BottomNav
  ├── members/  → MemberSearch, MemberFormModal, PointsRedeemSection
  ├── pos/      → Cart, ProductGrid, Receipt, PaymentSheet
  └── ui/       → Button, Card, Modal, Input, Badge

lib/
  ├── db/       → Database functions
  ├── types/    → TypeScript types
  ├── supabase.ts
  └── utils.ts
```

## License

MIT
