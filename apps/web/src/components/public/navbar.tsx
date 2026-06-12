'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function Navbar() {
  const auth = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await auth?.logout();
    router.push('/');
  }

  const navLinks = [
    { href: '/events', label: 'Browse Events' },
    { href: '/become-an-organizer', label: 'Host an Event' },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-violet-600">EventHub</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-violet-700 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth area — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {auth?.isLoading ? (
              <div className="h-8 w-24 rounded-lg bg-gray-100 animate-pulse" />
            ) : auth?.user ? (
              <div className="flex items-center gap-2">
                {auth.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                {(auth.user.role === 'organizer' || auth.user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/my-tickets"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  {auth.user.fullName.split(' ')[0]}
                </Link>
                <button
                  onClick={() => void handleLogout()}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-gray-600 hover:text-violet-700 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {auth?.user ? (
              <>
                <Link
                  href="/my-tickets"
                  className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  My Tickets
                </Link>
                {(auth.user.role === 'organizer' || auth.user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    void handleLogout();
                    setMobileOpen(false);
                  }}
                  className="block w-full text-left rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="block rounded-lg px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
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
