'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';
import { HeroBanner } from '@/app/components/HeroBanner';
import { t as translate } from '@/lib/translations';
import type { Locale } from '@/lib/i18n';

/**
 * Renders HeroBanner when on home and user is guest. Shows hero on SSR (until auth
 * is resolved), then hides after hydration if user is logged in.
 */
export function HeroBannerForGuests({
  isHomePage,
  initialLocale,
}: {
  isHomePage: boolean;
  initialLocale: Locale;
}) {
  const [isGuest, setIsGuest] = useState<boolean | null>(null);

  useEffect(() => {
    setIsGuest(!getToken());
  }, []);

  if (!isHomePage) return null;
  if (isGuest === false) return null;

  const t = (key: string, params?: Record<string, string | number>) =>
    translate(initialLocale, key, params);

  return <HeroBanner t={t} />;
}
