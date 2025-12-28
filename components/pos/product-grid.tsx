'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Coffee } from 'lucide-react';
import { Product, Category } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  onProductClick: (product: Product) => void;
}

export function ProductGrid({
  products,
  categories,
  selectedCategory,
  onCategoryChange,
  onProductClick,
}: ProductGridProps) {
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-100">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
            selectedCategory === null
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          ทั้งหมด
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
              selectedCategory === category.id
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Coffee className="w-12 h-12 mb-2" />
            <p>ไม่พบสินค้า</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!product.is_available}
      className={cn(
        'group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden transition-all',
        'hover:shadow-md hover:border-amber-300',
        'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
        !product.is_available && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Coffee className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Add button overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
            <Plus className="w-5 h-5" />
          </div>
        </div>

        {/* Out of stock badge */}
        {!product.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
              หมด
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 text-left">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <p className="text-amber-600 font-semibold">{formatCurrency(product.price)}</p>
      </div>
    </button>
  );
}
