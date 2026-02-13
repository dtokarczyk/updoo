'use client';

import { type LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /** Icon displayed above the message. Defaults to Inbox. */
  icon?: LucideIcon;
  /** Main message shown below the icon. */
  message: string;
  /** Optional short title above the message. */
  title?: string;
  /** Optional description or secondary text. */
  description?: string;
  /** Optional action (e.g. button or link) rendered below the text. */
  action?: React.ReactNode;
  /** Additional class names for the container. */
  className?: string;
  /** Compact layout for sidebars/cards; default is larger for full-page empty states. */
  variant?: 'default' | 'compact';
}

/**
 * Reusable fallback for empty content: icon centered above message (and optional title/description/action).
 */
export function EmptyState({
  icon: Icon = Inbox,
  message,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-6 px-2' : 'py-10 px-4',
        className,
      )}
      role="status"
      aria-label={message}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full text-muted-foreground',
          isCompact ? 'mb-2' : 'mb-4',
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground/80',
            isCompact ? 'size-8' : 'size-10',
          )}
          aria-hidden
        />
      </div>
      {title && (
        <h4
          className={cn(
            'font-semibold text-foreground',
            isCompact ? 'text-sm mb-0.5' : 'text-base mb-1',
          )}
        >
          {title}
        </h4>
      )}
      <p
        className={cn(
          'text-muted-foreground',
          isCompact ? 'text-sm' : 'text-sm sm:text-base',
        )}
      >
        {message}
      </p>
      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-1',
            isCompact ? 'text-xs' : 'text-sm',
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={cn(isCompact ? 'mt-2' : 'mt-4')}>{action}</div>
      )}
    </div>
  );
}
