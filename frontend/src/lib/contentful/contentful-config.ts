import { createClient, type ContentfulClientApi } from 'contentful';
import { contentfulHoploBlogSchema } from './schemas';

export const CONTENTFUL_CONFIG = {
  space: '9jxx375gal6e',
  environment: 'master',
  contentTypeId: 'hoploBlog',
} as const;

function getContentfulClient(): ContentfulClientApi<undefined> | null {
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN?.trim();
  if (!accessToken) return null;
  return createClient({
    space: CONTENTFUL_CONFIG.space,
    environment: CONTENTFUL_CONFIG.environment,
    accessToken,
  });
}

/**
 * Fetches Hoplo blog post by slug with Zod validation
 */
export async function fetchHoploBlogPost(
  slug: string,
  locale: string = 'pl-PL',
) {
  const client = getContentfulClient();
  if (!client) return null;
  try {
    const entries = await client.getEntries({
      content_type: CONTENTFUL_CONFIG.contentTypeId,
      'fields.slug': slug,
      locale,
      limit: 1,
    });

    if (entries.items.length === 0) {
      return null;
    }

    const validatedEntry = contentfulHoploBlogSchema.parse(entries.items[0]);
    return validatedEntry;
  } catch (error) {
    console.error('Error validating blog post:', error);
    throw new Error('Invalid blog post data structure');
  }
}

/**
 * Fetches all Hoplo blog posts with Zod validation
 */
export async function fetchAllHoploBlogPosts(
  locale: string = 'pl-PL',
  limit: number = 100,
) {
  const client = getContentfulClient();
  if (!client) return [];
  try {
    const entries = await client.getEntries({
      content_type: CONTENTFUL_CONFIG.contentTypeId,
      locale,
      order: ['-sys.createdAt'],
      limit,
    });

    const validatedEntries = entries.items.map((item) => {
      try {
        return contentfulHoploBlogSchema.parse(item);
      } catch (error) {
        console.error('Error validating blog post entry:', error);
        throw new Error('Invalid blog post data structure');
      }
    });

    return validatedEntries;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw new Error('Failed to fetch blog posts');
  }
}
