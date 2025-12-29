import { supabase, TABLES } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';

export interface StoreSession {
  id: string;
  opened_at: string;
  closed_at: string | null;
  total_orders: number | null;
  total_items: number | null;
  total_revenue: number | null;
  cash_revenue?: number | null;
  transfer_revenue?: number | null;
}

export async function getCurrentSession(): Promise<ApiResponse<StoreSession | null>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .select('*')
      .is('closed_at', null)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { data: data ?? null, error: null };
  } catch (err: any) {
    console.error('Error fetching current session:', err);
    return { data: null, error: err.message };
  }
}

export async function getLastSession(): Promise<ApiResponse<StoreSession | null>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .select('*')
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { data: data ?? null, error: null };
  } catch (err: any) {
    console.error('Error fetching last session:', err);
    return { data: null, error: err.message };
  }
}

export async function getAllSessions(limit = 50): Promise<ApiResponse<StoreSession[]>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .select('*')
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data: data ?? [], error: null };
  } catch (err: any) {
    console.error('Error fetching all sessions:', err);
    return { data: null, error: err.message };
  }
}

export async function openSession(openedBy?: string): Promise<ApiResponse<StoreSession>> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .insert([{ opened_at: now, opened_by: openedBy ?? null } as any])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error opening session:', err);
    return { data: null, error: err.message };
  }
}

export async function closeSession(
  id: string,
  summary: {
    totalOrders: number;
    totalItems: number;
    totalRevenue: number;
    cashRevenue: number;
    transferRevenue: number;
  },
  closedBy?: string
): Promise<ApiResponse<StoreSession>> {
  try {
    const end = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.SESSIONS)
      .update({
        closed_at: end,
        closed_by: closedBy ?? null,
        total_orders: summary.totalOrders,
        total_items: summary.totalItems,
        total_revenue: summary.totalRevenue,
        cash_revenue: summary.cashRevenue,
        transfer_revenue: summary.transferRevenue,
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error closing session:', err);
    return { data: null, error: err.message };
  }
}
