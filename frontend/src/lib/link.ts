import type { Locale } from './i18n';
import { defaultLocale } from './i18n';

export function getLocalizedPath(path: string, locale: Locale): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // If path already starts with locale, return as is
  if (cleanPath.startsWith('pl/') || cleanPath.startsWith('en/')) {
    return `/${cleanPath}`;
  }

  // Add locale prefix
  return `/${locale}${cleanPath ? `/${cleanPath}` : ''}`;
}

export function getLocalizedHref(href: string, locale: Locale): string {
  // If href is external, return as is
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')
  ) {
    return href;
  }

  return getLocalizedPath(href, locale);
}
