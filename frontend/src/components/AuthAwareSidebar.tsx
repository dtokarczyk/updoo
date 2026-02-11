'use client';

import { AuthPromoSidebar } from '@/components/AuthPromoSidebar';
import { AuthBottomBar } from '@/components/AuthBottomBar';
import { UserSidebar } from '@/components/UserSidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { Locale } from '@/lib/i18n';

/**
 * Client-only wrapper: resolves auth state and renders either
 * AuthPromoSidebar + AuthBottomBar or UserSidebar. Keeps auth-dependent
 * UI in a single client boundary. Uses global auth context so it reacts
 * to login/logout across the app.
 */
export function AuthAwareSidebar({ initialLocale }: { initialLocale: Locale }) {
  const { isLoggedIn } = useAuth();

  return (
    <>
      {!isLoggedIn && (
        <aside className="z-10 shrink-0 lg:sticky lg:top-20 lg:self-start lg:w-1/5 hidden lg:block pt-6">
          <AuthPromoSidebar initialLocale={initialLocale} />
        </aside>
      )}
      {isLoggedIn && (
        <aside className="z-10 shrink-0 lg:sticky lg:top-20 lg:self-start lg:w-1/5 hidden lg:block pt-6">
          <UserSidebar initialLocale={initialLocale} />
        </aside>
      )}
      {!isLoggedIn && <AuthBottomBar initialLocale={initialLocale} />}
    </>
  );
}
