'use client';

import { usePathname } from 'next/navigation';
import { Logotype } from '@/app/components/Logotype';
import { CategoriesSidebar } from '@/app/components/CategoriesSidebar';
import type { Category } from '@/lib/api';
import type { Locale } from '@/lib/i18n';

/**
 * Left sidebar for offers (home + jobs list). Uses pathname to derive current
 * category so it stays mounted in the (offers) layout and only updates highlight.
 */
export function OffersLeftSidebar({
  categories,
  initialLocale,
}: {
  categories: Category[];
  initialLocale: Locale;
}) {
  const pathname = usePathname();

  const currentCategorySlug = (() => {
    if (pathname === '/') return undefined;
    const match = /^\/jobs\/([^/]+)/.exec(pathname);
    if (!match) return undefined;
    const segment = match[1];
    if (segment === 'all' || !segment) return undefined;
    return categories.some((c) => c.slug === segment) ? segment : undefined;
  })();

  return (
    <aside className="z-10 shrink-0 lg:sticky lg:top-14 lg:self-start lg:w-1/5 hidden lg:block">
      <div className="lg:pb-4">
        <Logotype initialLocale={initialLocale} />
      </div>
      <CategoriesSidebar
        categories={categories}
        currentCategorySlug={currentCategorySlug}
        initialLocale={initialLocale}
      />
    </aside>
  );
}
