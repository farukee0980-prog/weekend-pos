'use client';

import type { Liff } from '@line/liff';

let liffInstance: Liff | null = null;
let initPromise: Promise<Liff> | null = null;

export async function getLiff() {
  if (liffInstance) return liffInstance;
  const mod = await import('@line/liff');
  return mod.default;
}

export async function initLiff(liffId: string) {
  if (liffInstance) return liffInstance;
  if (!initPromise) {
    initPromise = (async () => {
      const liff = await getLiff();
      await liff.init({ liffId });
      if (!liff.isInClient() && !liff.isLoggedIn()) {
        liff.login();
        throw new Error('Redirecting to LINE Login');
      }
      liffInstance = liff;
      return liff;
    })();
  }
  return initPromise;
}

export async function getIdToken(): Promise<string | null> {
  const liff = await getLiff();
  try {
    return liff.getIDToken() ?? null;
  } catch {
    return null;
  }
}
