'use client';

import React, { useEffect, useState } from 'react';
import { Search, Eye, Printer, Filter, Calendar, ChevronDown, ShoppingCart, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Modal } from '@/components/ui';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { getAllOrders, updateOrderStatus } from '@/lib/db/orders';

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'สำเร็จ', variant: 'success' },
  pending: { label: 'รอดำเนินการ', variant: 'warning' },
  cancelled: { label: 'ยกเลิก', variant: 'danger' },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAllOrders();
        if (res.error) {
          setDataError(res.error);
        } else {
          setOrders(res.data || []);
        }
      } catch (err) {
        console.error(err);
        setDataError('เกิดข้อผิดพลาดขณะโหลดข้อมูล');
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.order_number.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const reloadOrders = async () => {
    try {
      const res = await getAllOrders();
      if (!res.error) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelingOrder) return;
    try {
      const res = await updateOrderStatus(cancelingOrder.id, 'cancelled');
      if (!res.error) {
        await reloadOrders();
      } else {
        alert('ไม่สามารถยกเลิกออเดอร์ได้');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setCancelingOrder(null);
    }
  };

  const todayStats = {
    totalOrders: orders.length,
    totalRevenue: orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    completedOrders: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="ประวัติออเดอร์" subtitle="ดูและจัดการออเดอร์ทั้งหมด" />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Today Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="p-2 md:p-3 rounded-xl bg-blue-50">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600">ออเดอร์วันนี้</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{todayStats.totalOrders}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="p-2 md:p-3 rounded-xl bg-amber-50">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">ยอดขายวันนี้</p>
                <p className="text-xl md:text-2xl font-bold text-amber-600 truncate">{formatCurrency(todayStats.totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="p-2 md:p-3 rounded-xl bg-green-50">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600">สำเร็จ</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">{todayStats.completedOrders}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="ค้นหาเลขออเดอร์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
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
            <button
              onClick={() => setStatusFilter('completed')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              สำเร็จ
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <XCircle className="w-4 h-4" />
              ยกเลิก
            </button>
          </div>

          <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors whitespace-nowrap">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">วันนี้</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Orders List */}
        <Card>
          <CardContent className="p-0">
            {isLoadingData && (
              <div className="flex items-center justify-center py-8 text-gray-500">
                กำลังโหลดข้อมูลออเดอร์...
              </div>
            )}

            {!isLoadingData && dataError && (
              <div className="flex items-center justify-center py-8 text-red-500">
                {dataError}
              </div>
            )}

            {!isLoadingData && !dataError && (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                            className="p-2 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="พิมพ์">
                            <Printer className="w-4 h-4" />
                          </button>
                          {order.status === 'completed' && (
                            <button
                              onClick={() => setCancelingOrder(order)}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="ยกเลิก"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-sm font-semibold text-gray-900">#{order.order_number.slice(-8)}</span>
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
                    </div>
                    <Badge variant={statusConfig[order.status].variant}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</span>
                      <span>•</span>
                      <span>{paymentMethodLabels[order.payment_method]}</span>
                    </div>
                    <p className="text-lg font-bold text-amber-600">{formatCurrency(order.total)}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100"
                    >
                      <Eye className="w-4 h-4" />
                      ดูรายละเอียด
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                      <Printer className="w-4 h-4" />
                    </button>
                    {order.status === 'completed' && (
                      <button
                        onClick={() => setCancelingOrder(order)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Filter className="w-12 h-12 mb-2" />
                <p>ไม่พบออเดอร์</p>
              </div>
            )}
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Cancel Confirm Modal */}
      {cancelingOrder && (
        <Modal isOpen={true} onClose={() => setCancelingOrder(null)} title="ยืนยันการยกเลิก">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 shrink-0" />
              <div>
                <p className="font-medium text-red-900">คุณต้องการยกเลิกออเดอร์นี้ใช่หรือไม่?</p>
                <p className="text-sm text-red-700 mt-1">ออเดอร์ <strong>#{cancelingOrder.order_number.slice(-8)}</strong></p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              การยกเลิกจะไม่สามารถย้อนกลับได้ และจะส่งผลต่อรายงานยอดขาย
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCancelingOrder(null)} className="flex-1">
                ยกเลิก
              </Button>
              <Button onClick={handleCancelOrder} className="flex-1 bg-red-600 hover:bg-red-700">
                ยืนยันยกเลิกออเดอร์
              </Button>
            </div>
          </div>
        </Modal>
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
