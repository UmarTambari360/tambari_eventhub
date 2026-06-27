'use client';

import Link from 'next/link';
import { cn, formatNaira } from '@/lib/utils';
import type { TopOrganizer } from '@/actions/admin/revenue.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TopOrganizersTableProps {
  organizers: TopOrganizer[];
}

export function TopOrganizersTable({ organizers }: TopOrganizersTableProps) {
  return (
    <Card className="border-border bg-surface-overlay overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
        <CardTitle className="text-text-primary heading-sm">Top Organizers by GMV</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
        >
          <Link href="/admin/revenue">View revenue →</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-raised">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-text-muted caption font-medium">Organizer</TableHead>
                <TableHead className="text-text-muted caption font-medium">Events</TableHead>
                <TableHead className="text-text-muted caption font-medium">GMV</TableHead>
                <TableHead className="text-text-muted caption font-medium">Platform Fee</TableHead>
                <TableHead className="text-text-muted caption font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizers.slice(0, 8).map((org) => (
                <TableRow
                  key={org.id}
                  className="border-border hover:bg-surface-raised transition-colors"
                >
                  <TableCell className="py-3">
                    <Link
                      href={`/admin/users/${org.id}`}
                      className="font-medium text-text-primary hover:text-primary-600 transition-colors"
                    >
                      {org.businessName || org.fullName}
                    </Link>
                    <p className="text-text-muted text-xs">{org.email}</p>
                  </TableCell>
                  <TableCell className="py-3 text-text-secondary">{org.eventsCount}</TableCell>
                  <TableCell className="py-3 font-medium text-text-primary">
                    {formatNaira(org.totalGmv)}
                  </TableCell>
                  <TableCell className="py-3 font-medium text-success">
                    {formatNaira(org.platformFee)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium text-xs px-2.5 py-0.5 border',
                        org.status === 'approved'
                          ? 'bg-success-light text-success border-success-200'
                          : 'bg-surface-raised text-text-muted border-border'
                      )}
                    >
                      {org.status}
                    </Badge>
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
