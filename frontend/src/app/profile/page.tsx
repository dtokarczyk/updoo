'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { getToken } from '@/lib/api';
import { cn } from '@/lib/utils';

const PROFILE_NAV = [
  { href: '/profile/basic', key: 'tabBasic' as const, prefix: 'profile' as const },
  { href: '/profile/skills', key: 'tabSkills' as const, prefix: 'profile' as const },
  { href: '/profile/business-profile', key: 'menuBusinessProfile' as const, prefix: 'profile' as const },
  { href: '/profile/password', key: 'tabPassword' as const, prefix: 'profile' as const },
  { href: '/profile/notifications', key: 'tabNotifications' as const, prefix: 'notifications' as const },
] as const;

const DESKTOP_BREAKPOINT = 768;

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace('/login');
      return;
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) return;
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !isDesktop) return;
    router.replace('/profile/basic');
  }, [mounted, isDesktop, router]);

  if (!mounted) {
    return null;
  }

  if (isDesktop) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <h1 className="text-xl font-semibold">{t('profile.editProfile')}</h1>
      <p className="text-sm text-muted-foreground mb-2">
        {t('profile.editProfileDesc')}
      </p>
      <nav
        className="flex flex-col gap-1"
        aria-label={t('profile.editProfile')}
      >
        {PROFILE_NAV.map(({ href, key, prefix }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-md px-3 py-3 text-sm font-medium transition-colors',
              'bg-muted/50 hover:bg-muted border border-border',
            )}
          >
            {t(`${prefix}.${key}`)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
