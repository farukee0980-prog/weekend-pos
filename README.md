# POS Freedom

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
3. สร้าง Supabase project และ setup database (ดู `SUPABASE_SETUP.md`)
4. สร้าง Storage bucket `images` (Public)
5. ตั้งค่า `.env.local`
6. `npm run dev`

## Routes

| Route | Description |
|-------|-------------|
| `/login` | หน้า Login |
| `/pos` | หน้าขายของ |
| `/products` | จัดการสินค้า |
| `/orders` | ประวัติออเดอร์ |
| `/reports` | รายงาน + เปิด/ปิดร้าน |
| `/settings` | ตั้งค่าร้าน |

## Database Tables

- `products` - สินค้า
- `categories` - หมวดหมู่
- `orders` - ออเดอร์
- `order_items` - รายการในออเดอร์
- `store_settings` - การตั้งค่าร้าน
- `store_sessions` - รอบการขาย

## License

MIT
