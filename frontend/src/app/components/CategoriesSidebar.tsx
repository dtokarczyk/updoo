'use client';

import { CategoriesSidebarDesktop } from '@/app/components/CategoriesSidebarDesktop';
import { CategoriesSidebarMobile } from '@/app/components/CategoriesSidebarMobile';
import { type Category } from '@/lib/api';
import { type Locale } from '@/lib/i18n';

export function CategoriesSidebar({
  categories,
  currentCategorySlug,
  initialLocale,
}: {
  categories: Category[];
  currentCategorySlug?: string;
  initialLocale?: Locale;
}) {
  return (
    <>
      <CategoriesSidebarDesktop
        categories={categories}
        currentCategorySlug={currentCategorySlug}
        initialLocale={initialLocale}
      />
      <CategoriesSidebarMobile
        categories={categories}
        currentCategorySlug={currentCategorySlug}
        initialLocale={initialLocale}
      />
    </>
  );
}
