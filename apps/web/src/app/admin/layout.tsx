'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth && !auth.isLoading && (!auth.user || auth.user.role !== 'admin')) {
      router.replace('/');
    }
  }, [auth, router]);

  if (auth?.isLoading || !auth?.user || auth?.user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin nav */}
      <nav className="bg-gray-900 text-white px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">EventHub Admin</span>
            <div className="flex items-center gap-4 text-sm">
              <a href="/admin" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </a>
              <a
                href="/admin/applications"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Applications
              </a>
              <a href="/admin/users" className="text-gray-300 hover:text-white transition-colors">
                Users
              </a>
              {/* PHASE 10: Events, Orders, Revenue, Settings links */}
            </div>
          </div>
          <span className="text-xs text-gray-400">{auth.user?.email}</span>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
