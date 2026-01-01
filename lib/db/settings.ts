import { supabase } from '@/lib/supabase';
import type { ApiResponse, PointsConfig } from '@/lib/types';

const SETTINGS_TABLE = 'store_settings';

// Default points config
const DEFAULT_POINTS_CONFIG: PointsConfig = {
  points_to_redeem: 100,
  redeem_value: 40,
  default_points_per_item: 1,
};

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

// ===================================
// Points Configuration
// ===================================

export async function getPointsConfig(): Promise<ApiResponse<PointsConfig>> {
  try {
    const res = await getAllStoreSettings();
    if (res.error) throw new Error(res.error);

    const settings = res.data || {};

    return {
      data: {
        points_to_redeem: parseInt(settings['points_to_redeem']) || DEFAULT_POINTS_CONFIG.points_to_redeem,
        redeem_value: parseInt(settings['redeem_value']) || DEFAULT_POINTS_CONFIG.redeem_value,
        default_points_per_item: parseInt(settings['default_points_per_item']) || DEFAULT_POINTS_CONFIG.default_points_per_item,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Error fetching points config:', err);
    return { data: DEFAULT_POINTS_CONFIG, error: null }; // Return default on error
  }
}

export async function savePointsConfig(config: PointsConfig): Promise<ApiResponse<null>> {
  try {
    const settings: Record<string, string> = {
      points_to_redeem: config.points_to_redeem.toString(),
      redeem_value: config.redeem_value.toString(),
      default_points_per_item: config.default_points_per_item.toString(),
    };

    return await setBulkStoreSettings(settings);
  } catch (err: any) {
    console.error('Error saving points config:', err);
    return { data: null, error: err.message };
  }
}
