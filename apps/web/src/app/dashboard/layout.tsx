'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/events', label: 'My Events', icon: CalendarDays },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
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
      // Check if they have a pending application — if not, redirect to apply
      router.replace('/become-an-organizer');
    }
  }, [auth, router]);

  if (!auth || auth.isLoading || !auth.user || auth.user.role === 'attendee') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" className="text-lg font-bold text-violet-600">
            EventHub
          </Link>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{auth.user.fullName}</p>
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
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-violet-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={() => void auth.logout().then(() => router.push('/'))}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <Link href="/" className="text-lg font-bold text-violet-600">
            EventHub
          </Link>
          <span className="text-sm text-gray-500">{auth.user.fullName.split(' ')[0]}</span>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
