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
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
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
