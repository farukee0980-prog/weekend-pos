'use client';

import React from 'react';
import { X, Clock, ShoppingBag, User, Trash2, RotateCcw } from 'lucide-react';
import { HeldOrder } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface HeldOrdersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  heldOrders: HeldOrder[];
  onRecall: (order: HeldOrder) => void;
  onDelete: (orderId: string) => void;
}

export function HeldOrdersSheet({
  isOpen,
  onClose,
  heldOrders,
  onRecall,
  onDelete,
}: HeldOrdersSheetProps) {
  if (!isOpen) return null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">ออเดอร์ที่พักไว้</h2>
              <p className="text-sm text-gray-500">{heldOrders.length} รายการ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">ไม่มีออเดอร์ที่พักไว้</p>
              <p className="text-sm text-gray-400 mt-1">กดปุ่ม "พักออเดอร์" เพื่อเก็บไว้ก่อน</p>
            </div>
          ) : (
            <div className="space-y-3">
              {heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  {/* Order Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(order.createdAt)}</span>
                      </div>
                      {order.member && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <User className="w-4 h-4" />
                          <span>{order.member.name}</span>
                        </div>
                      )}
                      {order.note && (
                        <p className="text-sm text-amber-600 mt-1">📝 {order.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} รายการ</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="text-sm text-gray-600 mb-3 bg-white rounded-lg p-2 max-h-20 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="truncate flex-1">{item.product.name} x{item.quantity}</span>
                        <span className="text-gray-500 ml-2">{formatCurrency(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(order.id)}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      ลบ
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onRecall(order)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      เรียกคืน
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
