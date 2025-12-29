import { supabase, TABLES } from '@/lib/supabase';
import type { Product, Category, ApiResponse } from '@/lib/types';

// ===================================
// Products CRUD
// ===================================

export async function getAllProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching products:', err);
    return { data: null, error: err.message };
  }
}

export async function getProductsByCategory(categoryId: string): Promise<ApiResponse<Product[]>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('category_id', categoryId)
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching products by category:', err);
    return { data: null, error: err.message };
  }
}

export async function getAvailableProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('is_available', true)
      .order('name');

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching available products:', err);
    return { data: null, error: err.message };
  }
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Product>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert([product])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error creating product:', err);
    return { data: null, error: err.message };
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error updating product:', err);
    return { data: null, error: err.message };
  }
}

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return { data: null, error: err.message };
  }
}

// ===================================
// Categories CRUD
// ===================================

export async function getAllCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select('*')
      .order('sort_order');

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    return { data: null, error: err.message };
  }
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .insert([category])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error creating category:', err);
    return { data: null, error: err.message };
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<ApiResponse<Category>> {
  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err: any) {
    console.error('Error updating category:', err);
    return { data: null, error: err.message };
  }
}

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from(TABLES.CATEGORIES)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: null, error: null };
  } catch (err: any) {
    console.error('Error deleting category:', err);
    return { data: null, error: err.message };
  }
}
