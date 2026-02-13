'use client';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function GoogleAnalyticsPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId || typeof window.gtag === 'undefined') return;
    window.gtag('config', measurementId, {
      page_path: pathname ?? window.location.pathname,
    });
  }, [pathname]);

  return null;
}

export function GoogleAnalytics() {
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          (function(){
            try {
              var c = localStorage.getItem('cookie-consent');
              var analytics = 'denied', ad = 'denied';
              if (c) {
                var p = JSON.parse(c);
                if (p.googleAnalytics !== false) analytics = 'granted';
                if (p.googleAdWords !== false) ad = 'granted';
              }
              gtag('consent', 'default', {
                'analytics_storage': analytics,
                'ad_storage': ad,
                'functionality_storage': 'granted',
                'personalization_storage': ad,
                'security_storage': 'granted'
              });
            } catch(e) {}
          })();
          gtag('config', '${measurementId}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
