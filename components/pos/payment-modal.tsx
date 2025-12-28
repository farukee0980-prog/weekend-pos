'use client';

import React, { useState } from 'react';
import { Banknote, CreditCard, QrCode, Check, Printer } from 'lucide-react';
import { CartItem, PaymentMethod } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Modal, Button, Input } from '@/components/ui';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onConfirm: (paymentMethod: PaymentMethod, received: number) => void;
}

const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType }[] = [
  { id: 'cash', name: 'เงินสด', icon: Banknote },
  { id: 'transfer', name: 'โอนเงิน', icon: QrCode },
  { id: 'credit_card', name: 'บัตรเครดิต', icon: CreditCard },
];

const quickAmounts = [20, 50, 100, 500, 1000];

export function PaymentModal({ isOpen, onClose, items, total, onConfirm }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string>(total.toString());

  const received = parseFloat(receivedAmount) || 0;
  const change = received - total;

  const handleConfirm = () => {
    onConfirm(selectedMethod, received);
    setReceivedAmount(total.toString());
    setSelectedMethod('cash');
  };

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount.toString());
  };

  const handleExactAmount = () => {
    setReceivedAmount(total.toString());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ชำระเงิน" size="lg">
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>รายการ ({items.length})</span>
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</span>
          </div>
          <div className="flex justify-between text-xl font-bold">
            <span>ยอดชำระ</span>
            <span className="text-amber-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วิธีชำระเงิน
          </label>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;

              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    isSelected
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Icon className={cn('w-6 h-6', isSelected ? 'text-amber-600' : 'text-gray-400')} />
                  <span className={cn('text-sm font-medium', isSelected ? 'text-amber-700' : 'text-gray-600')}>
                    {method.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Payment */}
        {selectedMethod === 'cash' && (
          <div className="space-y-3">
            <Input
              label="รับเงิน"
              type="number"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              className="text-right text-xl font-bold"
            />

            {/* Quick Amounts */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExactAmount}
                className="px-3 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                พอดี
              </button>
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {amount}
                </button>
              ))}
            </div>

            {/* Change */}
            {received >= total && (
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">เงินทอน</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}

            {received < total && received > 0 && (
              <div className="p-4 bg-red-50 rounded-xl">
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
          <div className="p-6 bg-gray-50 rounded-xl text-center space-y-3">
            <div className="w-48 h-48 mx-auto bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
              <QrCode className="w-24 h-24 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">QR Code สำหรับโอนเงิน</p>
            <p className="text-xs text-gray-400">กรุณาตั้งค่า PromptPay ในหน้าตั้งค่า</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
            disabled={selectedMethod === 'cash' && received < total}
          >
            <Check className="w-5 h-5" />
            ยืนยัน
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Success Modal
interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  total: number;
  paymentMethod: PaymentMethod;
  received: number;
  onPrint: () => void;
  onNewOrder: () => void;
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  orderNumber,
  total,
  paymentMethod,
  received,
  onPrint,
  onNewOrder,
}: PaymentSuccessModalProps) {
  const change = received - total;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-green-600" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">ชำระเงินสำเร็จ</h2>
          <p className="text-gray-500 mt-1">ออเดอร์ #{orderNumber}</p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">ยอดชำระ</span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          {paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">รับเงิน</span>
                <span>{formatCurrency(received)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-green-600">
                <span>เงินทอน</span>
                <span>{formatCurrency(change)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onPrint} className="flex-1">
            <Printer className="w-5 h-5" />
            พิมพ์ใบเสร็จ
          </Button>
          <Button onClick={onNewOrder} className="flex-1">
            ออเดอร์ใหม่
          </Button>
        </div>
      </div>
    </Modal>
  );
}
