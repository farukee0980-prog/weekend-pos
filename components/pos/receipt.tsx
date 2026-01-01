'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { OrderItem, PaymentMethod } from '@/lib/types';
import { getAllStoreSettings } from '@/lib/db/settings';

export interface ReceiptData {
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  received?: number;
  change?: number;
  createdAt: string;
}

interface ReceiptProps {
  data: ReceiptData;
}

// Component สำหรับแสดงใบเสร็จ (ใช้ print)
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllStoreSettings().then((res) => {
      if (res.data) setSettings(res.data);
    });
  }, []);

  const storeName = settings.store_name || 'ร้านค้าของฉัน';
  const storeAddress = settings.store_address || '';
  const storePhone = settings.store_phone || '';
  const taxId = settings.tax_id || '';
  const receiptFooter = settings.receipt_footer || 'ขอบคุณที่ใช้บริการ';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={ref}
      className="receipt-content bg-white text-black p-4 font-mono text-sm"
      style={{ width: '80mm', maxWidth: '100%' }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{storeName}</h1>
        {storeAddress && <p className="text-xs mt-1">{storeAddress}</p>}
        {storePhone && <p className="text-xs">โทร: {storePhone}</p>}
        {taxId && <p className="text-xs">Tax ID: {taxId}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Order Info */}
      <div className="mb-2">
        <p className="text-xs">เลขที่: <span className="font-bold">{data.orderNumber}</span></p>
        <p className="text-xs">วันที่: {formatDate(data.createdAt)}</p>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Items */}
      <div className="space-y-1">
        {data.items.map((item, index) => (
          <div key={index} className="flex justify-between text-xs">
            <div className="flex-1">
              <span>{item.product_name}</span>
              <span className="text-gray-500 ml-1">x{item.quantity}</span>
              {item.note && <p className="text-xs text-gray-500 pl-2">* {item.note}</p>}
            </div>
            <span className="ml-2">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Totals */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>รวม</span>
          <span>{formatCurrency(data.subtotal)}</span>
        </div>
        {data.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>ส่วนลด</span>
            <span>-{formatCurrency(data.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300">
          <span>ยอดสุทธิ</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2" />

      {/* Payment Info */}
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>ชำระโดย</span>
          <span>{data.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
        </div>
        {data.paymentMethod === 'cash' && data.received && (
          <>
            <div className="flex justify-between">
              <span>รับเงิน</span>
              <span>{formatCurrency(data.received)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>เงินทอน</span>
              <span>{formatCurrency(data.change || 0)}</span>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs whitespace-pre-line">{receiptFooter}</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

// ฟังก์ชันพิมพ์ใบเสร็จ (async เพื่อดึง settings จาก Supabase)
export async function printReceipt(data: ReceiptData) {
  // ดึง settings จาก Supabase ก่อน
  const settingsRes = await getAllStoreSettings();
  const settings = settingsRes.data || {};
  
  const storeName = settings.store_name || 'ร้านค้าของฉัน';
  const storeAddress = settings.store_address || '';
  const storePhone = settings.store_phone || '';
  const taxId = settings.tax_id || '';
  const receiptFooter = settings.receipt_footer || 'ขอบคุณที่ใช้บริการ';

  // สร้าง element สำหรับพิมพ์
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('กรุณาอนุญาต popup เพื่อพิมพ์ใบเสร็จ');
    return;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const itemsHtml = data.items
    .map(
      (item) => `
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <div style="flex: 1;">
          <span>${item.product_name}</span>
          <span style="color: #666; margin-left: 4px;">x${item.quantity}</span>
          ${item.note ? `<div style="font-size: 11px; color: #666; padding-left: 8px;">* ${item.note}</div>` : ''}
        </div>
        <span style="margin-left: 8px;">฿${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ใบเสร็จ #${data.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Prompt', 'Sarabun', sans-serif; 
          padding: 10px;
          width: 80mm;
          max-width: 100%;
        }
        .divider { 
          border-top: 1px dashed #999; 
          margin: 8px 0; 
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .flex { display: flex; justify-content: space-between; }
        .text-xs { font-size: 11px; }
        .text-sm { font-size: 12px; }
        .text-base { font-size: 14px; }
        .text-lg { font-size: 16px; }
        .text-red { color: #dc2626; }
        .mt-1 { margin-top: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .space-y-1 > * + * { margin-top: 4px; }
        @media print {
          body { width: 80mm; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="center mb-2">
        <div class="text-lg bold">${storeName}</div>
        ${storeAddress ? `<div class="text-xs mt-1">${storeAddress}</div>` : ''}
        ${storePhone ? `<div class="text-xs">โทร: ${storePhone}</div>` : ''}
        ${taxId ? `<div class="text-xs">Tax ID: ${taxId}</div>` : ''}
      </div>

      <div class="divider"></div>

      <!-- Order Info -->
      <div class="text-xs mb-2">
        <div>เลขที่: <span class="bold">${data.orderNumber}</span></div>
        <div>วันที่: ${formatDate(data.createdAt)}</div>
      </div>

      <div class="divider"></div>

      <!-- Items -->
      <div class="space-y-1">
        ${itemsHtml}
      </div>

      <div class="divider"></div>

      <!-- Totals -->
      <div class="space-y-1 text-sm">
        <div class="flex">
          <span>รวม</span>
          <span>฿${data.subtotal.toLocaleString()}</span>
        </div>
        ${
          data.discount > 0
            ? `<div class="flex text-red">
                <span>ส่วนลด</span>
                <span>-฿${data.discount.toLocaleString()}</span>
              </div>`
            : ''
        }
        <div class="flex bold text-base" style="padding-top: 4px; border-top: 1px solid #ccc;">
          <span>ยอดสุทธิ</span>
          <span>฿${data.total.toLocaleString()}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Payment -->
      <div class="space-y-1 text-xs">
        <div class="flex">
          <span>ชำระโดย</span>
          <span>${data.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
        </div>
        ${
          data.paymentMethod === 'cash' && data.received
            ? `
            <div class="flex">
              <span>รับเงิน</span>
              <span>฿${data.received.toLocaleString()}</span>
            </div>
            <div class="flex bold">
              <span>เงินทอน</span>
              <span>฿${(data.change || 0).toLocaleString()}</span>
            </div>
          `
            : ''
        }
      </div>

      <div class="divider"></div>

      <!-- Footer -->
      <div class="center text-xs" style="white-space: pre-line;">
        ${receiptFooter}
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
