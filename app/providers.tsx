'use client';

import React from 'react';
import { LiffProvider } from '@/components/providers/liff-provider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LiffProvider>{children}</LiffProvider>;
}
