'use client';

import React from 'react';
import PWAInstaller from '@/components/pwa-installer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PWAInstaller />
      {children}
    </>
  );
}
