'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Coffee, Package, Image as ImageIcon, FolderPlus, X, AlertTriangle, Check } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button, Card, CardContent, Modal, Badge } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, Category } from '@/lib/types';
import { getAllProducts, getAllCategories, createProduct, updateProduct, deleteProduct, createCategory, deleteCategory } from '@/lib/db/products';
import { supabase } from '@/lib/supabase';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getAllProducts(),
        getAllCategories(),
      ]);

      if (productsRes.error || categoriesRes.error) {
        setDataError(productsRes.error || categoriesRes.error || 'ไม่สามารถโหลดข้อมูลได้');
      } else {
        setProducts(productsRes.data || []);
        setCategories(categoriesRes.data || []);
      }
    } catch (err) {
      console.error(err);
      setDataError('เกิดข้อผิดพลาดขณะโหลดข้อมูล');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    const res = await deleteProduct(deletingProduct.id);
    if (!res.error) {
      setProducts(products.filter(p => p.id !== deletingProduct.id));
    }
    setDeletingProduct(null);
  };

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (editingProduct) {
      const res = await updateProduct(editingProduct.id, data);
      if (!res.error && res.data) {
        setProducts(products.map(p => p.id === editingProduct.id ? res.data! : p));
      }
    } else {
      const res = await createProduct(data as any);
      if (!res.error && res.data) {
        setProducts([...products, res.data]);
      }
    }
    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleCreateCategory = async (name: string) => {
    const maxSort = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) : 0;
    const res = await createCategory({ name, sort_order: maxSort + 1 });
    if (!res.error && res.data) {
      setCategories([...categories, res.data]);
      setIsAddCategoryOpen(false);
    } else {
      alert('ไม่สามารถเพิ่มหมวดหมู่ได้');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    // Check if category has products
    const hasProducts = products.some(p => p.category_id === deletingCategory.id);
    if (hasProducts) {
      alert('ไม่สามารถลบหมวดหมู่ได้ เนื่องจากมีสินค้าอยู่ในหมวดหมู่นี้');
      setDeletingCategory(null);
      return;
    }

    const res = await deleteCategory(deletingCategory.id);
    if (!res.error) {
      setCategories(categories.filter(c => c.id !== deletingCategory.id));
      if (selectedCategory === deletingCategory.id) {
        setSelectedCategory(null);
      }
    } else {
      alert('ไม่สามารถลบหมวดหมู่ได้');
    }
    setDeletingCategory(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="จัดการสินค้า" subtitle="เพิ่ม แก้ไข ลบสินค้า" />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={Package} label="ทั้งหมด" value={products.length} color="blue" />
          <StatCard icon={Coffee} label="พร้อมขาย" value={products.filter((p) => p.is_available).length} color="green" />
          <StatCard icon={Package} label="หมด" value={products.filter((p) => !p.is_available).length} color="red" />
          <StatCard icon={Package} label="หมวดหมู่" value={categories.length} color="amber" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="shrink-0">
            <Plus className="w-5 h-5" />
            <span className="ml-1">เพิ่มสินค้า</span>
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                selectedCategory === null ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              ทั้งหมด
            </button>
            {categories.map((category) => (
              <div key={category.id} className="relative inline-flex group">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'px-3 py-1.5 pr-8 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                    selectedCategory === category.id ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {category.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingCategory(category);
                  }}
                  className={cn(
                    'absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                    selectedCategory === category.id
                      ? 'text-white hover:bg-amber-700'
                      : 'text-gray-500 hover:bg-gray-200'
                  )}
                  title="ลบหมวดหมู่"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="shrink-0 p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="เพิ่มหมวดหมู่"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Product List */}
        {isLoadingData ? (
          <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
        ) : dataError ? (
          <div className="text-center py-8 text-red-500">{dataError}</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">หมวดหมู่</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">ราคา</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">สถานะ</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Coffee className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{getCategoryName(product.category_id)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-600">{formatCurrency(product.price)}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={product.is_available ? 'success' : 'danger'}>
                              {product.is_available ? 'พร้อมขาย' : 'หมด'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => setEditingProduct(product)} className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeletingProduct(product)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p>ไม่พบสินค้า</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Coffee className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{getCategoryName(product.category_id)}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-semibold text-amber-600">{formatCurrency(product.price)}</span>
                          <Badge variant={product.is_available ? 'success' : 'danger'} className="text-xs">
                            {product.is_available ? 'พร้อมขาย' : 'หมด'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setEditingProduct(product)} className="p-2 rounded-lg text-amber-600 bg-amber-50">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingProduct(product)} className="p-2 rounded-lg text-red-600 bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p>ไม่พบสินค้า</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen || !!editingProduct}
        onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirm Modal */}
      {deletingProduct && (
        <Modal isOpen={true} onClose={() => setDeletingProduct(null)} title="ยืนยันการลบ">
          <div className="space-y-4">
            <p className="text-gray-600">คุณต้องการลบสินค้า <strong>{deletingProduct.name}</strong> ใช่หรือไม่?</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingProduct(null)} className="flex-1">ยกเลิก</Button>
              <Button onClick={handleDeleteProduct} className="flex-1 bg-red-600 hover:bg-red-700">ลบ</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Category Modal */}
      <CategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSave={handleCreateCategory}
      />

      {/* Delete Category Confirm Modal */}
      {deletingCategory && (
        <Modal isOpen={true} onClose={() => setDeletingCategory(null)} title="ยืนยันการลบหมวดหมู่">
          <div className="space-y-4">
            <p className="text-gray-600">
              คุณต้องการลบหมวดหมู่ <strong>{deletingCategory.name}</strong> ใช่หรือไม่?
            </p>
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              หากหมวดหมู่นี้มีสินค้าอยู่จะไม่สามารถลบได้
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingCategory(null)} className="flex-1">ยกเลิก</Button>
              <Button onClick={handleDeleteCategory} className="flex-1 bg-red-600 hover:bg-red-700">ลบหมวดหมู่</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <Card>
      <CardContent className="p-3 md:p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-500">{label}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onSave: (data: Partial<Product>) => Promise<void>;
}

function ProductFormModal({ isOpen, onClose, product, categories, onSave }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setCategoryId(product.category_id);
      setIsAvailable(product.is_available);
      setImageUrl(product.image_url || '');
      setImagePreview(product.image_url || null);
    } else {
      setName('');
      setPrice('');
      setCategoryId('');
      setIsAvailable(true);
      setImageUrl('');
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl || null;
    
    setIsUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return imageUrl || null;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return imageUrl || null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    setIsSaving(true);
    try {
      const uploadedUrl = await uploadImage();
      await onSave({
        name: name.trim(),
        price: parseFloat(price),
        category_id: categoryId,
        is_available: isAvailable,
        image_url: uploadedUrl || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">รูปสินค้า</label>
          <div className="flex items-start gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors overflow-hidden"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs text-gray-600 mt-1">คลิกเพื่อเพิ่มรูป</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-1">คลิกที่กรอบเพื่ออัพโหลดรูปภาพ</p>
              <p className="text-xs text-gray-600">รองรับไฟล์ JPG, PNG, GIF</p>
              {imageFile && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  เลือกไฟล์: {imageFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">ชื่อสินค้า *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น อเมริกาโน่"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">ราคา *</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">หมวดหมู่ *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_available"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="is_available" className="text-sm font-medium text-gray-900">พร้อมขาย</label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSaving}>
            ยกเลิก
          </Button>
          <Button type="submit" className="flex-1" disabled={isSaving || isUploading}>
            {isSaving || isUploading ? 'กำลังบันทึก...' : product ? 'บันทึก' : 'เพิ่มสินค้า'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

function CategoryModal({ isOpen, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(name.trim());
      setName('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="เพิ่มหมวดหมู่ใหม่" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            ชื่อหมวดหมู่ *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น เครื่องดื่มร้อน, เบเกอรี่..."
            required
            autoFocus
            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            หมวดหมู่ที่สร้างจะปรากฏในหน้า POS และหน้าจัดการสินค้า
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? 'กำลังบันทึก...' : 'เพิ่มหมวดหมู่'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
