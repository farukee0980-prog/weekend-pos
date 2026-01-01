import { supabase, TABLES } from '@/lib/supabase';
import type { Order, OrderItem, ApiResponse, DailySummary } from '@/lib/types';
import { getCurrentSession } from './sessions';

// ===================================
// Orders CRUD
// ===================================

export async function createOrder(
  order: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  createdBy?: string
): Promise<ApiResponse<Order>> {
  try {
    const { items, ...orderData } = order;

    // ตรวจสอบว่ามี items หรือไม่
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    // Get current session if session_id is not provided
    let sessionId = orderData.session_id;
    if (!sessionId) {
      const currentSession = await getCurrentSession();
      if (currentSession.data) {
        sessionId = currentSession.data.id;
      }
    }

    // เตรียม order data อย่างปลอดภัย (เฉพาะคอลัมน์ที่มีในตาราง)
    const cleanOrderData: any = {
      order_number: orderData.order_number,
      subtotal: Number(orderData.subtotal) || 0,
      discount: Number(orderData.discount) || 0,
      total: Number(orderData.total) || 0,
      payment_method: orderData.payment_method,
      member_id: orderData.member_id || null,
      member_phone: orderData.member_phone || null,
      points_earned: Number(orderData.points_earned) || 0,
      points_redeemed: Number(orderData.points_redeemed) || 0,
      points_discount: Number(orderData.points_discount) || 0,
      status: orderData.status || 'completed'
    };

    if (sessionId) {
      cleanOrderData.session_id = sessionId;
    }

    console.log('Creating order with data:', cleanOrderData);

    // Insert order
    const { data: orderRecord, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .insert([cleanOrderData])
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw orderError;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: orderRecord.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      note: item.note,
    }));

    const { error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Fetch complete order with items
    const completeOrder = await getOrderById(orderRecord.id);
    
    if (completeOrder.error) {
      throw new Error(completeOrder.error);
    }

    return { data: completeOrder.data, error: null };
  } catch (err: any) {
    console.error('Error creating order:', err);
    return { data: null, error: err.message };
  }
}

export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  try {
    const { data: orderData, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    const { data: itemsData, error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    const order: Order = {
      ...orderData,
      items: itemsData || [],
    };

    return { data: order, error: null };
  } catch (err: any) {
    console.error('Error fetching order:', err);
    return { data: null, error: err.message };
  }
}

export async function getAllOrders(limit = 100): Promise<ApiResponse<Order[]>> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ordersError) throw ordersError;

    // Fetch items for all orders
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from(TABLES.ORDER_ITEMS)
          .select('*')
          .eq('order_id', order.id);

        return {
          ...order,
          items: itemsData || [],
        };
      })
    );

    return { data: ordersWithItems, error: null };
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    return { data: null, error: err.message };
  }
}

export async function getOrdersByDateRange(
  startDate: string,
  endDate: string
): Promise<ApiResponse<Order[]>> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch items for all orders
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from(TABLES.ORDER_ITEMS)
          .select('*')
          .eq('order_id', order.id);

        return {
          ...order,
          items: itemsData || [],
        };
      })
    );

    return { data: ordersWithItems, error: null };
  } catch (err: any) {
    console.error('Error fetching orders by date range:', err);
    return { data: null, error: err.message };
  }
}

// ===================================
// Orders by Session
// ===================================

export async function getOrdersBySession(
  sessionId: string
): Promise<ApiResponse<Order[]>> {
  try {
    if (!sessionId) {
      return { data: [], error: null };
    }

    // First check if session_id column exists by trying query
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    // If error about column not existing, return empty
    if (ordersError) {
      console.warn('session_id column may not exist yet:', ordersError.message);
      return { data: [], error: null };
    }

    // Fetch items for all orders
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from(TABLES.ORDER_ITEMS)
          .select('*')
          .eq('order_id', order.id);

        return {
          ...order,
          items: itemsData || [],
        };
      })
    );

    return { data: ordersWithItems, error: null };
  } catch (err: any) {
    console.error('Error fetching orders by session:', err);
    return { data: [], error: null };
  }
}

