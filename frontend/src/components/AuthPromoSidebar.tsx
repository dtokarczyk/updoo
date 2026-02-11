'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { AuthButtons } from '@/components/AuthButtons';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

interface AuthPromoSidebarProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}

export function AuthPromoSidebar({ initialLocale }: AuthPromoSidebarProps) {
  const { locale: clientLocale } = useTranslations();

  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? clientLocale,
  );

  // Update locale after mount if client locale differs from initial locale
  useEffect(() => {
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      queueMicrotask(() => setLocaleState(currentLocale));
    }
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  return (
    <>
      {/* Theme and language toggles above the container */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <LanguageToggle
          initialLocale={initialLocale}
          iconOnly
          className="h-[44px] w-[44px] px-0"
        />
        <ThemeToggle className="h-[44px] w-[44px] px-0" />
      </div>

      {/* Add job posting – above login */}
      <Button className="w-full mb-4 min-w-0" size="lg" asChild>
        <Link
          href="/job/new"
          className="flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{t('jobs.createJob')}</span>
        </Link>
      </Button>

      <div className="rounded-2xl border p-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t('auth.promoTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('auth.promoDescription')}
        </p>
        <div className="mt-4">
          <AuthButtons initialLocale={initialLocale} />
        </div>
      </div>
    </>
  );
}
