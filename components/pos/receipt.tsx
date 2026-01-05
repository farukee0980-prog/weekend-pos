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
  cashier?: string;
  pointsDiscount?: number;
  member?: {
    name: string;
    phone: string;
    points?: number;  // คะแนนปัจจุบัน
    points_earned?: number;
    points_used?: number;
  };
}

interface ReceiptProps {
  data: ReceiptData;
}

// On-screen Receipt Component
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllStoreSettings().then((res) => {
      if (res.data) setSettings(res.data);
    });
  }, []);

  const storeName = settings.store_name || 'ร้านค้าของคุณ';
  const storeAddress = settings.store_address || 'ที่อยู่ร้านค้า';
  const storePhone = settings.store_phone || 'เบอร์โทรศัพท์';
  const taxId = settings.tax_id || '';
  const receiptFooter = settings.receipt_footer || 'ขอบคุณที่ใช้บริการ';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div ref={ref} className="bg-white text-black p-4 font-mono max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">{storeName}</h1>
        <p className="text-sm">{storeAddress}</p>
        <p className="text-sm">โทร: {storePhone}</p>
        {taxId && <p className="text-sm">เลขประจำตัวผู้เสียภาษี: {taxId}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Order Info */}
      <div className="text-sm mb-2">
        <p>หมายเลขใบเสร็จ: #{data.orderNumber}</p>
        <p>วันที่: {formatDate(data.createdAt)}</p>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Items Header */}
      <div className="flex text-sm font-bold mb-1">
        <span className="flex-1">รายการ</span>
        <span className="w-12 text-center">x1</span>
        <span className="w-16 text-right">ราคา</span>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Items */}
      <div className="text-sm">
        {data.items.map((item, index) => (
          <div key={index} className="mb-1">
            <div className="flex">
              <span className="flex-1 break-words">{item.product_name}</span>
              <span className="w-12 text-center">{item.quantity}</span>
              <span className="w-16 text-right">{formatCurrency(item.price * item.quantity)}</span>
            </div>
            {item.note && (
              <div className="text-xs text-gray-600 ml-2">* {item.note}</div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Summary */}
      <div className="text-sm">
        <div className="flex justify-between">
          <span>ยอดรวม</span>
          <span>{formatCurrency(data.subtotal)}</span>
        </div>
        {data.pointsDiscount && data.pointsDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>ส่วนลดจากแต้ม</span>
            <span>-{formatCurrency(data.pointsDiscount)}</span>
          </div>
        )}
        {data.discount > 0 && (
          <div className="flex justify-between">
            <span>ส่วนลดเพิ่มเติม</span>
            <span>-{formatCurrency(data.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-black">
          <span>ยอดสุทธิ</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Payment */}
      <div className="text-sm">
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
            <div className="flex justify-between">
              <span>เงินทอน</span>
              <span>{formatCurrency(data.change || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Member Info */}
      {data.member && (
        <>
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <div className="text-center text-sm">
            <p className="font-bold">ข้อมูลสมาชิก</p>
            <p>{data.member.name} ({data.member.phone})</p>
            <p>คะแนนคงเหลือ: {data.member.points || 0} แต้ม</p>
            {data.member.points_earned && <p>แต้มที่ได้รับ: {data.member.points_earned}</p>}
            {data.member.points_used && <p>แต้มที่ใช้: {data.member.points_used}</p>}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-400">
        <p className="text-sm">{receiptFooter}</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

// Print Function
export async function printReceipt(data: ReceiptData) {
  try {
    const settingsRes = await getAllStoreSettings();
    const settings = settingsRes.data || {};
    
    const storeName = settings.store_name || 'ร้านค้าของคุณ';
    const storeAddress = settings.store_address || 'ที่อยู่ร้านค้า';
    const storePhone = settings.store_phone || 'เบอร์โทรศัพท์';
    const taxId = settings.tax_id || '';
    const receiptFooter = settings.receipt_footer || 'ขอบคุณที่ใช้บริการ';

    const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    if (!printWindow) {
      alert('กรุณาอนุญาต pop-up เพื่อพิมพ์ใบเสร็จ');
      return;
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    };

    // สร้าง HTML สำหรับพิมพ์
    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>ใบเสร็จ #${data.orderNumber}</title>
    <style>
        @page { 
            size: 54mm auto; 
            margin: 1mm;
        }
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        body { 
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            font-weight: bold;
            line-height: 1.2;
            width: 46mm;
            padding: 2mm;
            color: #000;
            background: #fff;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { 
            border-top: 1px dashed #000; 
            margin: 2px 0; 
            height: 0px;
        }
        .thick-line {
            border-top: 2px solid #000;
            margin: 3px 0;
        }
        .header { 
            text-align: center; 
            margin-bottom: 3px; 
        }
        .header h1 { 
            font-size: 12pt; 
            font-weight: bold;
            margin-bottom: 1px;
        }
        .header-info {
            font-size: 8pt;
            line-height: 1.1;
            font-weight: bold;
        }
        .receipt-info {
            font-size: 8pt;
            margin: 1px 0;
            font-weight: bold;
        }
        .items-section {
            margin-top: 2px;
        }
        .item-row { 
            margin: 1px 0;
            font-size: 9pt;
            font-weight: bold;
        }
        .item-line {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .item-info {
            flex: 1;
            padding-right: 5px;
            word-wrap: break-word;
        }
        .item-price { 
            font-weight: bold;
            font-size: 9pt;
            white-space: nowrap;
        }
        .note { 
            font-size: 7pt; 
            color: #000; 
            margin-left: 3px;
            font-weight: bold;
        }
        .summary {
            margin-top: 2px;
        }
        .summary-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 1px 0;
            font-size: 9pt;
            font-weight: bold;
        }
        .total-row { 
            font-weight: bold; 
            border-top: 2px solid #000;
            padding-top: 2px;
            margin-top: 2px;
            font-size: 10pt;
        }
        .payment-section {
            margin-top: 2px;
            border-top: 1px dashed #000;
            padding-top: 2px;
        }
        .member { 
            text-align: center; 
            font-size: 8pt;
            font-weight: bold;
            margin-top: 2px;
            border-top: 1px dashed #000;
            padding-top: 2px;
        }
        .footer { 
            text-align: center; 
            margin-top: 3px;
            border-top: 1px dashed #000;
            padding-top: 2px;
            padding-bottom: 5mm;
            font-size: 8pt;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${storeName}</h1>
        <div class="header-info">${storeAddress}</div>
        <div class="header-info">โทร: ${storePhone}</div>
        ${taxId ? `<div class="header-info">Tax ID: ${taxId}</div>` : ''}
    </div>
    
    <div class="thick-line"></div>
    
    <div class="receipt-info">เลขที่: #${data.orderNumber}</div>
    <div class="receipt-info">วันที่: ${formatDate(data.createdAt)}</div>
    
    <div class="line"></div>
    
    <div class="items-section">
    ${data.items.map(item => `
        <div class="item-row">
            <div class="item-line">
                <div class="item-info">${item.quantity}x ${item.product_name}</div>
                <div class="item-price">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            ${item.note ? `<div class="note">* ${item.note}</div>` : ''}
        </div>
    `).join('')}
    </div>
    
    <div class="line"></div>
    
    <div class="summary">
        <div class="summary-row">
            <span>รวม</span>
            <span>${data.subtotal.toFixed(2)} บาท</span>
        </div>
        
        ${data.pointsDiscount && data.pointsDiscount > 0 ? `
        <div class="summary-row">
            <span>ส่วนลด (แต้ม)</span>
            <span>-${data.pointsDiscount.toFixed(2)} บาท</span>
        </div>` : ''}
        
        ${data.discount > 0 ? `
        <div class="summary-row">
            <span>ส่วนลดอื่นๆ</span>
            <span>-${data.discount.toFixed(2)} บาท</span>
        </div>` : ''}
        
        <div class="summary-row total-row">
            <span>รวมสุทธิ</span>
            <span>${data.total.toFixed(2)} บาท</span>
        </div>
    </div>
    
    <div class="payment-section">
        <div class="summary-row">
            <span>ชำระด้วย</span>
            <span>${data.paymentMethod === 'cash' ? 'เงินสด' : 'โอนเงิน'}</span>
        </div>
        
        ${data.paymentMethod === 'cash' && data.received ? `
        <div class="summary-row">
            <span>รับเงิน</span>
            <span>${data.received.toFixed(2)} บาท</span>
        </div>
        <div class="summary-row">
            <span>เงินทอน</span>
            <span>${(data.change || 0).toFixed(2)} บาท</span>
        </div>` : ''}
    </div>
    
    ${data.member ? `
    <div class="member">
        <div class="bold">** สมาชิก **</div>
        <div>${data.member.name}</div>
        <div>${data.member.phone}</div>
        <div>คะแนนคงเหลือ: ${data.member.points || 0} แต้ม</div>
        ${data.member.points_earned ? `<div>ได้แต้ม: ${data.member.points_earned} แต้ม</div>` : ''}
        ${data.member.points_used ? `<div>ใช้แต้ม: ${data.member.points_used} แต้ม</div>` : ''}
    </div>` : ''}
    
    <div class="footer">
        <div>${receiptFooter}</div>
        <div style="margin-top: 2px; font-size: 8pt;">กรุณาเก็บใบเสร็จไว้เป็นหลักฐาน</div>
    </div>
    
    <div style="margin-top: 10px; text-align: center; font-size: 6pt; color: #fff;">
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
        .&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                    window.close();
                };
                setTimeout(function() {
                    window.close();
                }, 3000);
            }, 200);
        };
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.close();
            }
        });
    </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    
  } catch (error) {
    console.error('Print error:', error);
    alert('เกิดข้อผิดพลาดในการพิมพ์ใบเสร็จ');
  }
}
