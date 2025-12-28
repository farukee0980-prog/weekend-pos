'use client';

import { useState, useCallback } from 'react';
import { CartItem, Product } from '@/lib/types';
import { calculateCartTotal } from '@/lib/utils';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const updateNote = useCallback((productId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, note } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = calculateCartTotal(
    items.map((item) => ({ price: item.product.price, quantity: item.quantity }))
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    updateNote,
    clearCart,
  };
}
