'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  UserCircle,
  Settings,
  PanelRightOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logotype } from '@/components/Logotype';
import { useAuth } from '@/contexts/AuthContext';
import { useMyProfilesQuery } from '@/lib/api-query/profiles';
import { useTranslations } from '@/hooks/useTranslations';
import type { Locale } from '@/lib/i18n';
import { UserDrawerContent } from '@/components/UserDrawer';
import { AuthDrawerContent } from '@/components/AuthDrawer';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';
import { NavIconItem } from '@/components/NavIconItem';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();

  const { t } = useTranslations();
  const { isLoggedIn, user } = useAuth();
  const { data: myProfiles } = useMyProfilesQuery();
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);

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
    items.push({ href: '/profile/basic', icon: Settings, labelKey: 'nav.profile' });
    return items;
  }, [isFreelancer, hasProfile, firstProfileSlug]);

  return (
    <>
      <header
        className={`border-b border-border w-full sticky top-0 z-10 bg-background/70 backdrop-blur`}
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
            <div className="hidden lg:block">
              <ThemeToggle size="icon-lg" />
            </div>

            <div className="lg:hidden">
              <Drawer
                open={authDrawerOpen}
                onOpenChange={setAuthDrawerOpen}
                direction="right"
              >
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="aspect-square size-10 shrink-0 p-0"
                    aria-label={t('nav.openAccountMenu')}
                  >
                    <PanelRightOpen className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>

                {isLoggedIn ? (
                  <UserDrawerContent
                    initialLocale={initialLocale}
                    onClose={() => setAuthDrawerOpen(false)}
                  />
                ) : (
                  <AuthDrawerContent
                    initialLocale={initialLocale}
                    onClose={() => setAuthDrawerOpen(false)}
                  />
                )}
              </Drawer>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-90 flex items-center justify-around border-t border-border bg-background/80 backdrop-blur px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] safe-area-pb lg:hidden"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, icon, labelKey }) => (
          <NavIconItem
            className="w-full"
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
      </nav>
    </>
  );
}
