'use client';

import React, { useEffect, useState } from 'react';
import { Header, MobileHeader, BottomNav } from '@/components/layout';
import { ProductGrid, Cart, MobilePaymentSheet, PaymentSuccessSheet } from '@/components/pos';
import { useCart } from '@/hooks/use-cart';
import { PaymentMethod, Product, Category, Member, PointsConfig } from '@/lib/types';
import { getAvailableProducts, getAllCategories } from '@/lib/db/products';
import { createOrder } from '@/lib/db/orders';
import { generateOrderNumber } from '@/lib/utils';
import { getCurrentSession } from '@/lib/db/sessions';
import { getPointsConfig } from '@/lib/db/settings';
import { updateMemberAfterOrder, calculatePointsFromItems } from '@/lib/db/members';
import { MemberSearch, MemberFormModal, PointsRedeemSection } from '@/components/members';
import { ShoppingBag, X } from 'lucide-react';

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderNumber: string;
    total: number;
    paymentMethod: PaymentMethod;
    received: number;
    items: typeof cart.items;
  } | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Member/Loyalty states
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [initialMemberPhone, setInitialMemberPhone] = useState('');
  const [pointsConfig, setPointsConfig] = useState<PointsConfig>({
    points_to_redeem: 100,
    redeem_value: 40,
    default_points_per_item: 1,
  });
  const [redeemCount, setRedeemCount] = useState(0);

  const cart = useCart();

  useEffect(() => {
    async function loadData() {
      try {
        const [productsRes, categoriesRes, pointsConfigRes] = await Promise.all([
          getAvailableProducts(),
          getAllCategories(),
          getPointsConfig(),
        ]);

        if (productsRes.error || categoriesRes.error) {
          setDataError(productsRes.error || categoriesRes.error || 'ไม่สามารถโหลดข้อมูลได้');
        } else {
          setProducts(productsRes.data || []);
          setCategories(categoriesRes.data || []);
        }
        
        if (pointsConfigRes.data) {
          setPointsConfig(pointsConfigRes.data);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateSessionFromLocal = () => {
      const start = localStorage.getItem('pos_session_start');
      setHasSession(!!start);
    };

    updateSessionFromLocal();

    // ตรวจสอบสถานะร้านจากฐานข้อมูลด้วย เผื่อเปลี่ยนอุปกรณ์หรือเคลียร์ localStorage
    (async () => {
      try {
        const res = await getCurrentSession();
        if (res.data) {
          setHasSession(true);
          localStorage.setItem('pos_session_start', res.data.opened_at);
        } else {
          setHasSession(false);
          localStorage.removeItem('pos_session_start');
        }
      } catch (e) {
        console.error('ตรวจสอบสถานะร้านจากฐานข้อมูลไม่สำเร็จ', e);
      }
    })();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pos_session_start') {
        setHasSession(!!e.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleCheckout = () => {
    if (!hasSession) {
      alert('กรุณาเปิดร้านที่หน้า "รายงาน" ก่อนจึงจะทำรายการขายได้');
      return;
    }

    if (cart.items.length === 0) return;
    setIsCartOpen(false);
    setIsPaymentOpen(true);
  };

  const handlePaymentConfirm = async (paymentMethod: PaymentMethod, received: number) => {
    const orderNumber = generateOrderNumber();
    
    // คำนวณส่วนลดจากแต้ม
    const pointsDiscount = redeemCount * pointsConfig.redeem_value;
    const pointsRedeemed = redeemCount * pointsConfig.points_to_redeem;
    const finalTotal = Math.max(0, cart.total - pointsDiscount);
    
    // คำนวณแต้มที่จะได้รับ
    const pointsEarned = calculatePointsFromItems(
      cart.items.map(item => ({
        points_per_item: item.product.points_per_item || pointsConfig.default_points_per_item,
        quantity: item.quantity,
      }))
    );

    try {
      const orderRes = await createOrder({
        order_number: orderNumber,
        member_id: selectedMember?.id,
        member_phone: selectedMember?.phone,
        points_earned: selectedMember ? pointsEarned : 0,
        points_redeemed: pointsRedeemed,
        points_discount: pointsDiscount,
        items: cart.items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          note: item.note,
        })) as any,
        subtotal: cart.total,
        discount: pointsDiscount,
        total: finalTotal,
        payment_method: paymentMethod,
        status: 'completed',
      } as any);

      // อัปเดตแต้มสมาชิก
      if (selectedMember && orderRes.data) {
        await updateMemberAfterOrder(
          selectedMember.id,
          finalTotal,
          pointsEarned,
          pointsRedeemed,
          orderRes.data.id
        );
      }

      setLastOrder({
        orderNumber,
        total: finalTotal,
        paymentMethod,
        received,
        items: [...cart.items],
      });

      setIsPaymentOpen(false);
      setIsSuccessOpen(true);
    } catch (error) {
      console.error('Failed to save order', error);
      alert('บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const handleNewOrder = () => {
    cart.clearCart();
    setIsSuccessOpen(false);
    setLastOrder(null);
    setSelectedMember(null);
    setRedeemCount(0);
  };

  const handleAddNewMember = (phone?: string) => {
    setInitialMemberPhone(phone || '');
    setIsAddMemberModalOpen(true);
  };

  const handleMemberAdded = (member: Member) => {
    setSelectedMember(member);
    setIsAddMemberModalOpen(false);
  };

  // Reset redeem count when member changes
  useEffect(() => {
    setRedeemCount(0);
  }, [selectedMember]);

  return (
    <div className="flex flex-col h-screen pb-16 md:pb-0">
      {isLoadingData && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      )}

      {!isLoadingData && dataError && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{dataError}</p>
        </div>
      )}

      {!isLoadingData && !dataError && (
        <>
          {/* Desktop header */}
          <div className="hidden md:block">
            <Header title="POS" subtitle="ระบบขายหน้าร้าน" />
          </div>
          {/* Mobile header */}
          <div className="md:hidden">
            <MobileHeader title="POS" />
          </div>

          <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
            {/* Product Grid */}
            <div className="flex-1 overflow-hidden">
              <ProductGrid
                products={products}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onProductClick={cart.addItem}
              />
            </div>

            {/* Cart Toggle Button - Mobile Only */}
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="md:hidden fixed bottom-20 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-amber-600 text-white shadow-xl hover:bg-amber-700 transition-all active:scale-95"
            >
              {isCartOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <>
                  <ShoppingBag className="w-6 h-6" />
                  {cart.items.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                      {cart.items.length}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Cart - Slide from bottom on mobile */}
            <div
              className={`
                md:w-96 md:flex-shrink-0 md:border-t-0 md:relative md:translate-y-0 md:h-auto
                fixed inset-x-0 bottom-16 z-40 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out
                ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}
                md:shadow-none md:rounded-none md:translate-y-0
                h-[calc(80vh-4rem)] md:h-full max-h-[700px]
              `}
            >
              {/* Drag Handle - Mobile */}
              <div className="md:hidden flex justify-center pt-2 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              <Cart
                items={cart.items}
                total={cart.total}
                onUpdateQuantity={cart.updateQuantity}
                onRemoveItem={cart.removeItem}
                onUpdateNote={cart.updateNote}
                onCheckout={handleCheckout}
                onClearCart={cart.clearCart}
                selectedMember={selectedMember}
                onSelectMember={setSelectedMember}
                onAddNewMember={handleAddNewMember}
              />
            </div>

            {/* Backdrop - Mobile */}
            {isCartOpen && (
              <div
                className="md:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
                onClick={() => setIsCartOpen(false)}
              />
            )}
          </div>

          {/* Mobile Payment Sheet (used for all breakpoints to match LIFF behavior) */}
          <MobilePaymentSheet
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            items={cart.items}
            total={cart.total}
            onConfirm={handlePaymentConfirm}
            selectedMember={selectedMember}
            onSelectMember={setSelectedMember}
            onAddNewMember={handleAddNewMember}
            pointsConfig={pointsConfig}
            redeemCount={redeemCount}
            onRedeemCountChange={setRedeemCount}
            pointsDiscount={redeemCount * pointsConfig.redeem_value}
          />

          {/* Add Member Modal */}
          <MemberFormModal
            isOpen={isAddMemberModalOpen}
            onClose={() => setIsAddMemberModalOpen(false)}
            onSuccess={handleMemberAdded}
            initialPhone={initialMemberPhone}
          />

          {/* Success Sheet */}
          {lastOrder && (
            <PaymentSuccessSheet
              isOpen={isSuccessOpen}
              onClose={() => setIsSuccessOpen(false)}
              orderNumber={lastOrder.orderNumber}
              total={lastOrder.total}
              paymentMethod={lastOrder.paymentMethod}
              received={lastOrder.received}
              onNewOrder={handleNewOrder}
              items={lastOrder.items}
            />
          )}

          {/* Bottom navigation for mobile */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </>
      )}
    </div>
  );
}
