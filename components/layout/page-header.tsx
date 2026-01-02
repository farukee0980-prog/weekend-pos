'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  rightContent,
  className,
  showLogo = false,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-white border-b border-gray-100',
        className
      )}
    >
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 safe-area-top">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 -ml-2 rounded-lg text-gray-600 active:bg-gray-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : showLogo ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
              <Image
                src="/weekend.jpg"
                alt="Weekend POS"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          ) : null}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
        </div>
        {rightContent && (
          <div className="flex items-center gap-2">{rightContent}</div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {rightContent && (
          <div className="flex items-center gap-3">{rightContent}</div>
        )}
      </div>
    </header>
  );
}
