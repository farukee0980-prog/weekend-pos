'use client';

import React from 'react';
import { useLiffAuth } from '@/components/providers/liff-provider';
import { isStaff } from '@/lib/auth';
import { Button } from '@/components/ui';

export function StaffGuard({ children }: { children: React.ReactNode }) {
  const { ready, idToken, error } = useLiffAuth();
  const [allowed, setAllowed] = React.useState<boolean | null>(null);
  const [msg, setMsg] = React.useState<string>('');
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ready) return;
    if (error) {
      setAllowed(false);
      setMsg('ไม่สามารถเริ่มต้น LIFF ได้');
      return;
    }
    (async () => {
      try {
        if (!idToken) {
          setAllowed(false);
          setMsg('ยังไม่ได้เข้าสู่ระบบ LINE');
          return;
        }
        const r = await fetch('/api/liff/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
          cache: 'no-store',
        });
        const data = await r.json();
        if (!data.ok) {
          setAllowed(false);
          setMsg('ตรวจสอบตัวตนไม่สำเร็จ');
          return;
        }
        const uid: string = data.userId;
        setUserId(uid);
        if (isStaff(uid)) {
          setAllowed(true);
        } else {
          setAllowed(false);
          setMsg('สำหรับพนักงานร้านเท่านั้น');
        }
      } catch (e: any) {
        setAllowed(false);
        setMsg('เกิดข้อผิดพลาดระหว่างตรวจสอบสิทธิ์');
      }
    })();
  }, [ready, idToken, error]);

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-gray-500">กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <div className="max-w-sm w-full p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">เข้าใช้งานไม่ได้</h2>
          <p className="text-gray-600">{msg}</p>
          {userId && (
            <div className="text-xs text-gray-500 break-all">
              LINE userId: {userId}
            </div>
          )}
          <div className="text-xs text-gray-400">
            โปรดติดต่อผู้ดูแลเพื่อเพิ่มรายชื่อพนักงาน
          </div>
          <Button variant="outline" onClick={() => location.reload()} className="w-full">ลองใหม่อีกครั้ง</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
