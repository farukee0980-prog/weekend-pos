'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';

// Demo data - replace with real data from database
const salesData = {
  today: {
    revenue: 4850,
    orders: 23,
    items: 67,
    change: 12.5
  },
  week: {
    revenue: 28500,
    orders: 145,
    items: 412,
    change: 8.3
  },
  month: {
    revenue: 125000,
    orders: 580,
    items: 1823,
    change: -3.2
  }
};

const topProducts = [
  { name: 'อเมริกาโน่เย็น', sales: 145, revenue: 7250 },
  { name: 'ลาเต้ร้อน', sales: 132, revenue: 6600 },
  { name: 'คาปูชิโน่', sales: 98, revenue: 5390 },
  { name: 'เอสเปรสโซ่', sales: 87, revenue: 3480 },
  { name: 'มอคค่าเย็น', sales: 76, revenue: 4560 },
];

const recentOrders = [
  { orderNumber: '20251229-143022', total: 145, items: 3, time: '14:30' },
  { orderNumber: '20251229-142515', total: 95, items: 2, time: '14:25' },
  { orderNumber: '20251229-141033', total: 220, items: 4, time: '14:10' },
  { orderNumber: '20251229-135544', total: 75, items: 1, time: '13:55' },
  { orderNumber: '20251229-134211', total: 180, items: 3, time: '13:42' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const currentData = salesData[period];

  return (
    <div className="flex flex-col h-screen">
      <Header title="รายงาน" subtitle="แดชบอร์ดรายงานยอดขายและสถิติ" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'today'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            วันนี้
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            สัปดาห์นี้
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            เดือนนี้
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="ยอดขาย"
            value={formatCurrency(currentData.revenue)}
            change={currentData.change}
            icon={DollarSign}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="จำนวนออเดอร์"
            value={currentData.orders.toString()}
            change={currentData.change}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="จำนวนสินค้า"
            value={currentData.items.toString()}
            change={currentData.change}
            icon={Package}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                สินค้าขายดี Top 5
              </h3>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sales} รายการ</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                ออเดอร์ล่าสุด
              </h3>
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.items} รายการ · {order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">
              💡 <span className="font-medium">หมายเหตุ:</span> ข้อมูลที่แสดงเป็นข้อมูลตัวอย่าง 
              เมื่อเชื่อมต่อฐานข้อมูลจะแสดงข้อมูลจริงจากรายการขาย
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBg}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <ArrowUp className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}
