'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logotype } from '@/app/components/Logotype';
import { HomeNav, UserDropdown, initials } from '@/app/components/HomeNav';
import { getToken, getStoredUser, clearAuth, type AuthUser } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import type { Locale } from '@/lib/i18n';
import { UserDrawerContent } from '@/app/components/UserDrawer';
import { AuthDrawerContent } from '@/app/components/AuthDrawer';
import { Drawer, DrawerTrigger } from '@/components/ui/drawer';

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const isListings = pathname.startsWith('/jobs/');
  const showBack = !isListings && !isHome;
  const topBarVisible = !isListings && !isHome;

  const { t, locale } = useTranslations();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize auth state on mount
  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
  }, []);

  // Refresh auth state when pathname changes (e.g., after login redirect)
  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
  }, [pathname, mounted]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    clearAuth();
    setUser(null);
    setIsLoggedIn(false);
    router.push('/');
    router.refresh();
  };

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
          {mounted && (
            <>
              <Drawer
                open={authDrawerOpen}
                onOpenChange={setAuthDrawerOpen}
                direction="right"
              >
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-lg"
                    aria-label="Open login menu"
                  >
                    <User className="h-5 w-5" />
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