export async function getSessionSales(sessionId: string): Promise<ApiResponse<{
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
  cashRevenue: number;
  transferRevenue: number;
}>> {
  try {
    if (!sessionId) {
      return {
        data: { totalOrders: 0, totalRevenue: 0, totalItems: 0, cashRevenue: 0, transferRevenue: 0 },
        error: null,
      };
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.ORDERS)
      .select('id, total, payment_method')
      .eq('session_id', sessionId)
      .eq('status', 'completed');

    // If error about column not existing, return zeros
    if (ordersError) {
      console.warn('session_id column may not exist yet:', ordersError.message);
      return {
        data: { totalOrders: 0, totalRevenue: 0, totalItems: 0, cashRevenue: 0, transferRevenue: 0 },
        error: null,
      };
    }

    const totalOrders = ordersData?.length || 0;
    const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;

    let cashRevenue = 0;
    let transferRevenue = 0;
    ordersData?.forEach((o) => {
      if (o.payment_method === 'cash') {
        cashRevenue += o.total;
      } else if (o.payment_method === 'transfer') {
        transferRevenue += o.total;
      }
    });

    // Get total items sold in this session
    const orderIds = ordersData?.map(o => o.id) || [];
    let totalItems = 0;

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from(TABLES.ORDER_ITEMS)
        .select('quantity')
        .in('order_id', orderIds);

      if (!itemsError && itemsData) {
        totalItems = itemsData.reduce((sum, item) => sum + item.quantity, 0);
      }
    }

    return {
      data: { totalOrders, totalRevenue, totalItems, cashRevenue, transferRevenue },
      error: null,
    };
  } catch (err: any) {
    console.error('Error fetching session sales:', err);
    return {
      data: { totalOrders: 0, totalRevenue: 0, totalItems: 0, cashRevenue: 0, transferRevenue: 0 },
      error: null,
    };
  }
}

export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<ApiResponse<Order>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return await getOrderById(id);
  } catch (err: any) {
    console.error('Error updating order status:', err);
    return { data: null, error: err.message };
  }
}

// ===================================
// Reports & Analytics
// ===================================

export async function getTodaySales(): Promise<ApiResponse<{
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
}>> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (error) throw error;

    const totalOrders = data?.length || 0;
    const totalRevenue = data?.reduce((sum, order) => sum + order.total, 0) || 0;

    // Get orders with completed status to get their IDs
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.ORDERS)
      .select('id')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (ordersError) throw ordersError;

    // Get total items sold today
    const { data: itemsData, error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .select('quantity')
      .in('order_id', ordersData?.map(o => o.id) || []);

    if (itemsError) throw itemsError;

    const totalItems = itemsData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
      data: { totalOrders, totalRevenue, totalItems },
      error: null,
    };
  } catch (err: any) {
    console.error('Error fetching today sales:', err);
    return { data: null, error: err.message };
  }
}

export async function getTopProducts(limit = 5): Promise<ApiResponse<Array<{
  productName: string;
  quantitySold: number;
  revenue: number;
}>>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .select('product_name, quantity, price');

    if (error) throw error;

    // Aggregate by product name
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    
    data?.forEach((item) => {
      const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
      productMap.set(item.product_name, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity),
      });
    });

    // Convert to array and sort
    const topProducts = Array.from(productMap.entries())
      .map(([name, stats]) => ({
        productName: name,
        quantitySold: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return { data: topProducts, error: null };
  } catch (err: any) {
    console.error('Error fetching top products:', err);
    return { data: null, error: err.message };
  }
}

export async function getSalesSummaryByDateRange(
  startDate: string,
  endDate: string
): Promise<ApiResponse<DailySummary>> {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from(TABLES.ORDERS)
      .select('id, total, payment_method, created_at')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (ordersError) throw ordersError;

    const orderIds = (ordersData || []).map((o) => o.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .select('order_id, quantity')
      .in('order_id', orderIds.length > 0 ? orderIds : ['']);

    if (itemsError) throw itemsError;

    const total_orders = ordersData?.length || 0;
    const total_revenue =
      ordersData?.reduce((sum, o) => sum + (o as any).total, 0) || 0;

    const total_items_sold =
      itemsData?.reduce((sum, item) => sum + (item as any).quantity, 0) || 0;

    const payment_breakdown: DailySummary['payment_breakdown'] = {
      cash: 0,
      transfer: 0,
    };

    (ordersData || []).forEach((o) => {
      const method = (o as any).payment_method as keyof DailySummary['payment_breakdown'];
      const total = (o as any).total as number;
      if (payment_breakdown[method] !== undefined) {
        payment_breakdown[method] += total;
      }
    });

    const summary: DailySummary = {
      date: startDate,
      total_orders,
      total_revenue,
      total_items_sold,
      payment_breakdown,
    };

    return { data: summary, error: null };
  } catch (err: any) {
    console.error('Error fetching sales summary by date range:', err);
    return { data: null, error: err.message };
  }
}
