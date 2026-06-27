'use client';

import { Star, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AdminEventRow } from '@/actions/admin/events.actions';

interface EventActionButtonsProps {
  event: AdminEventRow;
  isLoading: boolean;
  onFeatureToggle: (event: AdminEventRow) => void;
  onCancel: (event: AdminEventRow) => void;
}

export function EventActionButtons({
  event,
  isLoading,
  onFeatureToggle,
  onCancel,
}: EventActionButtonsProps) {
  if (event.isCancelled) {
    return <span className="text-text-muted text-xs italic">Cancelled</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeatureToggle(event)}
              disabled={isLoading}
              className={cn(
                'h-8 w-8 p-0 transition-colors',
                event.isFeatured
                  ? 'text-accent-500 hover:text-accent-600 hover:bg-accent-50'
                  : 'text-text-muted hover:text-accent-500 hover:bg-accent-50'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className={cn('h-4 w-4', event.isFeatured && 'fill-current')} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{event.isFeatured ? 'Remove from featured' : 'Feature event'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(event)}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-text-muted hover:text-danger hover:bg-danger-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cancel event</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
