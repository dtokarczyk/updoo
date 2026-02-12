import { JobLanguage } from '@prisma/client';

/**
 * Parses Accept-Language header and returns JobLanguage.
 * Accepts "pl", "en", "pl-PL", "en-US", etc.
 * Returns POLISH for "pl", ENGLISH for "en", default POLISH otherwise.
 */
export function parseLanguageFromHeader(acceptLanguage?: string): JobLanguage {
  if (!acceptLanguage) return JobLanguage.POLISH;

  const normalized = acceptLanguage.toLowerCase().trim();
  const langCode = normalized.split('-')[0];

  if (langCode === 'en') return JobLanguage.ENGLISH;
  if (langCode === 'pl') return JobLanguage.POLISH;

  return JobLanguage.POLISH;
}
