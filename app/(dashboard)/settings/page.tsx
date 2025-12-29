'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Modal } from '@/components/ui';
import { Store, Save, Printer, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [footerMessage, setFooterMessage] = useState('ขอบคุณที่ใช้บริการ');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('key, value')
        .in('key', ['store_name', 'store_address', 'store_phone', 'tax_id', 'footer_message']);

      if (data) {
        data.forEach((item: any) => {
          if (item.key === 'store_name') setStoreName(item.value || '');
          if (item.key === 'store_address') setStoreAddress(item.value || '');
          if (item.key === 'store_phone') setStorePhone(item.value || '');
          if (item.key === 'tax_id') setTaxId(item.value || '');
          if (item.key === 'footer_message') setFooterMessage(item.value || 'ขอบคุณที่ใช้บริการ');
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const settings = [
        { key: 'store_name', value: storeName },
        { key: 'store_address', value: storeAddress },
        { key: 'store_phone', value: storePhone },
        { key: 'tax_id', value: taxId },
        { key: 'footer_message', value: footerMessage },
      ];

      for (const setting of settings) {
        await supabase
          .from('store_settings')
          .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
      }

      alert('บันทึกการตั้งค่าสำเร็จ');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintTest = () => {
    const testReceipt = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ใบเสร็จทดสอบ</title>
        <style>
          @media print {
            @page { margin: 0; }
            body { margin: 10mm; }
          }
          body {
            font-family: 'Sarabun', 'Arial', sans-serif;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .shop-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .shop-info {
            font-size: 12px;
            margin: 2px 0;
          }
          .receipt-info {
            margin: 10px 0;
            font-size: 12px;
          }
          .items {
            margin: 10px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .summary {
            margin: 10px 0;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total {
            font-size: 16px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 12px;
            border-top: 2px dashed #000;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${storeName || 'ชื่อร้าน'}</div>
          ${storeAddress ? `<div class="shop-info">${storeAddress}</div>` : ''}
          ${storePhone ? `<div class="shop-info">โทร: ${storePhone}</div>` : ''}
          ${taxId ? `<div class="shop-info">เลขประจำตัวผู้เสียภาษี: ${taxId}</div>` : ''}
        </div>

        <div class="receipt-info">
          <div>เลขที่: TEST-001</div>
          <div>วันที่: ${new Date().toLocaleString('th-TH')}</div>
        </div>

        <div class="items">
          <div class="item">
            <span>กาแฟอเมริกาโน่ x2</span>
            <span>90.00</span>
          </div>
          <div class="item">
            <span>ชาเขียวนม x1</span>
            <span>50.00</span>
          </div>
        </div>

        <div class="summary">
          <div class="summary-row">
            <span>รวม:</span>
            <span>140.00</span>
          </div>
          <div class="summary-row total">
            <span>ยอดชำระ:</span>
            <span>140.00</span>
          </div>
          <div class="summary-row">
            <span>ชำระโดย:</span>
            <span>เงินสด</span>
          </div>
          <div class="summary-row">
            <span>รับเงิน:</span>
            <span>200.00</span>
          </div>
          <div class="summary-row">
            <span>เงินทอน:</span>
            <span>60.00</span>
          </div>
        </div>

        <div class="footer">
          <div>${footerMessage}</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(testReceipt);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      };
    }
  };

  const handleDeleteAllData = async () => {
    if (deletePassword !== ADMIN_PASSWORD) {
      setDeleteError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      // Delete all order items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (itemsError) throw itemsError;

      // Delete all orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (ordersError) throw ordersError;

      // Delete all sessions
      const { error: sessionsError } = await supabase
        .from('store_sessions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (sessionsError) throw sessionsError;

      alert('ลบข้อมูลทั้งหมดสำเร็จ');
      setShowDeleteModal(false);
      setDeletePassword('');
    } catch (err: any) {
      console.error('Error deleting data:', err);
      setDeleteError('เกิดข้อผิดพลาดในการลบข้อมูล: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Header title="ตั้งค่า" subtitle="ตั้งค่าร้านค้าและใบเสร็จ" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="ตั้งค่า" subtitle="ตั้งค่าร้านค้าและใบเสร็จ" />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) {
              setShowDeleteModal(false);
              setDeletePassword('');
              setDeleteError('');
            }
          }}
          title="ยืนยันการลบข้อมูลทั้งหมด"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-semibold mb-1">⚠️ คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                <p>การลบข้อมูลจะลบ:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>ออเดอร์ทั้งหมด</li>
                  <li>รายการสินค้าในออเดอร์</li>
                  <li>ประวัติการเปิด-ปิดร้าน</li>
                </ul>
                <p className="mt-2 font-medium">สินค้าและหมวดหมู่จะไม่ถูกลบ</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                กรุณากรอกรหัสผ่านผู้ดูแลเพื่อยืนยัน
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                autoFocus
                disabled={isDeleting}
              />
            </div>

            {deleteError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  if (!isDeleting) {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }
                }}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleDeleteAllData}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isDeleting || !deletePassword}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบข้อมูล'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Store Settings */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Store className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">ข้อมูลร้านค้า</h2>
                <p className="text-sm text-gray-500">ข้อมูลที่แสดงบนใบเสร็จ</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ชื่อร้าน *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="เช่น ร้านกาแฟฟรีดอม"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ที่อยู่
                </label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="เช่น 123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="0X-XXXX-XXXX"
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    เลขประจำตัวผู้เสียภาษี
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  ข้อความท้ายใบเสร็จ
                </label>
                <input
                  type="text"
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  placeholder="เช่น ขอบคุณที่ใช้บริการ"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handlePrintTest}
            variant="outline"
            className="flex-1 sm:flex-initial"
          >
            <Printer className="w-5 h-5 mr-2" />
            ทดสอบพิมพ์ใบเสร็จ
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !storeName}
            className="flex-1 sm:flex-initial"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>

        {/* Danger Zone */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Danger Zone</h2>
                <p className="text-sm text-gray-500">การกระทำเหล่านี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">ลบข้อมูลทั้งหมด</h3>
                  <p className="text-sm text-gray-600">
                    ลบออเดอร์และประวัติการขายทั้งหมดอย่างถาวร (สินค้าและหมวดหมู่จะไม่ถูกลบ)
                  </p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  ลบข้อมูลทั้งหมด
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
