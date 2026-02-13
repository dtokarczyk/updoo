'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  UserCircle,
  Settings,
} from 'lucide-react';
import { Logotype } from '@/components/Logotype';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProfilesQuery } from '@/lib/api-query/profiles';
import { useTranslations } from '@/hooks/useTranslations';
import type { Locale } from '@/lib/i18n';
import { NavIconItem } from '@/components/NavIconItem';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserDropdown } from '@/components/UserDropdown';
import { Button } from '@/components/ui/button';

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { isLoggedIn, user } = useAuth();
  const { data: myProfiles } = useMyProfilesQuery();

  const isFreelancer = user?.accountType === 'FREELANCER';
  const hasProfile = (myProfiles?.length ?? 0) > 0;
  const firstProfileSlug = myProfiles?.[0]?.slug;

  const navItems = useMemo(() => {
    const items: Array<{
      href: string;
      icon: typeof LayoutDashboard;
      labelKey: string;
    }> = [
        { href: '/', icon: LayoutDashboard, labelKey: 'nav.board' },
        { href: '/my', icon: FolderOpen, labelKey: 'nav.myThings' },
      ];
    if (isFreelancer) {
      if (hasProfile && firstProfileSlug) {
        items.push({
          href: `/company/${firstProfileSlug}`,
          icon: UserCircle,
          labelKey: 'nav.businessCard',
        });
      } else {
        items.push({
          href: '/profile/create',
          icon: UserCircle,
          labelKey: 'nav.createBusinessCard',
        });
      }
    }
    items.push({ href: '/profile/basic', icon: Settings, labelKey: 'nav.settings' });
    return items;
  }, [isFreelancer, hasProfile, firstProfileSlug]);

  return (
    <>
      <header
        className={`border-b border-border w-full sticky top-0 z-30 bg-background/70 backdrop-blur`}
      >
        <div
          className={` mx-auto flex flex-row items-center justify-between gap-3 sm:gap-4 px-4 py-2 w-full max-w-7xl`}
        >
          <div className="flex items-center gap-2 lg:w-1/5">
            <Logotype className="shrink-0" initialLocale={initialLocale} />
          </div>

          <div className="flex items-center gap-2 lg:w-3/5 justify-center">
            <span className="hidden items-center gap-1 lg:flex sm:gap-2">
              {navItems.map(({ href, icon, labelKey }) => (
                <NavIconItem
                  key={href}
                  href={href}
                  icon={icon}
                  label={t(labelKey)}
                  isActive={
                    pathname === href ||
                    (href !== '/' && pathname.startsWith(href + '/'))
                  }
                />
              ))}
            </span>
          </div>

          <div className="flex items-center gap-2 lg:w-1/5 justify-end">
            {isLoggedIn ? (
              <UserDropdown iconOnly />
            ) : (
              <>
                <ThemeToggle size="icon-lg" />
                <Button size="lg" asChild>
                  <Link href="/login">{t('auth.logIn')}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-90 flex items-center justify-around gap-4 border-t border-border bg-background/80 backdrop-blur px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] safe-area-pb lg:hidden"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, icon, labelKey }) => (
          <NavIconItem
            className="w-full"
            key={href}
            href={href}
            icon={icon}
            label={t(labelKey)}
            showLabel={false}
            isActive={
              pathname === href ||
              (href !== '/' && pathname.startsWith(href + '/'))
            }
          />
        ))}
      </nav>
    </>
  );
}
