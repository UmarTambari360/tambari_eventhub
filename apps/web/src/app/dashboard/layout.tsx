'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, CalendarDays, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/events', label: 'My Events', icon: CalendarDays },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth || auth.isLoading) return;
    if (!auth.user) {
      router.replace('/sign-in?next=/dashboard');
      return;
    }
    if (auth.user.role === 'attendee') {
      router.replace('/become-an-organizer');
    }
  }, [auth, router]);

  if (!auth || auth.isLoading || !auth.user || auth.user.role === 'attendee') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-raised)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface-raised)]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-[var(--border)]">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-black">
              E
            </div>
            <span className="font-bold text-[var(--text-primary)]">EventHub</span>
          </Link>
          <p className="caption text-[var(--text-muted)] mt-1.5 truncate">{auth.user.fullName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 body-sm font-medium transition-all',
                  active
                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active && (
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-[var(--primary)]/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={() => void auth.logout().then(() => router.push('/'))}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 body-sm font-medium text-[var(--text-muted)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-black">
              E
            </div>
            <span className="font-bold text-[var(--text-primary)]">EventHub</span>
          </Link>
          <span className="body-sm text-[var(--text-muted)]">
            {auth.user.fullName.split(' ')[0]}
          </span>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
