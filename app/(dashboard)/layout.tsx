'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, BottomNav } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const authed = localStorage.getItem('pos_authed');
    if (authed !== '1') {
      router.replace('/login');
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  // แสดง loading ขณะตรวจสอบ auth
  if (isAuthed === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-amber-200" />
          <div className="text-gray-400 text-sm">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile bottom nav - fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
      
      {/* Main content area */}
      <main className="md:ml-64 min-h-screen pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
