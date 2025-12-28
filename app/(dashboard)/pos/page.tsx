'use client';

import React, { useState } from 'react';
import { Header, MobileHeader, BottomNav } from '@/components/layout';
import { ProductGrid, Cart, MobilePaymentSheet, PaymentSuccessSheet } from '@/components/pos';
import { useCart } from '@/hooks/use-cart';
import { demoProducts, demoCategories } from '@/lib/demo-data';
import { PaymentMethod } from '@/lib/types';
import { generateOrderNumber } from '@/lib/utils';
import { StaffGuard } from '@/components/auth/staff-guard';

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderNumber: string;
    total: number;
    paymentMethod: PaymentMethod;
    received: number;
  } | null>(null);

  const cart = useCart();

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentConfirm = (paymentMethod: PaymentMethod, received: number) => {
    const orderNumber = generateOrderNumber();

    // TODO: Save order to database

    setLastOrder({
      orderNumber,
      total: cart.total,
      paymentMethod,
      received,
    });

    setIsPaymentOpen(false);
    setIsSuccessOpen(true);
  };

  const handleNewOrder = () => {
    cart.clearCart();
    setIsSuccessOpen(false);
    setLastOrder(null);
  };

  const handlePrint = () => {
    // TODO: Implement print receipt
    window.print();
  };

  return (
    <StaffGuard>
    <div className="flex flex-col h-screen pb-16 md:pb-0">
      {/* Desktop header */}
      <div className="hidden md:block">
        <Header title="POS" subtitle="ระบบขายหน้าร้าน" />
      </div>
      {/* Mobile header */}
      <div className="md:hidden">
        <MobileHeader title="POS" />
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Product Grid */}
        <div className="flex-1 overflow-hidden">
          <ProductGrid
            products={demoProducts}
            categories={demoCategories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onProductClick={cart.addItem}
          />
        </div>

        {/* Cart */}
        <div className="w-full md:w-96 flex-shrink-0 border-t md:border-t-0">
          <Cart
            items={cart.items}
            total={cart.total}
            onUpdateQuantity={cart.updateQuantity}
            onRemoveItem={cart.removeItem}
            onUpdateNote={cart.updateNote}
            onCheckout={handleCheckout}
            onClearCart={cart.clearCart}
          />
        </div>
      </div>

      {/* Mobile Payment Sheet (used for all breakpoints to match LIFF behavior) */}
      <MobilePaymentSheet
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        items={cart.items}
        total={cart.total}
        onConfirm={handlePaymentConfirm}
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
        />
      )}

      {/* Bottom navigation for mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
    </StaffGuard>
  );
}
