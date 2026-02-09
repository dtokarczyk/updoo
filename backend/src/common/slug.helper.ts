/**
 * Shared slug helper for URL-safe slugs from names.
 * Used by profiles, jobs (when generating slugs from text), and scripts.
 */

/**
 * Generate URL-safe slug from a name: lowercase, spaces to hyphens, strip special chars.
 * @param name - Source string (e.g. profile name, category name)
 * @param fallback - Value when result would be empty (default 'slug')
 */
export function slugFromName(name: string, fallback = 'slug'): string {
  const result = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return result || fallback;
}
