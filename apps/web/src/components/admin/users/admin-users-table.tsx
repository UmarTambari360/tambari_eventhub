// app/admin/users/components/admin-users-table.tsx
'use client';

import Link from 'next/link';
import { formatDate, cn } from '@/lib/utils';
import type { AdminUserRow } from '@/actions/admin/users.actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Mail, Calendar, Shield } from 'lucide-react';

interface AdminUsersTableProps {
  users: AdminUserRow[];
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  const getRoleBadge = (role: string) => {
    const variantMap: Record<string, string> = {
      admin: 'bg-primary-100 text-primary-700 border-primary-200',
      organizer: 'bg-info-light text-info border-info-200',
      attendee: 'bg-surface-raised text-text-secondary border-border',
    };

    return (
      <Badge
        variant="outline"
        className={cn(
          'font-medium text-xs px-2.5 py-0.5 border',
          variantMap[role] || variantMap.attendee
        )}
      >
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (isSuspended: boolean) => {
    if (isSuspended) {
      return (
        <Badge variant="destructive" className="font-medium text-xs px-2.5 py-0.5">
          Suspended
        </Badge>
      );
    }
    return (
      <Badge className="bg-success-light text-success border-success-200 font-medium text-xs px-2.5 py-0.5 border">
        Active
      </Badge>
    );
  };

  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    User
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Role
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium">Status</TableHead>
                <TableHead className="text-text-muted caption font-medium hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined
                  </div>
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-border hover:bg-surface-raised transition-colors group"
                >
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <p className="font-medium text-text-primary">{user.fullName}</p>
                      <div className="flex items-center gap-1 text-text-muted text-xs">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="py-4">{getStatusBadge(user.isSuspended)}</TableCell>
                  <TableCell className="py-4 hidden md:table-cell">
                    <span className="text-text-muted text-sm whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 group-hover:bg-primary-50"
                    >
                      <Link href={`/admin/users/${user.id}`}>
                        View
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
