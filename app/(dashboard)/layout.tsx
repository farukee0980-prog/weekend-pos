import { Sidebar, BottomNav } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
      <main className="md:ml-64 pb-16 md:pb-0">{children}</main>
    </div>
  );
}
