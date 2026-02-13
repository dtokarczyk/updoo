import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns whether the user has given consent for the given analytics/cookie service.
 * Used for conditional loading of GA, Hotjar, etc. Defaults to true when no preferences stored.
 */
export function hasConsent(service: string): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) return true;

    const preferences = JSON.parse(consent);
    return preferences[service] !== false;
  } catch (error) {
    console.error('Error reading consent preferences:', error);
    return true;
  }
}
