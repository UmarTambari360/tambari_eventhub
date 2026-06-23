'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/lib/utils';

export function Navbar() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await auth?.logout();
    router.push('/');
  }

  const navLinks = [
    { href: '/events', label: 'Browse Events' },
    { href: '/become-an-organizer', label: 'Host an Event' },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-(--border) bg-(--surface)/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-15 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-black">
              Tambari
            </div>
            <span className="text-lg font-bold text-(--text-primary) hidden sm:block">
              EventHub
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn('nav-link', isActive(link.href) && 'active')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: auth + theme toggle */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                'border border-(--border) bg-(--surface-raised)',
                'text-(--text-muted) hover:text-(--text-primary)',
                'hover:border-(--border-strong) hover:bg-(--surface-overlay)'
              )}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Auth */}
            {auth?.isLoading ? (
              <div className="h-9 w-28 rounded-lg skeleton" />
            ) : auth?.user ? (
              <div className="flex items-center gap-1.5">
                {auth.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                      'border border-(--border) text-(--text-secondary)',
                      'hover:bg-(--surface-raised) hover:border-(--border-strong)'
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                {(auth.user.role === 'organizer' || auth.user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                      'border border-(--border) text-(--text-secondary)',
                      'hover:bg-(--surface-raised) hover:border-(--border-strong)'
                    )}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/my-tickets"
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                    'border border-(--border) text-(--text-secondary)',
                    'hover:bg-(--surface-raised) hover:border-(--border-strong)'
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                  {auth.user.fullName?.split(' ')[0] ?? auth.user.email?.split('@')[0] ?? 'Account'}
                </Link>
                <button
                  onClick={() => void handleLogout()}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                    'text-(--text-muted) hover:text-(--danger)',
                    'hover:bg-(--danger-light)'
                  )}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    'text-(--text-secondary) hover:text-(--text-primary)',
                    'hover:bg-(--surface-raised)'
                  )}
                >
                  Sign in
                </Link>
                <Link href="/sign-up" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                'border border-(--border) bg-(--surface-raised)',
                'text-(--text-muted)'
              )}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                'border border-(--border) text-(--text-secondary)',
                'hover:bg-(--surface-raised)'
              )}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-(--border) py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive(link.href)
                    ? 'bg-(--primary-light) text-(--primary)'
                    : 'text-(--text-secondary) hover:bg-(--surface-raised)'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-(--border)" />
            {auth?.user ? (
              <>
                <Link
                  href="/my-tickets"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised) transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="h-4 w-4" />
                  My Tickets
                </Link>
                {(auth.user.role === 'organizer' || auth.user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised) transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                {auth.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised) transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    void handleLogout();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-(--danger) hover:bg-(--danger-light) transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised) transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-(--primary) bg-(--primary-light) hover:bg-(--primary) hover:text-white transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
