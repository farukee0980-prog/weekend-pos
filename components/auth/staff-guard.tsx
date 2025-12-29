"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface StaffGuardProps {
  children: React.ReactNode;
}

export default function StaffGuard({ children }: StaffGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const authed = localStorage.getItem("pos_authed") === "1";
    if (!authed) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
