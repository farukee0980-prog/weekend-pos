'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Package,
  ClipboardList,
  BarChart3,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'POS', href: '/pos', icon: LayoutGrid },
  { name: 'สินค้า', href: '/products', icon: Package },
  { name: 'ออเดอร์', href: '/orders', icon: ClipboardList },
  { name: 'สมาชิก', href: '/members', icon: Users },
  { name: 'รายงาน', href: '/reports', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-14 sm:h-16 max-w-lg mx-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 sm:gap-1 transition-colors touch-manipulation',
                isActive
                  ? 'text-amber-600'
                  : 'text-gray-600 active:text-gray-700'
              )}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
