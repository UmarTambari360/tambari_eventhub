'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  CalendarDays,
  ShoppingBag,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobileHeader } from '@/components/admin/mobile-header';
import { MobileNav } from '@/components/admin/mobile-nav';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/applications', label: 'Applications', icon: FileCheck2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth && !auth.isLoading && (!auth.user || auth.user.role !== 'admin')) {
      router.replace('/');
    }
  }, [auth, router]);

  if (auth?.isLoading || !auth?.user || auth.user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-raised">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleLogout = async () => {
    await auth.logout();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-surface-raised">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface-overlay">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-black">
              TE
            </div>
            <span className="font-bold text-text-primary">Admin Panel</span>
          </Link>
          <p className="text-text-muted text-xs mt-1.5 truncate">{auth.user.fullName}</p>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all group',
                    active
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      active
                        ? 'text-primary-600'
                        : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  />
                  {item.label}
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary-400" />}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sign Out */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2.5 px-3 py-2 h-auto text-sm font-medium text-text-muted hover:text-danger hover:bg-danger-50 transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <MobileHeader user={auth.user} />

        {/* Mobile Navigation */}
        <MobileNav navItems={navItems} pathname={pathname} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 bg-surface-raised">{children}</main>
      </div>
    </div>
  );
}
