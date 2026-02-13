'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { t as translate } from '@/lib/translations';
import { getUserLocale, type Locale } from '@/lib/i18n';

type LogotypeProps = {
  className?: string;
  initialLocale: Locale;
};

export function Logotype({ className, initialLocale }: LogotypeProps) {
  useTranslations();
  const [, setMounted] = useState(false);

  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [tagline, setTagline] = useState<string>(
    translate(initialLocale, 'branding.logotypeTagline'),
  );
  const [taglineShort, setTaglineShort] = useState<string>(
    translate(initialLocale, 'branding.logotypeTaglineShort'),
  );

  // Update tagline after mount if client locale differs from initial locale
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      queueMicrotask(() => {
        setTagline(translate(currentLocale, 'branding.logotypeTagline'));
        setTaglineShort(
          translate(currentLocale, 'branding.logotypeTaglineShort'),
        );
      });
    }
  }, [initialLocale]);

  // Renders logo with localized tagline (short on mobile, full on desktop).
  return (
    <Link
      href="/"
      className={`flex flex-col text-xl font-semibold text-foreground focus:outline-none ${className ?? ''}`}
    >
      <span className="font-black text-3xl" style={{ letterSpacing: '-0.05em' }}>Hoplo</span>
      <span
        className="mt-0.5 text-xs text-muted-foreground md:hidden"
        suppressHydrationWarning
      >
        {taglineShort}
      </span>
      <span
        className="mt-0.5 text-xs text-muted-foreground hidden md:block"
        suppressHydrationWarning
      >
        {tagline}
      </span>
    </Link>
  );
}
