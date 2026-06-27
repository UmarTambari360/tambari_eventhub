'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';
import type { OrganizerApplicationDTO } from '@eventhub/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, Mail, Calendar } from 'lucide-react';

interface ApplicationsTableProps {
  applications: OrganizerApplicationDTO[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">Business</TableHead>
                <TableHead className="text-text-muted caption font-medium">Applicant</TableHead>
                <TableHead className="text-text-muted caption font-medium">Status</TableHead>
                <TableHead className="text-text-muted caption font-medium hidden md:table-cell">
                  Submitted
                </TableHead>
                <TableHead className="text-text-muted caption font-medium text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow
                  key={app.id}
                  className="border-border hover:bg-surface-raised transition-colors group"
                >
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-text-muted" />
                        <span className="font-medium text-text-primary">{app.businessName}</span>
                      </div>
                      {app.bankName && (
                        <span className="text-text-muted text-xs ml-5">{app.bankName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-0.5">
                      <span className="text-text-primary text-sm">{app.user.fullName}</span>
                      <div className="flex items-center gap-1 text-text-muted text-xs">
                        <Mail className="h-3 w-3" />
                        {app.user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusBadge status={app.status as 'pending' | 'approved' | 'rejected'} />
                  </TableCell>
                  <TableCell className="py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      {formatDate(app.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 group-hover:bg-primary-50"
                    >
                      <Link href={`/admin/applications/${app.id}`}>
                        Review
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
