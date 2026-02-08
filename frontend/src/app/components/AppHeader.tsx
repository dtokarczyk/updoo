'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logotype } from '@/app/components/Logotype';
import { HomeNav } from '@/app/components/HomeNav';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';
import type { Locale } from '@/lib/i18n';
import { UserDrawerContent } from '@/app/components/UserDrawer';
import { AuthDrawerContent } from '@/app/components/AuthDrawer';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';
import { initials } from '@/app/components/HomeNav';

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const isListings = pathname.startsWith('/jobs/');
  const showBack = !isListings && !isHome;
  const topBarVisible = !isListings && !isHome;

  const { t } = useTranslations();
  const { isLoggedIn, user } = useAuth();
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);

  return (
    <header
      className={`border-b border-border ${!topBarVisible ? 'lg:hidden' : ''} overflow-x-hidden w-full`}
    >
      <div
        className={`relative mx-auto flex flex-row items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 w-full max-w-6xl overflow-x-hidden`}
      >
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="outline"
              size="icon-lg"
              aria-label={t('backToList')}
              onClick={() => {
                // Try to go back in history to preserve scroll position.
                if (
                  typeof window !== 'undefined' &&
                  window.history.length > 1
                ) {
                  router.back();
                } else {
                  // Fallback to default offers list when history is not available.
                  router.push('/');
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Logotype
          className="absolute left-1/2 -translate-x-1/2 shrink-0 items-center"
          initialLocale={initialLocale}
        />

        <div className="flex items-center gap-2">
          <HomeNav />
          <Drawer
            open={authDrawerOpen}
            onOpenChange={setAuthDrawerOpen}
            direction="right"
          >
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="icon-lg"
                aria-label={isLoggedIn && user ? t('profile.editProfile') : 'Open login menu'}
              >
                {isLoggedIn && user ? (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
                    aria-hidden
                  >
                    {initials(user)}
                  </span>
                ) : (
                  <User className="h-5 w-5" />
                )}
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
    </header>
  );
}
