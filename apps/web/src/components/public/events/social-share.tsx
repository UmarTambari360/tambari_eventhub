'use client';

import { useState } from 'react';
import { Share2, Twitter, Link2, MessageCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';

interface SocialShareProps {
  url: string;
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'border-border text-text-muted hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50',
            className
          )}
          aria-label="Share event"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0 border-border" align="end">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
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
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors border-t border-border"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
