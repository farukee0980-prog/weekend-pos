'use client';

import React from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui';

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Header title="รายงาน" subtitle="แดชบอร์ดรายงานยอดขาย (กำลังพัฒนา)" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-gray-600">กำลังพัฒนา ส่วนรายงานจะมาเร็วๆ นี้</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
