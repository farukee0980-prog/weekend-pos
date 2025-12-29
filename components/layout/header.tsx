'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = formatDate(new Date());

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center">
        {/* Date */}
        <span className="text-xs md:text-sm text-gray-500">{today}</span>
      </div>
    </header>
  );
}
