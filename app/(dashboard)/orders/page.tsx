'use client';

import React, { useState } from 'react';
import { Search, Eye, Printer, Filter, Calendar, ChevronDown } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Modal } from '@/components/ui';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Order, OrderStatus, PaymentMethod } from '@/lib/types';

// Demo orders
const demoOrders: Order[] = [
  {
    id: '1',
    order_number: '20251229-103045-001',
    items: [
      { id: '1', order_id: '1', product_id: '2', product_name: 'อเมริกาโน่ร้อน', price: 45, quantity: 2 },
      { id: '2', order_id: '1', product_id: '7', product_name: 'ลาเต้เย็น', price: 55, quantity: 1 },
    ],
    subtotal: 145,
    discount: 0,
    total: 145,
    payment_method: 'cash',
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_number: '20251229-113022-002',
    items: [
      { id: '3', order_id: '2', product_id: '18', product_name: 'กาแฟปั่น', price: 65, quantity: 2 },
      { id: '4', order_id: '2', product_id: '22', product_name: 'ครัวซองค์', price: 45, quantity: 1 },
    ],
    subtotal: 175,
    discount: 0,
    total: 175,
    payment_method: 'transfer',
    status: 'completed',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    order_number: '20251229-120155-003',
    items: [
      { id: '5', order_id: '3', product_id: '13', product_name: 'ชาไทยเย็น', price: 45, quantity: 3 },
    ],
    subtotal: 135,
    discount: 0,
    total: 135,
    payment_method: 'cash',
    status: 'pending',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'สำเร็จ', variant: 'success' },
  pending: { label: 'รอดำเนินการ', variant: 'warning' },
  cancelled: { label: 'ยกเลิก', variant: 'danger' },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
  credit_card: 'บัตรเครดิต',
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = demoOrders.filter((order) => {
    const matchesSearch = order.order_number.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayStats = {
    totalOrders: demoOrders.length,
    totalRevenue: demoOrders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    completedOrders: demoOrders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="ประวัติออเดอร์" subtitle="ดูและจัดการออเดอร์ทั้งหมด" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Today Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-sm text-gray-500">ออเดอร์วันนี้</p>
              <p className="text-3xl font-bold text-gray-900">{todayStats.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-sm text-gray-500">ยอดขายวันนี้</p>
              <p className="text-3xl font-bold text-amber-600">{formatCurrency(todayStats.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <p className="text-sm text-gray-500">สำเร็จ</p>
              <p className="text-3xl font-bold text-green-600">{todayStats.completedOrders}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเลขออเดอร์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              ทั้งหมด
            </button>
            {(Object.keys(statusConfig) as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {statusConfig[status].label}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">วันนี้</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Orders List */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">เลขออเดอร์</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">เวลา</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">รายการ</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">ยอดรวม</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">ชำระ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">สถานะ</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">#{order.order_number.slice(-8)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {paymentMethodLabels[order.payment_method]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusConfig[order.status].variant}>
                        {statusConfig[order.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Filter className="w-12 h-12 mb-2" />
                <p>ไม่พบออเดอร์</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <Modal isOpen={true} onClose={onClose} title={`ออเดอร์ #${order.order_number.slice(-8)}`} size="lg">
      <div className="space-y-4">
        {/* Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{formatDateTime(order.created_at)}</span>
          <Badge variant={statusConfig[order.status].variant}>{statusConfig[order.status].label}</Badge>
        </div>

        {/* Items */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">รายการ</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">จำนวน</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">ราคา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-gray-900">{item.product_name}</td>
                  <td className="px-4 py-2 text-center text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>รวม</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>ส่วนลด</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>ยอดชำระ</span>
            <span className="text-amber-600">{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 pt-2 border-t border-gray-200">
            <span>ชำระโดย</span>
            <span>{paymentMethodLabels[order.payment_method]}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ปิด
          </Button>
          <Button className="flex-1">
            <Printer className="w-5 h-5" />
            พิมพ์ใบเสร็จ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
