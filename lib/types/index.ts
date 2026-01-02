// ===================================
// POS System Types
// ===================================

// Product Types
export interface Product {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url?: string;
  is_available: boolean;
  points_per_item: number; // แต้มที่ได้รับต่อชิ้น
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  created_at: string;
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Order Types
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  order_number: string;
  session_id?: string;
  member_id?: string; // สมาชิกที่ซื้อ
  member_phone?: string; // เบอร์สมาชิก (สำหรับแสดง)
  points_earned?: number; // แต้มที่ได้รับจากออเดอร์นี้
  points_redeemed?: number; // แต้มที่ใช้ในออเดอร์นี้
  points_discount?: number; // ส่วนลดจากการใช้แต้ม
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  payment_received?: number; // จำนวนเงินที่ได้รับ
  change_amount?: number; // เงินทอน
  status: OrderStatus;
  notes?: string; // โน้ตเพิ่มเติม
  created_at: string;
  updated_at: string;
  created_by?: string; // ผู้ทำรายการ
}

// Report Types
export interface DailySummary {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_items_sold: number;
  payment_breakdown: {
    cash: number;
    transfer: number;
  };
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ===================================
// Member / Loyalty Types
// ===================================

export interface Member {
  id: string;
  name: string;
  phone: string;
  total_points: number; // แต้มสะสมปัจจุบัน
  total_spent: number; // ยอดใช้จ่ายสะสม
  visit_count: number; // จำนวนครั้งที่ซื้อ
  created_at: string;
  updated_at: string;
}

export type PointTransactionType = 'earn' | 'redeem' | 'adjust' | 'expire';

export interface MemberPointHistory {
  id: string;
  member_id: string;
  order_id?: string;
  type: PointTransactionType;
  points: number; // บวก = ได้รับ, ลบ = ใช้
  description: string;
  created_at: string;
}

export interface PointsConfig {
  points_to_redeem: number; // จำนวนแต้มที่ต้องครบถึงแลกได้ (เช่น 100)
  redeem_value: number; // มูลค่าส่วนลดเมื่อแลก (เช่น 40 บาท)
  default_points_per_item: number; // แต้มเริ่มต้นต่อสินค้า
}

// ===================================
// Hold Order Types (พักออเดอร์)
// ===================================

export interface HeldOrder {
  id: string;
  items: CartItem[];
  total: number;
  member?: Member | null;
  note?: string;
  createdAt: string;
}
