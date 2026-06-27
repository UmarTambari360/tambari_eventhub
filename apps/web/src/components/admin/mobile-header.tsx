'use client';

import Link from 'next/link';
import type { UserDTO } from '@eventhub/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MobileHeaderProps {
  user: UserDTO;
}

export function MobileHeader({ user }: MobileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface-overlay">
      <Link href="/admin" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-xs font-black">
          TE
        </div>
        <span className="font-bold text-text-primary">Admin</span>
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-text-secondary text-sm">
          {user.fullName.split(' ')[0]}
        </span>
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-primary-100 text-primary-700 text-xs font-medium">
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}