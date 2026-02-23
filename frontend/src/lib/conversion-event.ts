/**
 * Track conversion event to Google Analytics (gtag) and Facebook Pixel (fbq).
 * Call after successful user actions (e.g. sign up, create listing).
 */
export function conversionEvent(options: {
  googleEvent: string;
  googleParams?: Record<string, unknown>;
  fbqEvent: string;
}): void {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    if (options.googleParams) {
      window.gtag('event', options.googleEvent, options.googleParams);
    } else {
      window.gtag('event', options.googleEvent);
    }
  }
  const fbq = (window as unknown as { fbq?: (a: string, b: string) => void })
    .fbq;
  if (typeof fbq === 'function') {
    fbq('track', options.fbqEvent);
  }
}
