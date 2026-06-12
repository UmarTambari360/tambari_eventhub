'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/settings', label: 'Settings' },
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
      <div className="flex min-h-screen items-center justify-center bg-(--surface-raised)">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface-raised)">
      {/* Admin top nav */}
      <nav className="bg-(--text-primary) border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-0 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-black">
                E
              </div>
              <span className="font-bold text-white text-sm">Admin</span>
            </Link>
            <div className="hidden md:flex items-center gap-0.5">
              {adminNavLinks.map((link) => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <span className="caption text-white/50 hidden sm:block">{auth.user.email}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
