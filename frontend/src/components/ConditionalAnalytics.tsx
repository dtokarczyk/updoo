'use client';

import { useEffect, useState } from 'react';
import { hasConsent } from '@/lib/utils';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { Hotjar } from '@/components/Hotjar';

/**
 * Renders Google Analytics (always, so gtag is available for consent) and Hotjar only when consented.
 * Updates gtag consent defaults when preferences change. Listens to cookieConsentChanged.
 */
export function ConditionalAnalytics() {
  const [loadHotjar, setLoadHotjar] = useState(false);

  useEffect(() => {
    const applyConsent = () => {
      const ga = hasConsent('googleAnalytics');
      const adWords = hasConsent('googleAdWords');
      setLoadHotjar(hasConsent('hotjar'));

      if (typeof window !== 'undefined' && window.gtag) {
        const update = {
          ad_storage: adWords ? 'granted' : 'denied',
          analytics_storage: ga ? 'granted' : 'denied',
          functionality_storage: 'granted' as const,
          personalization_storage: adWords ? 'granted' : 'denied',
          security_storage: 'granted' as const,
        };
        window.gtag('consent', 'update', update);
      }
    };

    applyConsent();
    const handleConsentChange = () => applyConsent();
    window.addEventListener('cookieConsentChanged', handleConsentChange);
    return () =>
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
  }, []);

  return (
    <>
      <GoogleAnalytics />
      {loadHotjar && <Hotjar />}
    </>
  );
}
