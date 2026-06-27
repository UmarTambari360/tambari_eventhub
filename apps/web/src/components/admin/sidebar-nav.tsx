'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
  pathname: string;
}

export function SidebarNav({ items, pathname }: SidebarNavProps) {
  return (
    <ScrollArea className="flex-1">
      <nav className="p-3 space-y-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all group',
                active
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-primary-600' : 'text-text-muted group-hover:text-text-secondary'
                )}
              />
              {item.label}
              {active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary-400" />}
            </Link>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
