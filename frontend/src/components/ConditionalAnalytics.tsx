'use client';

import { useEffect, useState } from 'react';
import { hasConsent } from '@/lib/utils';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { Hotjar } from '@/components/Hotjar';
import Script from 'next/script';

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
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1342211034224183');
            fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt="facebook pixel no script image"
          src="https://www.facebook.com/tr?id=1002246091049642&ev=PageView&noscript=1"
        />
      </noscript>
      {loadHotjar && <Hotjar />}
    </>
  );
}
