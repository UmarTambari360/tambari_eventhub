'use client';

import { useState } from 'react';
import { Share2, Twitter, Link2, MessageCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  url: string; // relative path e.g. /events/slug
  title: string;
  className?: string;
}

export function SocialShare({ url, title, className }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${url}` : `https://eventhub.ng${url}`;

  const encoded = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(`${title} — EventHub`);

  const links = [
    {
      label: 'Twitter / X',
      icon: <Twitter className="h-4 w-4" />,
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="h-4 w-4" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Share event"
        className="flex items-center gap-1.5 rounded-xl border border-(--border) px-3 py-2 text-sm text-(--text-muted) hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-(--border) bg-(--surface-overlay) shadow-card-lg z-20 overflow-hidden">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-(--text-secondary) hover:bg-(--surface-raised) hover:text-(--text-primary) transition-colors"
              >
                {link.icon}
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                void copyLink();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-(--text-secondary) hover:bg-(--surface-raised) hover:text-(--text-primary) transition-colors border-t border-(--border)"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
