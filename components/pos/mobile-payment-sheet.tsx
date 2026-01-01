'use client';

import React, { useState } from 'react';
import { Banknote, Smartphone, Check, X, Printer } from 'lucide-react';
import { CartItem, PaymentMethod } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { printReceipt, ReceiptData } from './receipt';

interface MobilePaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onConfirm: (paymentMethod: PaymentMethod, received: number) => void;
}

const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType; description: string }[] = [
  { id: 'cash', name: 'เงินสด', icon: Banknote, description: 'รับเงินสดจากลูกค้า' },
  { id: 'transfer', name: 'โอนเงิน', icon: Smartphone, description: 'ลูกค้าโอนผ่าน QR หน้าร้าน' },
];

const quickAmounts = [20, 50, 100, 500, 1000];

export function MobilePaymentSheet({ isOpen, onClose, items, total, onConfirm }: MobilePaymentSheetProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>(total.toString());

  const received = parseFloat(receivedAmount) || 0;
  const change = received - total;

  const handleConfirm = () => {
    onConfirm(selectedMethod, selectedMethod === 'transfer' ? total : received);
    setReceivedAmount(total.toString());
    setSelectedMethod('cash');
  };

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount.toString());
  };

  const handleExactAmount = () => {
    setReceivedAmount(total.toString());
  };

  const handleNumberPad = (value: string) => {
    if (value === 'clear') {
      setReceivedAmount('0');
    } else if (value === 'backspace') {
      setReceivedAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setReceivedAmount(prev => prev === '0' ? value : prev + value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">ชำระเงิน</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-4 pb-24 space-y-5">
            {/* Order Summary */}
            <div className="p-4 bg-amber-50 rounded-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-amber-700">ยอดรวม ({items.reduce((sum, item) => sum + item.quantity, 0)} รายการ)</p>
                  <p className="text-3xl font-bold text-amber-600">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">วิธีชำระเงิน</label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 bg-white active:bg-gray-50'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={cn('text-sm font-medium', isSelected ? 'text-amber-700' : 'text-gray-700')}>
                        {method.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Payment */}
            {selectedMethod === 'cash' && (
              <div className="space-y-4">
                {/* Received Amount Display */}
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <label className="text-sm text-gray-500">รับเงิน</label>
                  <div className="text-3xl font-bold text-gray-900 text-right">
                    {formatCurrency(received)}
                  </div>
                </div>

                {/* Quick Amounts */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExactAmount}
                    className="px-4 py-2.5 text-sm font-medium bg-amber-100 text-amber-700 rounded-xl active:bg-amber-200"
                  >
                    พอดี
                  </button>
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl active:bg-gray-200"
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNumberPad(key)}
                      className={cn(
                        'h-14 rounded-xl font-semibold text-xl transition-colors',
                        key === 'clear' 
                          ? 'bg-red-100 text-red-600 active:bg-red-200 text-base' 
                          : key === 'backspace'
                          ? 'bg-gray-200 text-gray-700 active:bg-gray-300 text-base'
                          : 'bg-gray-100 text-gray-900 active:bg-gray-200'
                      )}
                    >
                      {key === 'clear' ? 'C' : key === 'backspace' ? '←' : key}
                    </button>
                  ))}
                </div>

                {/* Change Display */}
                {received >= total && (
                  <div className="p-4 bg-green-50 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">เงินทอน</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(change)}
                      </span>
                    </div>
                  </div>
                )}

                {received < total && received > 0 && (
                  <div className="p-4 bg-red-50 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <span className="text-red-700 font-medium">ยังขาด</span>
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(total - received)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Payment */}
            {selectedMethod === 'transfer' && (
              <div className="p-6 bg-blue-50 rounded-2xl text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">ให้ลูกค้าสแกน QR หน้าร้าน</p>
                  <p className="text-sm text-blue-600 mt-1">ตรวจสอบยอดเงินก่อนกดยืนยัน</p>
                </div>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              className="w-full h-14 text-lg"
              disabled={selectedMethod === 'cash' && received < total}
            >
              <Check className="w-5 h-5" />
              ยืนยันชำระเงิน
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success Sheet
interface PaymentSuccessSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  received: number;
  onNewOrder: () => void;
  items?: CartItem[];
}

export function PaymentSuccessSheet({
  isOpen,
  onClose,
  orderNumber,
  total,
  paymentMethod,
  received,
  onNewOrder,
  items = [],
}: PaymentSuccessSheetProps) {
  const change = received - total;

  const handlePrint = () => {
    const receiptData: ReceiptData = {
      orderNumber,
      items: items.map((item) => ({
        id: item.product.id,
        order_id: '',
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        note: item.note,
      })),
      subtotal: total,
      discount: 0,
      total,
      paymentMethod,
      received: paymentMethod === 'cash' ? received : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
      createdAt: new Date().toISOString(),
    };
    printReceipt(receiptData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div className="relative mt-auto bg-white rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="p-6 pb-24 space-y-6">
          {/* Success Icon */}
          <div className="flex flex-col items-center pt-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">ชำระเงินสำเร็จ</h2>
            <p className="text-gray-500 mt-1">ออเดอร์ #{orderNumber}</p>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ยอดชำระ</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ช่องทาง</span>
              <span className="font-semibold">{paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
            </div>
            {paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">รับเงิน</span>
                  <span>{formatCurrency(received)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t border-gray-200">
                  <span>เงินทอน</span>
                  <span>{formatCurrency(change)}</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="w-full h-12 text-base"
            >
              <Printer className="w-5 h-5 mr-2" />
              พิมพ์ใบเสร็จ
            </Button>
            <Button onClick={onNewOrder} className="w-full h-14 text-lg">
              ออเดอร์ใหม่
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
