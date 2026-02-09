'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Award,
  CreditCard,
  Building2,
  Key,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

const PROFILE_NAV: {
  href: string;
  key: 'tabBasic' | 'tabSkills' | 'menuVisitingCard' | 'tabCompany' | 'tabPassword';
  icon: LucideIcon;
}[] = [
  { href: '/profile/basic', key: 'tabBasic', icon: User },
  { href: '/profile/skills', key: 'tabSkills', icon: Award },
  { href: '/profile/visiting-card', key: 'menuVisitingCard', icon: CreditCard },
  { href: '/profile/company', key: 'tabCompany', icon: Building2 },
  { href: '/profile/password', key: 'tabPassword', icon: Key },
];

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
      {PROFILE_NAV.map(({ href, key, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(`profile.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
