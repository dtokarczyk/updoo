'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

const PROFILE_NAV = [
  { href: '/profile/basic', key: 'tabBasic' as const },
  { href: '/profile/skills', key: 'tabSkills' as const },
  { href: '/profile/visiting-card', key: 'menuVisitingCard' as const },
  { href: '/profile/company', key: 'tabCompany' as const },
  { href: '/profile/password', key: 'tabPassword' as const },
] as const;

export function ProfileSidebar() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      className={cn(
        'flex w-56 shrink-0 flex-col gap-1 border-r border-border pr-4',
      )}
      aria-label={t('profile.editProfile')}
    >
      {PROFILE_NAV.map(({ href, key }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {t(`profile.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
