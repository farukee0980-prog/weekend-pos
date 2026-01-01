'use client';

import React, { useEffect, useState } from 'react';
import { Search, Eye, Printer, Filter, Clock, ShoppingCart, DollarSign, CheckCircle, XCircle, Store, ChevronRight, ChevronDown, Banknote, Smartphone, Circle, List, Calendar, Info } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Modal } from '@/components/ui';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Order, OrderStatus, PaymentMethod } from '@/lib/types';
import { getAllOrders, updateOrderStatus, getOrdersBySession, getSessionSales } from '@/lib/db/orders';
import { getCurrentSession, getAllSessions, StoreSession } from '@/lib/db/sessions';
import { printReceipt, ReceiptData } from '@/components/pos';

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'สำเร็จ', variant: 'success' },
  pending: { label: 'รอดำเนินการ', variant: 'warning' },
  cancelled: { label: 'ยกเลิก', variant: 'danger' },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  transfer: 'โอนเงิน',
};

interface SessionWithOrders extends StoreSession {
  orders: Order[];
  cashRevenue?: number;
  transferRevenue?: number;
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelingOrder, setCancelingOrder] = useState<Order | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionWithOrders | null>(null);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Session-based data
  const [currentSession, setCurrentSession] = useState<SessionWithOrders | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionWithOrders[]>([]);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string | 'current' | 'all'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        // Load current session
        const currentSessionRes = await getCurrentSession();
        
        if (currentSessionRes.data) {
          const ordersRes = await getOrdersBySession(currentSessionRes.data.id);
          const salesRes = await getSessionSales(currentSessionRes.data.id);
          
          setCurrentSession({
            ...currentSessionRes.data,
            orders: ordersRes.data || [],
            total_orders: salesRes.data?.totalOrders ?? 0,
            total_revenue: salesRes.data?.totalRevenue ?? 0,
            total_items: salesRes.data?.totalItems ?? 0,
            cash_revenue: salesRes.data?.cashRevenue ?? 0,
            transfer_revenue: salesRes.data?.transferRevenue ?? 0,
          });
        }

        // Load past sessions
        const allSessionsRes = await getAllSessions(30);
        if (allSessionsRes.data) {
          const sessionsWithOrders = await Promise.all(
            allSessionsRes.data.map(async (session) => {
              const ordersRes = await getOrdersBySession(session.id);
              return {
                ...session,
                orders: ordersRes.data || [],
              };
            })
          );
          setPastSessions(sessionsWithOrders);
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

  // Get orders based on selected filter
  const getFilteredOrders = () => {
    let orders: Order[] = [];

    if (selectedSessionFilter === 'current' && currentSession) {
      orders = currentSession.orders;
    } else if (selectedSessionFilter === 'all') {
      orders = [
        ...(currentSession?.orders || []),
        ...pastSessions.flatMap(s => s.orders)
      ];
    } else {
      const session = pastSessions.find(s => s.id === selectedSessionFilter);
      if (session) {
        orders = session.orders;
      }
    }

    // Apply search and status filter
    return orders.filter((order) => {
      const matchesSearch = order.order_number.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const filteredOrders = getFilteredOrders();

  // Current session stats
  const currentStats = {
    totalOrders: currentSession?.total_orders ?? 0,
    totalRevenue: currentSession?.total_revenue ?? 0,
    completedOrders: currentSession?.orders?.filter(o => o.status === 'completed').length ?? 0,
    pendingOrders: currentSession?.orders?.filter(o => o.status === 'pending').length ?? 0,
    cashRevenue: currentSession?.cash_revenue ?? 0,
    transferRevenue: currentSession?.transfer_revenue ?? 0,
  };

  const reloadOrders = async () => {
    try {
      if (currentSession) {
        const ordersRes = await getOrdersBySession(currentSession.id);
        const salesRes = await getSessionSales(currentSession.id);
        setCurrentSession({
          ...currentSession,
          orders: ordersRes.data || [],
          total_orders: salesRes.data?.totalOrders ?? 0,
          total_revenue: salesRes.data?.totalRevenue ?? 0,
          total_items: salesRes.data?.totalItems ?? 0,
          cash_revenue: salesRes.data?.cashRevenue ?? 0,
          transfer_revenue: salesRes.data?.transferRevenue ?? 0,
        });
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

  const handlePrintOrder = (order: Order) => {
    const receiptData: ReceiptData = {
      orderNumber: order.order_number,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.payment_method,
      createdAt: order.created_at,
    };
    printReceipt(receiptData);
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedSessionInfo = () => {
    if (selectedSessionFilter === 'current' && currentSession) {
      return {
        label: 'รอบปัจจุบัน',
        start: currentSession.opened_at,
        end: null,
        totalOrders: currentStats.totalOrders,
        totalRevenue: currentStats.totalRevenue,
        cashRevenue: currentStats.cashRevenue,
        transferRevenue: currentStats.transferRevenue,
      };
    } else if (selectedSessionFilter === 'all') {
      const allOrders = [
        ...(currentSession?.orders || []),
        ...pastSessions.flatMap(s => s.orders)
      ];
      const completedOrders = allOrders.filter(o => o.status === 'completed');
      return {
        label: 'ทุกรอบ',
        start: null,
        end: null,
        totalOrders: allOrders.length,
        totalRevenue: completedOrders.reduce((sum, o) => sum + o.total, 0),
        cashRevenue: completedOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total, 0),
        transferRevenue: completedOrders.filter(o => o.payment_method === 'transfer').reduce((sum, o) => sum + o.total, 0),
      };
    } else {
      const session = pastSessions.find(s => s.id === selectedSessionFilter);
      if (session) {
        return {
          label: formatSessionDate(session.opened_at),
          start: session.opened_at,
          end: session.closed_at,
          totalOrders: session.total_orders ?? 0,
          totalRevenue: session.total_revenue ?? 0,
          cashRevenue: session.cash_revenue ?? 0,
          transferRevenue: session.transfer_revenue ?? 0,
        };
      }
    }
    return null;
  };

  const sessionInfo = getSelectedSessionInfo();

  return (
    <div className="flex flex-col h-screen">
      <Header title="ประวัติออเดอร์" subtitle="ดูและจัดการออเดอร์ตามรอบการขาย" />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Current Session Stats */}
        {currentSession && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Store className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">รอบปัจจุบัน</p>
                    <p className="text-xs text-gray-500">เปิดตั้งแต่ {formatSessionDate(currentSession.opened_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">กำลังเปิด</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">ออเดอร์</p>
                  <p className="text-xl font-bold text-gray-900">{currentStats.totalOrders}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">ยอดขาย</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(currentStats.totalRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">เงินสด</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(currentStats.cashRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">โอน</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(currentStats.transferRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!currentSession && !isLoadingData && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-gray-500">
                <Store className="w-5 h-5" />
                <span>ยังไม่ได้เปิดร้าน - ไปที่หน้ารายงานเพื่อเปิดร้าน</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
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

          {/* Session Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium bg-white hover:bg-gray-50 min-w-[180px]"
            >
              {selectedSessionFilter === 'all' && (
                <><List className="w-4 h-4 text-amber-600" /><span>ทุกรอบ</span></>
              )}
              {selectedSessionFilter === 'current' && (
                <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span>รอบปัจจุบัน</span></>
              )}
              {selectedSessionFilter !== 'all' && selectedSessionFilter !== 'current' && (
                <><Clock className="w-4 h-4 text-gray-500" /><span>{pastSessions.find(s => s.id === selectedSessionFilter) ? new Date(pastSessions.find(s => s.id === selectedSessionFilter)!.opened_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : 'เลือกรอบ'}</span></>
              )}
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", showSessionDropdown && "rotate-180")} />
            </button>

            {showSessionDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSessionDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1 max-h-72 overflow-y-auto">
                  {/* All */}
                  <button
                    onClick={() => { setSelectedSessionFilter('all'); setShowSessionDropdown(false); }}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left", selectedSessionFilter === 'all' && "bg-amber-50")}
                  >
                    <List className="w-4 h-4 text-amber-600" />
                    <span className="flex-1">ทุกรอบ</span>
                    <span className="text-xs text-gray-500">{pastSessions.length + (currentSession ? 1 : 0)} รอบ</span>
                  </button>

                  {/* Current */}
                  {currentSession && (
                    <button
                      onClick={() => { setSelectedSessionFilter('current'); setShowSessionDropdown(false); }}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-t", selectedSessionFilter === 'current' && "bg-green-50")}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="flex-1">รอบปัจจุบัน</span>
                      <span className="text-xs text-green-600 font-medium">{formatCurrency(currentSession.total_revenue ?? 0)}</span>
                    </button>
                  )}

                  {/* Past Sessions */}
                  {pastSessions.length > 0 && (
                    <div className="border-t">
                      <div className="px-3 py-1.5 text-xs text-gray-500 bg-gray-50">รอบที่ผ่านมา</div>
                      {pastSessions.slice(0, 10).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => { setSelectedSessionFilter(session.id); setShowSessionDropdown(false); }}
                          className={cn("w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left", selectedSessionFilter === session.id && "bg-blue-50")}
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 text-sm">{new Date(session.opened_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                          <span className="text-xs text-gray-500">{formatCurrency(session.total_revenue ?? 0)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* View All */}
                  <button
                    onClick={() => { setShowSessionsList(true); setShowSessionDropdown(false); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 border-t"
                  >
                    <Calendar className="w-4 h-4" />
                    ดูทุกรอบ
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
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
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
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
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <XCircle className="w-4 h-4" />
              ยกเลิก
            </button>
          </div>
        </div>

        {/* Selected Session Info */}
        {sessionInfo && selectedSessionFilter !== 'current' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{sessionInfo.label}</p>
                  {sessionInfo.start && sessionInfo.end && (
                    <p className="text-xs text-gray-500">
                      {formatSessionDate(sessionInfo.start)} - {formatSessionDate(sessionInfo.end)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">{sessionInfo.totalOrders} ออเดอร์</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(sessionInfo.totalRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                          <button 
                            onClick={() => handlePrintOrder(order)}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" 
                            title="พิมพ์"
                          >
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
                    <button 
                      onClick={() => handlePrintOrder(order)}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
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
                <p>ไม่พบออเดอร์ในรอบนี้</p>
                <p className="text-sm mt-1">ลองเปลี่ยนรอบหรือตัวกรองสถานะ</p>
              </div>
            )}
            </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onPrint={handlePrintOrder} />
      )}

      {/* Sessions List Modal */}
      {showSessionsList && (
        <SessionsListModal
          currentSession={currentSession}
          pastSessions={pastSessions}
          onClose={() => setShowSessionsList(false)}
          onSelectSession={(session) => {
            setSelectedSession(session);
            setShowSessionsList(false);
          }}
          onFilterSession={(sessionId) => {
            setSelectedSessionFilter(sessionId);
            setShowSessionsList(false);
          }}
          formatSessionDate={formatSessionDate}
        />
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          formatSessionDate={formatSessionDate}
        />
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

// Sessions List Modal
interface SessionsListModalProps {
  currentSession: SessionWithOrders | null;
  pastSessions: SessionWithOrders[];
  onClose: () => void;
  onSelectSession: (session: SessionWithOrders) => void;
  onFilterSession: (sessionId: string) => void;
  formatSessionDate: (dateStr: string) => string;
}

function SessionsListModal({ 
  currentSession, 
  pastSessions, 
  onClose, 
  onSelectSession, 
  onFilterSession,
  formatSessionDate 
}: SessionsListModalProps) {
  const allSessions = [
    ...(currentSession ? [{ ...currentSession, isCurrent: true }] : []),
    ...pastSessions.map(s => ({ ...s, isCurrent: false }))
  ];

  const totalRevenue = allSessions.reduce((sum, s) => sum + (s.total_revenue ?? 0), 0);
  const totalOrders = allSessions.reduce((sum, s) => sum + (s.total_orders ?? 0), 0);

  return (
    <Modal isOpen={true} onClose={onClose} title="ประวัติรอบการขาย" size="lg">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-xs text-amber-700">รอบทั้งหมด</p>
            <p className="text-xl font-bold text-amber-600">{allSessions.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-700">ออเดอร์รวม</p>
            <p className="text-xl font-bold text-green-600">{totalOrders}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-700">ยอดขายรวม</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Sessions List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {allSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีประวัติรอบการขาย</p>
            </div>
          ) : (
            allSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  session.isCurrent 
                    ? "border-green-200 bg-green-50" 
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {session.isCurrent ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700">กำลังเปิด</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-xs font-medium text-gray-600">ปิดแล้ว</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-amber-600">
                    {formatCurrency(session.total_revenue ?? 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-900 font-medium">
                      {formatSessionDate(session.opened_at)}
                    </p>
                    {session.closed_at && (
                      <p className="text-xs text-gray-500">
                        ปิด: {formatSessionDate(session.closed_at)}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-gray-600">
                    <p>{session.total_orders ?? 0} ออเดอร์</p>
                    <p className="text-xs">{session.total_items ?? 0} ชิ้น</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onFilterSession(session.isCurrent ? 'current' : session.id)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    ดูออเดอร์
                  </button>
                  <button
                    onClick={() => onSelectSession(session)}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          ปิด
        </Button>
      </div>
    </Modal>
  );
}

// Session Detail Modal
interface SessionDetailModalProps {
  session: SessionWithOrders;
  onClose: () => void;
  formatSessionDate: (dateStr: string) => string;
}

function SessionDetailModal({ session, onClose, formatSessionDate }: SessionDetailModalProps) {
  const completedOrders = session.orders?.filter(o => o.status === 'completed') || [];
  const cancelledOrders = session.orders?.filter(o => o.status === 'cancelled') || [];
  
  const cashRevenue = completedOrders
    .filter(o => o.payment_method === 'cash')
    .reduce((sum, o) => sum + o.total, 0);
  const transferRevenue = completedOrders
    .filter(o => o.payment_method === 'transfer')
    .reduce((sum, o) => sum + o.total, 0);

  // Calculate duration
  const startTime = new Date(session.opened_at);
  const endTime = session.closed_at ? new Date(session.closed_at) : new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Modal isOpen={true} onClose={onClose} title="รายละเอียดรอบการขาย" size="lg">
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">สถานะ</p>
            {!session.closed_at ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-semibold text-green-700">กำลังเปิด</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="font-semibold text-gray-700">ปิดแล้ว</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">ระยะเวลา</p>
            <p className="font-semibold text-gray-900">{durationHours} ชม. {durationMinutes} นาที</p>
          </div>
        </div>

        {/* Time */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">เปิดร้าน</p>
              <p className="font-medium text-gray-900">{formatSessionDate(session.opened_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ปิดร้าน</p>
              <p className="font-medium text-gray-900">
                {session.closed_at ? formatSessionDate(session.closed_at) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700">ยอดขายรวม</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(session.total_revenue ?? 0)}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">จำนวนออเดอร์</p>
            <p className="text-2xl font-bold text-blue-600">{session.total_orders ?? 0}</p>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="p-4 border border-gray-200 rounded-lg space-y-3">
          <p className="font-semibold text-gray-900">แยกตามช่องทางชำระ</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">เงินสด</span>
            </div>
            <span className="font-semibold text-green-600">{formatCurrency(cashRevenue)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">โอนเงิน</span>
            </div>
            <span className="font-semibold text-blue-600">{formatCurrency(transferRevenue)}</span>
          </div>
        </div>

        {/* Orders Breakdown */}
        <div className="p-4 border border-gray-200 rounded-lg space-y-3">
          <p className="font-semibold text-gray-900">สถานะออเดอร์</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">สำเร็จ</span>
            </div>
            <span className="font-semibold text-gray-900">{completedOrders.length} รายการ</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-gray-700">ยกเลิก</span>
            </div>
            <span className="font-semibold text-gray-900">{cancelledOrders.length} รายการ</span>
          </div>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          ปิด
        </Button>
      </div>
    </Modal>
  );
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onPrint: (order: Order) => void;
}

function OrderDetailModal({ order, onClose, onPrint }: OrderDetailModalProps) {
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
          <Button onClick={() => onPrint(order)} className="flex-1">
            <Printer className="w-5 h-5" />
            พิมพ์ใบเสร็จ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
