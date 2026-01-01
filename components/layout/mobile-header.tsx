'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function MobileHeader({ 
  title, 
  showBack = false, 
  onBack, 
  rightContent,
  className 
}: MobileHeaderProps) {
  return (
    <header className={cn(
      'sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 safe-area-top',
      className
    )}>
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 -ml-2 rounded-lg text-gray-600 active:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
            <Image
              src="/weekend.jpg"
              alt="Weekend POS"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        )}
        <h1 className="text-lg font-semibold text-gray-900">
          {title === 'POS' ? 'Weekend POS' : title}
        </h1>
      </div>

      {rightContent && (
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      )}
    </header>
  );
}
