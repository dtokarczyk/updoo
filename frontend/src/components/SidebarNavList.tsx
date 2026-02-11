'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

export type SidebarNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

type SidebarNavListProps = {
  items: SidebarNavItem[];
  ariaLabelKey: string;
  /** Sidebar: compact vertical nav. List: stacked cards for mobile. */
  variant: 'sidebar' | 'list';
};

/**
 * Shared nav list: sidebar-style (desktop) or stacked list (mobile).
 * Same structure as profile/my settings menu.
 */
export function SidebarNavList({
  items,
  ariaLabelKey,
  variant,
}: SidebarNavListProps) {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      className={cn(
        variant === 'sidebar' && 'flex w-56 shrink-0 flex-col gap-1',
        variant === 'list' && 'flex flex-col gap-1 mb-4',
      )}
      aria-label={t(ariaLabelKey)}
    >
      {items.map(({ href, labelKey, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 text-sm font-medium transition-colors',
              variant === 'sidebar' && 'rounded-md px-3 py-2',
              variant === 'list' &&
                'rounded-md px-3 py-3 bg-muted/50 hover:bg-muted border border-border',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              variant === 'list' && isActive && 'border-primary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
