import { sortCategoriesByOrder, type Category } from '@/lib/api';
import { getLocaleFromRequest } from '@/lib/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const REVALIDATE_SECONDS = 60;

/**
 * Fetches categories on the server with cache revalidation.
 * Use only in Server Components.
 */
export async function getCategoriesServer(): Promise<Category[]> {
  const locale = await getLocaleFromRequest();

  const res = await fetch(`${API_URL}/jobs/categories`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: {
      'Accept-Language': locale,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = (await res.json()) as Category[];
  return sortCategoriesByOrder(data);
}
