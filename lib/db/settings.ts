import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';

const SETTINGS_TABLE = 'store_settings';

// ===================================
// Store Settings
// ===================================

export async function getStoreSetting(key: string): Promise<ApiResponse<string>> {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('value')
      .eq('key', key)
      .single();

    if (error) throw error;

    return { data: data?.value || null, error: null };
  } catch (err: any) {
    console.error(`Error fetching setting ${key}:`, err);
    return { data: null, error: err.message };
  }
}

export async function getAllStoreSettings(): Promise<ApiResponse<Record<string, string>>> {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE)
      .select('key, value');

    if (error) throw error;

    const settings: Record<string, string> = {};
    data?.forEach((row) => {
      settings[row.key] = row.value;
    });

    return { data: settings, error: null };
  } catch (err: any) {
    console.error('Error fetching all settings:', err);
    return { data: null, error: err.message };
  }
}

export async function setStoreSetting(key: string, value: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert([{ key, value, updated_at: new Date().toISOString() }]);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error(`Error setting ${key}:`, err);
    return { data: null, error: err.message };
  }
}

export async function setBulkStoreSettings(settings: Record<string, string>): Promise<ApiResponse<null>> {
  try {
    const records = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(SETTINGS_TABLE)
      .upsert(records);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Error setting bulk settings:', err);
    return { data: null, error: err.message };
  }
}
