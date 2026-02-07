'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { getUserLocale, type Locale } from '@/lib/i18n';
import { t as translate } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface AuthButtonsProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
  /** Button variant for register button */
  registerVariant?: 'default' | 'secondary' | 'outline';
  /** Button variant for login button */
  loginVariant?: 'default' | 'secondary' | 'outline';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  /** Additional className for container */
  className?: string;
  /** Callback when button is clicked (e.g., to close drawer) */
  onButtonClick?: () => void;
  /** Show title before buttons */
  showTitle?: boolean;
  /** Layout direction */
  layout?: 'vertical' | 'horizontal';
}

export function AuthButtons({
  initialLocale,
  registerVariant = 'default',
  loginVariant = 'outline',
  size = 'default',
  className,
  onButtonClick,
  showTitle = false,
  layout = 'vertical',
}: AuthButtonsProps) {
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
      setLocaleState(currentLocale);
    }
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  const containerClassName = cn(
    layout === 'vertical' ? 'space-y-2' : 'flex items-center gap-2',
    className,
  );

  return (
    <div className={containerClassName}>
      {showTitle && (
        <h2 className="text-xl font-semibold">{t('auth.dontHaveAccount')}</h2>
      )}
      <Button
        asChild
        variant={registerVariant}
        size={size}
        className={layout === 'vertical' ? 'w-full' : ''}
        onClick={onButtonClick}
      >
        <Link href="/register">{t('auth.signUp')}</Link>
      </Button>
      {layout === 'vertical' && (
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.alreadyHaveAccountText')}
        </p>
      )}
      <Button
        asChild
        variant={loginVariant}
        size={size}
        className={layout === 'vertical' ? 'w-full' : ''}
        onClick={onButtonClick}
      >
        <Link href="/login">{t('auth.signIn')}</Link>
      </Button>
    </div>
  );
}
