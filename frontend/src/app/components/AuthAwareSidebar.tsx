'use client';

import { AuthPromoSidebar } from '@/app/components/AuthPromoSidebar';
import { AuthBottomBar } from '@/app/components/AuthBottomBar';
import { UserSidebar } from '@/app/components/UserSidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { Locale } from '@/lib/i18n';

/**
 * Client-only wrapper: resolves auth state and renders either
 * AuthPromoSidebar + AuthBottomBar or UserSidebar. Keeps auth-dependent
 * UI in a single client boundary. Uses global auth context so it reacts
 * to login/logout across the app.
 */
export function AuthAwareSidebar({
  initialLocale,
}: {
  initialLocale: Locale;
}) {
  const { isLoggedIn } = useAuth();

  return (
    <>
      {!isLoggedIn && (
        <aside className="sticky top-0 z-10 hidden shrink-0 lg:top-14 lg:block lg:self-start lg:w-1/5">
          <AuthPromoSidebar initialLocale={initialLocale} />
        </aside>
      )}
      {isLoggedIn && (
        <aside className="sticky top-0 z-10 hidden shrink-0 lg:top-14 lg:block lg:self-start lg:w-1/5">
          <UserSidebar initialLocale={initialLocale} />
        </aside>
      )}
      {!isLoggedIn && <AuthBottomBar initialLocale={initialLocale} />}
    </>
  );
}
