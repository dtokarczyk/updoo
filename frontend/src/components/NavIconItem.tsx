import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavIconItemProps = {
  className?: string;
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  iconSize?: number;
  boxSize?: number;
  orientation?: 'vertical' | 'horizontal';
  /** When false, only icon is shown (label still used for aria-label). */
  showLabel?: boolean;
};

/**
 * Nav item: Link + square icon box + label.
 */
export function NavIconItem({
  className,
  href,
  icon: Icon,
  label,
  isActive = false,
  iconSize = 6,
  boxSize = 10,
  orientation = 'horizontal',
  showLabel = true,
}: NavIconItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition-colors',
        showLabel && 'pr-4',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      )}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-lg',
          orientation === 'vertical'
            ? `h-${boxSize} w-${boxSize}`
            : `h-${boxSize} w-${boxSize}`,
        )}
      >
        <Icon
          className={cn(
            orientation === 'vertical' ? `h-${iconSize} w-${iconSize}` : ``,
          )}
          aria-hidden
        />
      </div>
      {showLabel && (
        <span className="shrink text-sm font-medium truncate">{label}</span>
      )}
    </Link>
  );
}
