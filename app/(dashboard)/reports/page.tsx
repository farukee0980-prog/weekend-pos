'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Modal } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { getTodaySales, getTopProducts, getOrdersByDateRange, getSalesSummaryByDateRange, getSessionSales, getOrdersBySession } from '@/lib/db/orders';
import { getCurrentSession, getLastSession, openSession, closeSession, getAllSessions, StoreSession } from '@/lib/db/sessions';
import type { Order, DailySummary } from '@/lib/types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Calendar,
  Clock,
  History,
  ChevronRight,
  X,
  Banknote,
  Smartphone,
  Store,
  Power,
  PowerOff,
  CalendarClock,
  Settings
} from 'lucide-react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

interface SessionSummary {
  id?: string;
  start: string;
  end: string;
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
  cashRevenue: number;
  transferRevenue: number;
}

export default function ReportsPage() {
  // Current session stats (instead of today stats)
  const [sessionRevenue, setSessionRevenue] = useState(0);
  const [sessionOrders, setSessionOrders] = useState(0);
  const [sessionItems, setSessionItems] = useState(0);
  const [sessionCashRevenue, setSessionCashRevenue] = useState(0);
  const [sessionTransferRevenue, setSessionTransferRevenue] = useState(0);

  const [topProducts, setTopProducts] = useState<Array<{ productName: string; quantitySold: number; revenue: number }>>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastSessionSummary, setLastSessionSummary] = useState<SessionSummary | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [authMode, setAuthMode] = useState<'open' | 'close' | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const [weeklySummary, setWeeklySummary] = useState<DailySummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<DailySummary | null>(null);

  // Session history
  const [sessionHistory, setSessionHistory] = useState<StoreSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [topRes, currentSessionRes, lastSessionRes, allSessionsRes] = await Promise.all([
          getTopProducts(),
          getCurrentSession(),
          getLastSession(),
          getAllSessions(30),
        ]);

        if (topRes.error) throw new Error(topRes.error);

        setTopProducts(topRes.data || []);

        if (currentSessionRes.data) {
          setSessionId(currentSessionRes.data.id);
          setSessionStart(currentSessionRes.data.opened_at);
          
          // Load current session sales
          const sessionSalesRes = await getSessionSales(currentSessionRes.data.id);
          if (sessionSalesRes.data) {
            setSessionRevenue(sessionSalesRes.data.totalRevenue);
            setSessionOrders(sessionSalesRes.data.totalOrders);
            setSessionItems(sessionSalesRes.data.totalItems);
            setSessionCashRevenue(sessionSalesRes.data.cashRevenue);
            setSessionTransferRevenue(sessionSalesRes.data.transferRevenue);
          }

          // Load recent orders for current session
          const ordersRes = await getOrdersBySession(currentSessionRes.data.id);
          if (!ordersRes.error) {
            setRecentOrders((ordersRes.data || []).slice(0, 5));
          }
        } else {
          // No current session - reset session stats
          setSessionRevenue(0);
          setSessionOrders(0);
          setSessionItems(0);
          setSessionCashRevenue(0);
          setSessionTransferRevenue(0);
          setRecentOrders([]);
        }

        if (lastSessionRes.data) {
          setLastSessionSummary({
            id: lastSessionRes.data.id,
            start: lastSessionRes.data.opened_at,
            end: lastSessionRes.data.closed_at || lastSessionRes.data.opened_at,
            totalOrders: lastSessionRes.data.total_orders ?? 0,
            totalRevenue: lastSessionRes.data.total_revenue ?? 0,
            totalItems: lastSessionRes.data.total_items ?? 0,
            cashRevenue: (lastSessionRes.data as any).cash_revenue ?? 0,
            transferRevenue: (lastSessionRes.data as any).transfer_revenue ?? 0,
          });
        }

        if (allSessionsRes.data) {
          setSessionHistory(allSessionsRes.data);
        }

        // Weekly & Monthly summaries
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        startOfWeek.setDate(startOfWeek.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [weekRes, monthRes] = await Promise.all([
          getSalesSummaryByDateRange(startOfWeek.toISOString(), now.toISOString()),
          getSalesSummaryByDateRange(startOfMonth.toISOString(), now.toISOString()),
        ]);

        setWeeklySummary(weekRes.data || null);
        setMonthlySummary(monthRes.data || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดรายงาน');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCloseSession = async () => {
    if (!sessionStart || !sessionId) return;
    setIsClosing(true);

    try {
      const end = new Date().toISOString();
      // Use getOrdersBySession instead of getOrdersByDateRange
      const ordersRes = await getOrdersBySession(sessionId);
      if (ordersRes.error) throw new Error(ordersRes.error);

      const orders = (ordersRes.data || []).filter(o => o.status === 'completed');
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      const totalItems = orders.reduce(
        (sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0),
        0
      );

      let cashRevenue = 0;
      let transferRevenue = 0;

      orders.forEach((o) => {
        if (o.payment_method === 'cash') {
          cashRevenue += o.total;
        } else if (o.payment_method === 'transfer') {
          transferRevenue += o.total;
        }
      });

      const summary: SessionSummary = {
        start: sessionStart,
        end,
        totalOrders,
        totalRevenue,
        totalItems,
        cashRevenue,
        transferRevenue,
      };

      const closeRes = await closeSession(sessionId, {
        totalOrders,
        totalItems,
        totalRevenue,
        cashRevenue,
        transferRevenue,
      });
      if (closeRes.error) throw new Error(closeRes.error);

      setLastSessionSummary({ ...summary, id: sessionId });
      setSessionStart(null);
      setSessionId(null);
      
      // Reset current session stats
      setSessionRevenue(0);
      setSessionOrders(0);
      setSessionItems(0);
      setSessionCashRevenue(0);
      setSessionTransferRevenue(0);
      setRecentOrders([]);

      // Reload session history
      const allSessionsRes = await getAllSessions(30);
      if (allSessionsRes.data) {
        setSessionHistory(allSessionsRes.data);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('pos_session_start');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดขณะปิดร้าน');
    } finally {
      setIsClosing(false);
    }
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

  const viewSessionDetail = (session: StoreSession) => {
    setSelectedSession({
      id: session.id,
      start: session.opened_at,
      end: session.closed_at || session.opened_at,
      totalOrders: session.total_orders ?? 0,
      totalRevenue: session.total_revenue ?? 0,
      totalItems: session.total_items ?? 0,
      cashRevenue: (session as any).cash_revenue ?? 0,
      transferRevenue: (session as any).transfer_revenue ?? 0,
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="รายงาน" subtitle="สรุปยอดขายและประวัติการเปิด-ปิดร้าน" />

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Password Confirm Modal */}
        {authMode && (
          <Modal
            isOpen={true}
            onClose={() => {
              if (!isAuthSubmitting) {
                setAuthMode(null);
                setAuthPassword('');
                setAuthError(null);
              }
            }}
            title={authMode === 'open' ? 'ยืนยันการเปิดร้าน' : 'ยืนยันการปิดร้าน'}
          >
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setAuthError(null);

                if (authPassword !== ADMIN_PASSWORD) {
                  setAuthError('รหัสผ่านไม่ถูกต้อง');
                  return;
                }

                setIsAuthSubmitting(true);
                try {
                  if (authMode === 'open') {
                    const openRes = await openSession('admin');
                    if (openRes.error || !openRes.data) {
                      throw new Error(openRes.error || 'เปิดร้านไม่สำเร็จ');
                    }
                    setSessionId(openRes.data.id);
                    setSessionStart(openRes.data.opened_at);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('pos_session_start', openRes.data.opened_at);
                    }
                  } else if (authMode === 'close') {
                    await handleCloseSession();
                  }
                  setAuthMode(null);
                  setAuthPassword('');
                } catch (err: any) {
                  setAuthError(err?.message || 'เกิดข้อผิดพลาด');
                } finally {
                  setIsAuthSubmitting(false);
                }
              }}
            >
              <p className="text-sm text-gray-600">
                กรุณากรอกรหัสผ่านผู้ดูแลเพื่อ
                {authMode === 'open' ? 'เปิดร้านรอบใหม่' : 'ปิดร้านและสรุปรอบนี้'}
              </p>
              <input
                type="password"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                autoFocus
              />
              {authError && <p className="text-sm text-red-600">{authError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthSubmitting) {
                      setAuthMode(null);
                      setAuthPassword('');
                      setAuthError(null);
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-60"
                >
                  {isAuthSubmitting ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Session Detail Modal */}
        {selectedSession && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedSession(null)}
            title="รายละเอียดรอบการขาย"
            size="lg"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {formatSessionDate(selectedSession.start)} - {formatSessionDate(selectedSession.end)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{selectedSession.totalOrders}</p>
                  <p className="text-xs text-gray-500">ออเดอร์</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{selectedSession.totalItems}</p>
                  <p className="text-xs text-gray-500">รายการ</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 mx-auto mb-1 sm:mb-2" />
                  <p className="text-base sm:text-xl font-bold text-amber-600">{formatCurrency(selectedSession.totalRevenue)}</p>
                  <p className="text-xs text-gray-500">ยอดรวม</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">แยกตามช่องทางชำระ</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">เงินสด</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedSession.cashRevenue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">โอนเงิน</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedSession.transferRevenue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
              >
                ปิด
              </button>
            </div>
          </Modal>
        )}

        {/* Session History Modal */}
        {showHistory && (
          <Modal
            isOpen={true}
            onClose={() => setShowHistory(false)}
            title="ประวัติการเปิด-ปิดร้าน"
            size="lg"
          >
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessionHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ยังไม่มีประวัติ</p>
              ) : (
                sessionHistory.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      viewSessionDetail(session);
                      setShowHistory(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(session.opened_at).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.opened_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - {session.closed_at ? new Date(session.closed_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-semibold text-amber-600">{formatCurrency(session.total_revenue ?? 0)}</p>
                      <p className="text-xs text-gray-500">{session.total_orders ?? 0} ออเดอร์</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
            >
              ปิด
            </button>
          </Modal>
        )}

        {/* Shop Status Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  สถานะร้าน
                </p>
                {sessionStart ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                    <Power className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">เปิดอยู่</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                    <PowerOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">ปิดอยู่</span>
                  </div>
                )}
              </div>
              {sessionStart && (
                <div className="flex items-center gap-2 text-xs text-gray-600 px-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>เปิดตั้งแต่ {new Date(sessionStart).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  <span>ประวัติ</span>
                </button>
                {!sessionStart ? (
                  <button
                    onClick={() => {
                      setAuthMode('open');
                      setAuthPassword('');
                      setAuthError(null);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    <span>เปิดร้าน</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('close');
                      setAuthPassword('');
                      setAuthError(null);
                    }}
                    disabled={isClosing}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <PowerOff className="w-4 h-4" />
                    <span>{isClosing ? 'กำลังปิด...' : 'ปิดร้าน'}</span>
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Session Summary */}
        {lastSessionSummary && !sessionStart && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">สรุปรอบล่าสุด</p>
                <button
                  onClick={() => setSelectedSession(lastSessionSummary)}
                  className="text-xs text-amber-600 hover:underline"
                >
                  ดูรายละเอียด
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {formatSessionDate(lastSessionSummary.start)} - {formatSessionDate(lastSessionSummary.end)}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">ออเดอร์</p>
                  <p className="text-lg font-bold text-gray-900">{lastSessionSummary.totalOrders}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">ยอดรวม</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(lastSessionSummary.totalRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">เงินสด</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(lastSessionSummary.cashRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">โอน</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(lastSessionSummary.transferRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && !error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">กำลังโหลดข้อมูลรายงาน...</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Current Session */}
        {sessionStart && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-gray-900">ยอดรอบนี้</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-amber-50">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">ยอดขาย</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-600 truncate">{formatCurrency(sessionRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">ออเดอร์</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{sessionOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-green-50">
                  <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">เงินสด</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 truncate">{formatCurrency(sessionCashRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-blue-50">
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">โอน</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600 truncate">{formatCurrency(sessionTransferRevenue)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* Weekly & Monthly Summary */}
        {(weeklySummary || monthlySummary) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklySummary && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    สรุปสัปดาห์นี้
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ยอดรวม</span>
                      <span className="text-sm font-semibold text-amber-600">{formatCurrency(weeklySummary.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ออเดอร์</span>
                      <span className="text-sm text-gray-900">{weeklySummary.total_orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">เงินสด</span>
                      <span className="text-sm text-green-600">{formatCurrency(weeklySummary.payment_breakdown.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">โอน</span>
                      <span className="text-sm text-blue-600">{formatCurrency(weeklySummary.payment_breakdown.transfer)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {monthlySummary && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-purple-600" />
                    สรุปเดือนนี้
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ยอดรวม</span>
                      <span className="text-sm font-semibold text-amber-600">{formatCurrency(monthlySummary.total_revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">ออเดอร์</span>
                      <span className="text-sm text-gray-900">{monthlySummary.total_orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">เงินสด</span>
                      <span className="text-sm text-green-600">{formatCurrency(monthlySummary.payment_breakdown.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">โอน</span>
                      <span className="text-sm text-blue-600">{formatCurrency(monthlySummary.payment_breakdown.transfer)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Top Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                สินค้าขายดี
              </h3>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
                ) : (
                  topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-700 font-semibold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                          <p className="text-xs text-gray-500">{product.quantitySold} ชิ้น</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                ออเดอร์รอบนี้
              </h3>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">{sessionStart ? 'ยังไม่มีออเดอร์ในรอบนี้' : 'ยังไม่ได้เปิดร้าน'}</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{order.order_number.slice(-6)}</p>
                        <p className="text-xs text-gray-500">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} รายการ · {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Link - Mobile Only */}
        <div className="md:hidden">
          <Link href="/settings">
            <Card className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-100 rounded-xl">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">ตั้งค่า</p>
                      <p className="text-xs text-gray-500">ข้อมูลร้าน, แต้มสะสม, ลบข้อมูล</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}