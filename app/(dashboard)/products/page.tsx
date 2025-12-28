'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Coffee, Package } from 'lucide-react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Modal, Badge } from '@/components/ui';
import { demoProducts, demoCategories } from '@/lib/demo-data';
import { formatCurrency, cn } from '@/lib/utils';
import { Product, Category } from '@/lib/types';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = demoProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return demoCategories.find((c) => c.id === categoryId)?.name || '-';
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="จัดการสินค้า" subtitle="เพิ่ม แก้ไข ลบสินค้าและหมวดหมู่" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            label="สินค้าทั้งหมด"
            value={demoProducts.length}
            color="blue"
          />
          <StatCard
            icon={Coffee}
            label="พร้อมขาย"
            value={demoProducts.filter((p) => p.is_available).length}
            color="green"
          />
          <StatCard
            icon={Package}
            label="หมด"
            value={demoProducts.filter((p) => !p.is_available).length}
            color="red"
          />
          <StatCard
            icon={Package}
            label="หมวดหมู่"
            value={demoCategories.length}
            color="amber"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              ทั้งหมด
            </button>
            {demoCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === category.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-5 h-5" />
            เพิ่มสินค้า
          </Button>
        </div>

        {/* Product Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">สินค้า</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">ราคา</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Coffee className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getCategoryName(product.category_id)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={product.is_available ? 'success' : 'danger'}>
                        {product.is_available ? 'พร้อมขาย' : 'หมด'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Package className="w-12 h-12 mb-2" />
                <p>ไม่พบสินค้า</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Product Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen || !!editingProduct}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={demoCategories}
      />
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'amber';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  amber: 'bg-amber-100 text-amber-600',
};

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Product Form Modal
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
}

function ProductFormModal({ isOpen, onClose, product, categories }: ProductFormModalProps) {
  const isEdit = !!product;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'} size="lg">
      <form className="space-y-4">
        <Input label="ชื่อสินค้า" placeholder="เช่น อเมริกาโน่" defaultValue={product?.name} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="ราคา" type="number" placeholder="0" defaultValue={product?.price} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
            <select
              defaultValue={product?.category_id}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_available"
            defaultChecked={product?.is_available ?? true}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="is_available" className="text-sm text-gray-700">
            พร้อมขาย
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            ยกเลิก
          </Button>
          <Button type="submit" className="flex-1">
            {isEdit ? 'บันทึก' : 'เพิ่มสินค้า'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
