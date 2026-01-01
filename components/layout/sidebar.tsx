'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Package,
  ClipboardList,
  BarChart3,
  Settings,
  Coffee,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'POS', href: '/pos', icon: LayoutGrid },
  { name: 'สินค้า', href: '/products', icon: Package },
  { name: 'ออเดอร์', href: '/orders', icon: ClipboardList },
  { name: 'สมาชิก', href: '/members', icon: Users },
  { name: 'รายงาน', href: '/reports', icon: BarChart3 },
  { name: 'ตั้งค่า', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-600">
          <Coffee className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Weekend</h1>
          <p className="text-xs text-gray-500">POS System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors',
                isActive
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-amber-600' : 'text-gray-600')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-sm font-medium text-amber-700">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
            <p className="text-xs text-gray-500">แคชเชียร์</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
