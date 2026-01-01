'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button } from '@/components/ui';

const USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_authed', '1');
      }
      router.replace('/pos');
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-4 safe-area-top safe-area-bottom">
      <Card className="w-full max-w-sm p-5 sm:p-6 space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">เข้าสู่ระบบ POS</h1>
          <p className="text-sm text-gray-500">สำหรับเจ้าของร้านเท่านั้น</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full">
            เข้าสู่ระบบ
          </Button>
        </form>
      </Card>
    </div>
  );
}
