'use client';

import Link from 'next/link';
import { LanguageToggle } from '@/components/LanguageToggle';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/translations';

export function AppFooter({ initialLocale }: { initialLocale: Locale }) {
  const year = new Date().getFullYear();
  return (
    <footer className="container mx-auto w-full mb-32 lg:mb-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 w-full max-w-full">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-0">
          <div className="flex items-center gap-4">
            <LanguageToggle size="sm" initialLocale={initialLocale} />
            <Link
              href="/"
              className="text-sm font-medium text-foreground hover:underline focus:outline-none focus:underline"
            >
              Oferi
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(initialLocale, 'footer.copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
