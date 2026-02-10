'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, MessageCircle, Users, UserCircle, Settings, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logotype } from '@/app/components/Logotype';
import { HomeNav } from '@/app/components/HomeNav';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';
import type { Locale } from '@/lib/i18n';
import { UserDrawerContent } from '@/app/components/UserDrawer';
import { AuthDrawerContent } from '@/app/components/AuthDrawer';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';
import { NavIconItem } from '@/app/components/NavIconItem';
import { ThemeToggle } from '@/components/ThemeToggle';

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();

  const { t } = useTranslations();
  const { isLoggedIn, user } = useAuth();
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);

  const navItems = [
    { href: '/', icon: MessageCircle, labelKey: 'nav.inquiries' },
    { href: '/company/moja-nazwa-profilu', icon: UserCircle, labelKey: 'nav.profile' },
    { href: '/profile/basic', icon: Settings, labelKey: 'nav.settings' },
  ] as const;

  return (
    <>
      <header
        className={`border-b border-border w-full sticky top-0 z-10 bg-background/950 backdrop-blur`}
      >
        <div
          className={` mx-auto flex flex-row items-center justify-between gap-3 sm:gap-4 px-4 py-2 w-full max-w-7xl`}
        >
          <div className="flex items-center gap-2 lg:w-1/5">
            <Logotype
              className="shrink-0"
              initialLocale={initialLocale}
            />
          </div>

          <div className="flex items-center gap-2 lg:w-3/5 justify-center">

            <span className="hidden items-center gap-1 lg:flex sm:gap-2">
              {navItems.map(({ href, icon, labelKey }) => (
                <NavIconItem
                  key={href}
                  href={href}
                  icon={icon}
                  label={t(labelKey)}
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
                    aria-label={isLoggedIn && user ? t('profile.editProfile') : 'Open login menu'}
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
        className="fixed inset-x-0 bottom-0 z-90 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur safe-area-pb lg:hidden"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, icon, labelKey }) => (
          <NavIconItem
            key={href}
            href={href}
            icon={icon}
            label={t(labelKey)}
          />
        ))}
      </nav>
    </>
  );
}
