'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageToggle } from '@/components/LanguageToggle';
import type { Locale } from '@/lib/i18n';
import { t } from '@/lib/translations';
import { getAgreementsVersions } from '@/lib/api';

export function AppFooter({ initialLocale }: { initialLocale: Locale }) {
  const year = new Date().getFullYear();
  const [termsVersion, setTermsVersion] = useState<string | null>(null);
  const [privacyVersion, setPrivacyVersion] = useState<string | null>(null);

  useEffect(() => {
    getAgreementsVersions()
      .then((v) => {
        setTermsVersion(v.termsVersion);
        setPrivacyVersion(v.privacyPolicyVersion);
      })
      .catch(() => {});
  }, []);

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
              Oferi
            </Link>
            {termsVersion != null && (
              <Link
                href={`/agreements/terms/${termsVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:underline focus:outline-none focus:underline"
              >
                {t(initialLocale, 'footer.terms')}
              </Link>
            )}
            {privacyVersion != null && (
              <Link
                href={`/agreements/privacy/${privacyVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline hover:underline focus:outline-none focus:underline"
              >
                {t(initialLocale, 'footer.privacy')}
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t(initialLocale, 'footer.copyright', { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}
