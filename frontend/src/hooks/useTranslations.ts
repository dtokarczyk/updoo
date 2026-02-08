'use client';

import { useMemo } from 'react';
import { getUserLocale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';

export function useTranslations() {
  const locale = getUserLocale();

  const t = useMemo(
    () => (key: string, params?: Record<string, string | number>): string => {
      return translate(locale, key, params);
    },
    [locale],
  );

  return { t, locale };
}
