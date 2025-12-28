'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initLiff, getIdToken } from '@/lib/liff';

type LiffState = {
  ready: boolean;
  idToken: string | null;
  error?: string;
};

const LiffContext = createContext<LiffState>({ ready: false, idToken: null });

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LiffState>({ ready: false, idToken: null });

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId) {
      setState({ ready: true, idToken: null, error: 'Missing NEXT_PUBLIC_LINE_LIFF_ID' });
      return;
    }
    (async () => {
      try {
        await initLiff(liffId);
        const token = await getIdToken();
        setState({ ready: true, idToken: token ?? null });
      } catch (e: any) {
        setState({ ready: false, idToken: null, error: e?.message || 'LIFF init failed' });
      }
    })();
  }, []);

  const value = useMemo(() => state, [state]);
  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
}

export function useLiffAuth() {
  return useContext(LiffContext);
}
