/**
 * Job URL helpers: slug (from title) + id for SEO-friendly URLs.
 * Format: /job/{slug}-{id} (e.g. /job/automatyzacja-procesow-bok-cmlbb2sj3000101midvq4k1b7)
 * CUID v1 (Prisma default) is 25 characters.
 */

const CUID_LENGTH = 25;

/**
 * Slugify job title for URL segment: lowercase, hyphens, alphanumeric only.
 */
export function slugify(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-') || 'job'
  );
}

/**
 * Build job detail URL: /job/{slug}-{id}
 */
export function jobPath(job: { id: string; title: string }): string {
  const slug = slugify(job.title);
  return `/job/${slug}-${job.id}`;
}

/**
 * Build job edit URL: /job/{slug}-{id}/edit
 */
export function jobPathEdit(job: { id: string; title: string }): string {
  return `${jobPath(job)}/edit`;
}

/**
 * Extract job id from URL segment (slug-id).
 * Supports: "automatyzacja-procesow-bok-cmlbb2sj3000101midvq4k1b7" -> id = last 25 chars.
 * Backward compat: if segment is exactly CUID_LENGTH and alphanumeric, treat as raw id.
 */
export function parseJobSlugId(slugId: string): string {
  if (!slugId) return '';
  if (slugId.length === CUID_LENGTH && /^[a-z0-9]+$/i.test(slugId)) {
    return slugId;
  }
  if (slugId.length > CUID_LENGTH) {
    return slugId.slice(-CUID_LENGTH);
  }
  return slugId;
}
