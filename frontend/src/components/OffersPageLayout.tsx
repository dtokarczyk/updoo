import { CategoriesSidebarMobile } from '@/components/CategoriesSidebarMobile';
import { JobsSectionHeader } from '@/components/JobsSectionHeader';
import { HeroBannerForGuests } from '@/components/HeroBannerForGuests';
import { AdminPendingProfilesBanner } from '@/components/AdminPendingProfilesBanner';
import { t } from '@/lib/translations';
import type { Category } from '@/lib/api';
import type { Locale } from '@/lib/i18n';

export interface OffersPageLayoutProps {
  categories: Category[];
  initialLocale: Locale;
  /** Route segment: 'all' or category slug */
  categorySlug: string;
  page: number;
  initialSkillIds?: string[];
  isHomePage: boolean;
}

/**
 * Main content for home and jobs pagination (center column only).
 * Used inside (offers) layout; left and right sidebars are in the layout and stay mounted.
 */
export function OffersPageLayout({
  categories,
  initialLocale,
  categorySlug,
  page,
  initialSkillIds,
  isHomePage,
}: OffersPageLayoutProps) {
  const effectiveCategorySlug =
    categorySlug === 'all' || !categorySlug ? undefined : categorySlug;
  const hasMatchingCategory =
    effectiveCategorySlug &&
    categories.some((c) => c.slug === effectiveCategorySlug);
  const resolvedCategorySlug = hasMatchingCategory
    ? effectiveCategorySlug
    : undefined;

  const selectedCategory = resolvedCategorySlug
    ? categories.find((c) => c.slug === resolvedCategorySlug)
    : undefined;
  const categoryId = selectedCategory?.id;
  const categoryNameForHeader = selectedCategory?.name;
  const routingCategorySlug = resolvedCategorySlug ?? 'all';
  const sectionTitle = t(initialLocale, 'jobs.jobs');

  return (
    <div className="min-w-0 lg:w-3/5 lg:pt-6">
      <HeroBannerForGuests
        isHomePage={isHomePage}
        initialLocale={initialLocale}
      />
      {isHomePage && <AdminPendingProfilesBanner />}
      <div className="mb-4 lg:hidden">
        <CategoriesSidebarMobile
          categories={categories}
          currentCategorySlug={routingCategorySlug}
          initialLocale={initialLocale}
        />
      </div>
      <JobsSectionHeader
        sectionTitle={sectionTitle}
        categoryId={categoryId}
        categorySlugForRouting={routingCategorySlug}
        page={page}
        categoryName={categoryNameForHeader}
        initialSkillIds={initialSkillIds}
        initialLocale={initialLocale}
      />
    </div>
  );
}
