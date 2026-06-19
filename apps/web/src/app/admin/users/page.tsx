'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUsersAction, type AdminUserRow } from '@/actions/admin/users.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { formatDate, cn } from '@/lib/utils';

type RoleFilter = 'all' | 'attendee' | 'organizer' | 'admin';

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

  const tabs: { label: string; value: RoleFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Attendees', value: 'attendee' },
    { label: 'Organizers', value: 'organizer' },
    { label: 'Admins', value: 'admin' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="heading-xl text-(--text-primary)">Users</h1>
        <p className="body-sm text-(--text-muted) mt-1">Manage all platform users</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--text-muted)" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearch(searchInput);
              setPage(1);
            }
          }}
          placeholder="Search by name or email…"
          className="input-base pl-10"
        />
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 mb-6 border-b border-(--border)">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setRole(tab.value);
              setPage(1);
            }}
            className={cn(
              'px-4 py-2.5 body-sm font-medium border-b-2 transition-colors -mb-px',
              role === tab.value
                ? 'border-(--primary) text-(--primary)'
                : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <div className="card border-dashed p-12 text-center">
          <p className="text-(--text-muted) body-sm">No users found.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-(--surface-raised) border-b border-(--border)">
                <tr>
                  {['User', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left caption text-(--text-muted)">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border)">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-(--surface-raised) transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-(--text-primary)">{user.fullName}</p>
                      <p className="caption text-(--text-muted)">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'badge',
                          user.role === 'admin'
                            ? 'badge-primary'
                            : user.role === 'organizer'
                              ? 'badge-info'
                              : 'badge-neutral'
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {user.isSuspended ? (
                        <span className="badge badge-danger">Suspended</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-4 body-sm text-(--text-muted)">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="body-sm font-semibold text-(--primary) hover:text-(--primary-hover)"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between body-sm text-(--text-muted)">
              <span>
                Showing {users.length} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-ghost btn-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
