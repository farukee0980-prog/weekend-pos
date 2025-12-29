import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';

const STAFF_TABLE = 'staff';

export interface Staff {
  id: string;
  line_user_id: string;
  display_name: string;
  picture_url?: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  added_by?: string;
  created_at: string;
  updated_at: string;
}

// ===================================
// Staff Management
// ===================================

export async function getAllStaff(): Promise<ApiResponse<Staff[]>> {
  try {
    const { data, error } = await supabase
      .from(STAFF_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching staff:', err);
    return { data: null, error: err.message };
  }
}

export async function getActiveStaff(): Promise<ApiResponse<Staff[]>> {
  try {
    const { data, error } = await supabase
      .from(STAFF_TABLE)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching active staff:', err);
    return { data: null, error: err.message };
  }
}

export async function getStaffByLineUserId(lineUserId: string): Promise<ApiResponse<Staff>> {
  try {
    const { data, error } = await supabase
      .from(STAFF_TABLE)
      .select('*')
      .eq('line_user_id', lineUserId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching staff by LINE ID:', err);
    return { data: null, error: err.message };
  }
}

export async function isStaffAuthorized(lineUserId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(STAFF_TABLE)
      .select('id')
      .eq('line_user_id', lineUserId)
      .eq('is_active', true)
      .single();

    if (error) return false;
    return !!data;
  } catch (err) {
    return false;
  }
}

export async function addStaff(
  lineUserId: string,
  displayName: string,
  pictureUrl: string | undefined,
  addedBy: string,
  role: 'admin' | 'staff' = 'staff'
): Promise<ApiResponse<Staff>> {
  try {
    // Check if staff already exists
    const existing = await getStaffByLineUserId(lineUserId);
    if (existing.data) {
      return { data: null, error: 'พนักงานนี้มีอยู่ในระบบแล้ว' };
    }

    const { data, error } = await supabase
      .from(STAFF_TABLE)
      .insert([
        {
          line_user_id: lineUserId,
          display_name: displayName,
          picture_url: pictureUrl,
          role,
          added_by: addedBy,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error adding staff:', err);
    return { data: null, error: err.message };
  }
}

export async function updateStaff(
  id: string,
  updates: Partial<Omit<Staff, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Staff>> {
  try {
    const { data, error } = await supabase
      .from(STAFF_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error updating staff:', err);
    return { data: null, error: err.message };
  }
}

export async function deactivateStaff(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(STAFF_TABLE)
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Error deactivating staff:', err);
    return { data: null, error: err.message };
  }
}

export async function deleteStaff(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(STAFF_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Error deleting staff:', err);
    return { data: null, error: err.message };
  }
}
