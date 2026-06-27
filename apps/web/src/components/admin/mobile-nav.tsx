'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface MobileNavProps {
  navItems: NavItem[];
  pathname: string;
}

export function MobileNav({ navItems, pathname }: MobileNavProps) {
  return (
    <div className="md:hidden border-b border-border bg-surface-overlay">
      <ScrollArea className="w-full">
        <div className="flex gap-1 px-3 py-2">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
                  active
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-text-muted hover:bg-surface-raised hover:text-text-primary'
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>
    </div>
  );
}
