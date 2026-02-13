import type { MetadataRoute } from 'next';
import { getCategoriesServer } from '@/lib/categories-server';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';

/**
 * Generates sitemap.xml for search engines.
 * Includes: home, jobs list (all + per category, first page).
 * Job detail URLs would require an API endpoint that returns public job slugIds.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategoriesServer();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs/all/1`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categories.map((cat) => ({
      url: `${baseUrl}/jobs/${cat.slug}/1`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];

  return entries;
}
