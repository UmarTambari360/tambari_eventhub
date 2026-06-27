'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUsersAction, type AdminUserRow } from '@/actions/admin/users.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminUsersTable } from '@/components/admin/users/admin-users-table';

type RoleFilter = 'all' | 'attendee' | 'organizer' | 'admin';

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: 'All Users', value: 'all' },
  { label: 'Attendees', value: 'attendee' },
  { label: 'Organizers', value: 'organizer' },
  { label: 'Admins', value: 'admin' },
];

export default function AdminUsersPage() {
  const auth = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!auth?.accessToken) return;
    setLoading(true);
    void (async () => {
      const query = {
        page,
        ...(role !== 'all' ? { role } : {}),
        ...(search ? { search } : {}),
      };

      const result = await getUsersAction(auth.accessToken!, query);
      if (result.success && result.data) {
        setUsers(result.data.data);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken, page, role, search]);

  const handleTabChange = (value: RoleFilter) => {
    setRole(value);
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Users</h1>
        <p className="text-text-secondary text-sm">Manage all platform users</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="Search by name or email…"
            className="pl-9 border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
          />
        </div>
        <Button onClick={handleSearch} className="btn-primary">
          Search
        </Button>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {ROLE_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange(tab.value)}
            className={`
              rounded-none border-b-2 px-4 py-2.5 h-auto text-sm font-medium
              transition-colors -mb-px
              ${
                role === tab.value
                  ? 'border-primary-600 text-text-primary hover:text-text-primary hover:bg-transparent'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:bg-transparent'
              }
            `}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <Card className="border-dashed border-border bg-surface-overlay">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-text-secondary text-sm">No users found.</p>
            {search && (
              <Button
                variant="link"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(1);
                }}
                className="text-primary-600 mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <AdminUsersTable users={users} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-sm text-text-muted">
              <span>
                Showing {users.length} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border text-text-secondary hover:bg-surface-raised"
                >
                  Previous
                </Button>
                <Badge variant="outline" className="px-3 py-1.5 text-text-primary border-border">
                  {page} / {totalPages}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-border text-text-secondary hover:bg-surface-raised"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
