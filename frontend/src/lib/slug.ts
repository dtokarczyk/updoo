/**
 * Generate URL-safe slug from a name (lowercase, spaces to hyphens, strip special chars).
 * Mirrors backend slug.helper for profile slug auto-generation.
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
