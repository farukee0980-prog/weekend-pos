'use client';

import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, MessageSquare } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface CartProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateNote: (productId: string, note: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

export function Cart({
  items,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNote,
  onCheckout,
  onClearCart,
}: CartProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">ออเดอร์</h2>
          {items.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingBag className="w-12 h-12 mb-2" />
            <p>ยังไม่มีสินค้า</p>
            <p className="text-sm">เลือกสินค้าจากเมนูด้านซ้าย</p>
          </div>
        ) : (
          items.map((item) => (
            <CartItemCard
              key={item.product.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
              onUpdateNote={onUpdateNote}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-100 space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>รวม</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>ยอดชำระ</span>
              <span className="text-amber-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button onClick={onCheckout} className="w-full" size="lg">
            ชำระเงิน
          </Button>
        </div>
      )}
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onUpdateNote: (productId: string, note: string) => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove, onUpdateNote }: CartItemCardProps) {
  const [showNote, setShowNote] = React.useState(false);

  return (
    <div className="p-3 bg-gray-50 rounded-xl space-y-2">
      <div className="flex items-start gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
          <p className="text-sm text-amber-600">{formatCurrency(item.product.price)}</p>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Total */}
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {formatCurrency(item.product.price * item.quantity)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowNote(!showNote)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
            item.note
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <MessageSquare className="w-3 h-3" />
          {item.note ? 'มีโน้ต' : 'เพิ่มโน้ต'}
        </button>
        <button
          onClick={() => onRemove(item.product.id)}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gray-100 text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          ลบ
        </button>
      </div>

      {/* Note Input */}
      {showNote && (
        <input
          type="text"
          value={item.note || ''}
          onChange={(e) => onUpdateNote(item.product.id, e.target.value)}
          placeholder="เช่น น้ำน้อย, ไม่ใส่น้ำตาล..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      )}
    </div>
  );
}
