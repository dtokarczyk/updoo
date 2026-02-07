'use client';

import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

export function useTranslations() {
  const locale = getUserLocale();

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(locale, key, params);
  };

  return { t, locale };
}
