import { OffersLeftSidebar } from '@/app/components/OffersLeftSidebar';
import { AuthAwareSidebar } from '@/app/components/AuthAwareSidebar';
import { getCategoriesServer } from '@/lib/categories-server';
import { getLocaleFromRequest } from '@/lib/i18n';

/**
 * Shared layout for home (/) and jobs list (/jobs/[category]/[page]).
 * Left and right sidebars stay mounted when navigating between these routes.
 */
export default async function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        <OffersLeftSidebar categories={categories} initialLocale={locale} />
        {children}
        <AuthAwareSidebar initialLocale={locale} />
      </div>
    </div>
  );
}
