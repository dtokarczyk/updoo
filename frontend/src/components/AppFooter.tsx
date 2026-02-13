'use client';

import Link from 'next/link';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CookieSettingsLink } from '@/components/CookieSettingsLink';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/translations';
import { PROJECT_NAME } from '@/constants';

export function AppFooter({ initialLocale }: { initialLocale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="container mx-auto w-full mb-32 lg:mb-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 w-full max-w-full">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <LanguageToggle size="sm" initialLocale={initialLocale} />
            <Link
              href="/"
              className="text-sm font-medium text-foreground hover:underline focus:outline-none focus:underline"
            >
              {PROJECT_NAME}
            </Link>
            <Link
              href="/agreements/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline hover:underline focus:outline-none focus:underline"
            >
              {t(initialLocale, 'footer.terms')}
            </Link>
            <Link
              href="/agreements/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline hover:underline focus:outline-none focus:underline"
            >
              {t(initialLocale, 'footer.privacy')}
            </Link>
            <CookieSettingsLink />
          </div>
          <p className="text-xs text-muted-foreground">
            {t(initialLocale, 'footer.copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
