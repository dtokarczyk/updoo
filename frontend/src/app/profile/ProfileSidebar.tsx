'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Award,
  CreditCard,
  Building2,
  Key,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { cn } from '@/lib/utils';

type ProfileNavKey =
  | 'tabBasic'
  | 'tabSkills'
  | 'menuBusinessProfile'
  | 'tabCompany'
  | 'tabPassword';

type NotificationsNavKey = 'tabNotifications';

const PROFILE_NAV: {
  href: string;
  key: ProfileNavKey | NotificationsNavKey;
  translationPrefix: 'profile' | 'notifications';
  icon: LucideIcon;
}[] = [
    { href: '/profile/basic', key: 'tabBasic', translationPrefix: 'profile', icon: User },
    { href: '/profile/skills', key: 'tabSkills', translationPrefix: 'profile', icon: Award },
    { href: '/profile/business-profile', key: 'menuBusinessProfile', translationPrefix: 'profile', icon: CreditCard },
    { href: '/profile/company', key: 'tabCompany', translationPrefix: 'profile', icon: Building2 },
    { href: '/profile/password', key: 'tabPassword', translationPrefix: 'profile', icon: Key },
    { href: '/profile/notifications', key: 'tabNotifications', translationPrefix: 'notifications', icon: Bell },
  ];

export function ProfileSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
} = {}) {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      className={cn(
        'flex w-56 shrink-0 flex-col gap-1',
      )}
      aria-label={t('profile.editProfile')}
    >
      {PROFILE_NAV.map(({ href, key, translationPrefix, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(`${translationPrefix}.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
