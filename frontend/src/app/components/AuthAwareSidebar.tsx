'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';
import { AuthPromoSidebar } from '@/app/components/AuthPromoSidebar';
import { AuthBottomBar } from '@/app/components/AuthBottomBar';
import { UserSidebar } from '@/app/components/UserSidebar';
import type { Locale } from '@/lib/i18n';

/**
 * Client-only wrapper: resolves auth state and renders either
 * AuthPromoSidebar + AuthBottomBar or UserSidebar. Keeps auth-dependent
 * UI in a single client boundary.
 */
export function AuthAwareSidebar({
  initialLocale,
}: {
  initialLocale: Locale;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

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
