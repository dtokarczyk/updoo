'use client';

import { useTranslations } from '@/hooks/useTranslations';

/**
 * Button that opens the cookie consent modal. Use in footer so users can change preferences later.
 */
export function CookieSettingsLink() {
  const { t } = useTranslations();

  const openModal = () => {
    window.dispatchEvent(new CustomEvent('openCookieConsent'));
  };

  return (
    <button
      type="button"
      onClick={openModal}
      className="text-sm text-muted-foreground underline hover:underline focus:outline-none focus:underline"
    >
      {t('footer.cookieSettings')}
    </button>
  );
}
