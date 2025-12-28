'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { Store, Users, Save, Plus, Trash2, Coffee, AlertCircle } from 'lucide-react';

// Demo store config - replace with real data from database
const initialStoreConfig = {
  name: 'Freedome Coffee',
  address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  phone: '02-123-4567',
  taxId: '0-1234-56789-01-2',
};

// Demo staff list - replace with real data from env/database
const initialStaff = [
  { id: '1', lineUserId: 'U1234567890abcdef', name: 'Admin', role: 'เจ้าของ' },
  { id: '2', lineUserId: 'U2345678901bcdefg', name: 'Staff 1', role: 'พนักงาน' },
];

export default function SettingsPage() {
  const [storeConfig, setStoreConfig] = useState(initialStoreConfig);
  const [staff, setStaff] = useState(initialStaff);
  const [newStaffId, setNewStaffId] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveStore = () => {
    // TODO: Save to database
    console.log('Saving store config:', storeConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddStaff = () => {
    if (!newStaffId.trim()) return;
    if (!newStaffId.startsWith('U')) {
      alert('LINE User ID ต้องขึ้นต้นด้วย "U"');
      return;
    }
    // TODO: Save to env/database
    const newStaff = {
      id: Date.now().toString(),
      lineUserId: newStaffId.trim(),
      name: 'ไม่ระบุ',
      role: 'พนักงาน',
    };
    setStaff([...staff, newStaff]);
    setNewStaffId('');
  };

  const handleRemoveStaff = (id: string) => {
    if (staff.length <= 1) {
      alert('ต้องมีพนักงานอย่างน้อย 1 คน');
      return;
    }
    // TODO: Remove from env/database
    setStaff(staff.filter((s) => s.id !== id));
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="ตั้งค่า" subtitle="ปรับแต่งระบบและข้อมูลร้าน" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Store Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-600" />
              ข้อมูลร้าน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อร้าน
              </label>
              <Input
                value={storeConfig.name}
                onChange={(e) => setStoreConfig({ ...storeConfig, name: e.target.value })}
                placeholder="ชื่อร้าน"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ที่อยู่
              </label>
              <textarea
                value={storeConfig.address}
                onChange={(e) => setStoreConfig({ ...storeConfig, address: e.target.value })}
                placeholder="ที่อยู่ร้าน"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์
                </label>
                <Input
                  value={storeConfig.phone}
                  onChange={(e) => setStoreConfig({ ...storeConfig, phone: e.target.value })}
                  placeholder="02-XXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลขประจำตัวผู้เสียภาษี
                </label>
                <Input
                  value={storeConfig.taxId}
                  onChange={(e) => setStoreConfig({ ...storeConfig, taxId: e.target.value })}
                  placeholder="X-XXXX-XXXXX-XX-X"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {isSaved && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ บันทึกแล้ว
                </span>
              )}
              <Button onClick={handleSaveStore} className="ml-auto">
                <Save className="w-4 h-4 mr-2" />
                บันทึกการตั้งค่า
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              จัดการพนักงาน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Staff */}
            <div className="flex gap-2">
              <Input
                value={newStaffId}
                onChange={(e) => setNewStaffId(e.target.value)}
                placeholder="LINE User ID (เช่น U1234567890abcdef)"
                className="flex-1"
              />
              <Button onClick={handleAddStaff}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม
              </Button>
            </div>

            {/* Staff List */}
            <div className="space-y-2">
              {staff.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                      <Coffee className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.name}
                        {index === 0 && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">
                            (คุณ)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.lineUserId}</p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  {staff.length > 1 && (
                    <button
                      onClick={() => handleRemoveStaff(member.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">วิธีหา LINE User ID:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>เปิดแอป POS ผ่าน LIFF</li>
                  <li>พนักงานที่ต้องการเพิ่มต้องพยายามเข้าใช้งาน</li>
                  <li>ระบบจะแสดง LINE userId ให้คัดลอก</li>
                  <li>นำมาใส่ในช่องด้านบนและกดเพิ่ม</li>
                </ol>
                <p className="mt-2 text-xs">
                  <strong>หมายเหตุ:</strong> ข้อมูลพนักงานจะถูกบันทึกใน environment variable <code className="bg-blue-100 px-1 py-0.5 rounded">NEXT_PUBLIC_STAFF_LINE_USER_IDS</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Note */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              💡 <span className="font-medium">หมายเหตุ:</span> ข้อมูลที่แสดงเป็นข้อมูลตัวอย่าง 
              เมื่อเชื่อมต่อฐานข้อมูลจะบันทึกข้อมูลจริง
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
