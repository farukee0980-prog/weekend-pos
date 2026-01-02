'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, Input, Button } from '@/components/ui';
import { LogIn } from 'lucide-react';

const USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (username === USERNAME && password === PASSWORD) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_authed', '1');
      }
      router.replace('/pos');
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-sm p-6 sm:p-8 space-y-6 shadow-lg border-0">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/weekend.jpg"
              alt="Weekend POS"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Weekend POS</h1>
            <p className="text-sm text-gray-500 mt-1">เข้าสู่ระบบเพื่อจัดการร้าน</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                <span>เข้าสู่ระบบ</span>
              </div>
            )}
          </Button>
        </form>
        
        <p className="text-xs text-center text-gray-400">
          สำหรับเจ้าของร้านเท่านั้น
        </p>
      </Card>
    </div>
  );
}
