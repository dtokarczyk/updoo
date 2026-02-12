import type { AuthorFields } from './jobs.types';

export type { AuthorFields } from './jobs.types';

/**
 * Returns author with surname masked to first letter only (e.g. "K.") for public API responses.
 * Used so post authors are not shown with full last names.
 */
export function maskAuthorSurname<T extends AuthorFields>(
  author: T,
): Omit<T, 'surname'> & { surname: string } {
  const s = author.surname?.trim() ?? '';
  return {
    ...author,
    surname: s ? s.charAt(0) + '.' : '',
  };
}
