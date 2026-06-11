import { redirect } from 'next/navigation';
// PHASE 5: This layout will have full sidebar nav
// For Phase 4, it provides the auth guard shell

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Authentication and role guard is handled by apps/web/src/app/middleware.ts
  // which redirects unauthenticated users to /sign-in
  // and non-organizers away from /dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* PHASE 5: Sidebar and nav will go here */}
      <main className="p-6">{children}</main>
    </div>
  );
}
