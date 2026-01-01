'use client';

import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, MessageSquare, User, Star } from 'lucide-react';
import { CartItem, Member } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { MemberSearch } from '@/components/members';

interface CartProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onUpdateNote: (productId: string, note: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
  selectedMember?: Member | null;
  onSelectMember?: (member: Member | null) => void;
  onAddNewMember?: () => void;
}

export function Cart({
  items,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateNote,
  onCheckout,
  onClearCart,
  selectedMember,
  onSelectMember,
  onAddNewMember,
}: CartProps) {
  return (
    <div className="flex flex-col h-full bg-white md:border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">ตะกร้าสินค้า</h2>
            {items.length > 0 && (
              <p className="text-xs text-gray-500">{items.length} รายการ</p>
            )}
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้าง</span>
          </button>
        )}
      </div>

      {/* Member Search Section */}
      {onSelectMember && (
        <div className="px-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">ลูกค้าสมาชิก</span>
          </div>
          <MemberSearch
            selectedMember={selectedMember || null}
            onSelectMember={onSelectMember}
            onAddNew={onAddNewMember ? (phone) => onAddNewMember() : () => {}}
          />
          
          {/* Show member points summary */}
          {selectedMember && (
            <div className="mt-2 p-2 bg-amber-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700">แต้มสะสม</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-amber-700">{selectedMember.total_points}</span>
                  <span className="text-amber-600 text-xs">แต้ม</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                กดชำระเงินเพื่อแลกแต้มเป็นส่วนลด
              </p>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">ยังไม่มีสินค้า</p>
            <p className="text-sm text-gray-400 mt-1 text-center">เลือกสินค้าที่ต้องการขาย</p>
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
        <div className="p-4 pb-6 border-t-2 border-gray-200 bg-gradient-to-b from-white to-gray-50 space-y-3">
          {/* Summary */}
          <div className="space-y-2 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <div className="flex justify-between text-sm text-amber-800">
              <span className="font-medium">รวมทั้งหมด ({items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น)</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-amber-200">
              <span className="text-sm font-medium text-amber-900">ยอดชำระ</span>
              <span className="text-2xl font-bold text-amber-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button onClick={onCheckout} className="w-full h-12 text-base font-bold shadow-lg" size="lg">
            <span>ชำระเงิน</span>
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
    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
      <div className="flex items-start gap-2">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm md:text-base">{item.product.name}</h4>
          <p className="text-xs md:text-sm text-amber-600 font-medium">{formatCurrency(item.product.price)}</p>
        </div>

        {/* Total Price */}
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900 text-sm md:text-base">
            {formatCurrency(item.product.price * item.quantity)}
          </p>
        </div>
      </div>

      {/* Quantity Controls & Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Quantity */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-amber-400 transition-colors active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-gray-900 text-base">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-amber-400 transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNote(!showNote)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors',
              item.note
                ? 'bg-amber-100 text-amber-700'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{item.note ? 'แก้ไขโน้ต' : 'โน้ต'}</span>
          </button>
          <button
            onClick={() => onRemove(item.product.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Input */}
      {showNote && (
        <input
          type="text"
          value={item.note || ''}
          onChange={(e) => onUpdateNote(item.product.id, e.target.value)}
          placeholder="เช่น น้ำน้อย, ไม่ใส่น้ำตาล..."
          className="w-full px-3 py-2 text-sm border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
          autoFocus
        />
      )}
    </div>
  );
}
