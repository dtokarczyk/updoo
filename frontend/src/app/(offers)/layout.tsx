import { OffersLeftSidebar } from '@/components/OffersLeftSidebar';
import { AuthAwareSidebar } from '@/components/AuthAwareSidebar';
import { HomeLayout } from '@/layouts/HomeLayout';
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
    <HomeLayout
      left={<OffersLeftSidebar categories={categories} initialLocale={locale} />}
      right={<AuthAwareSidebar initialLocale={locale} />}
    >
      {children}
    </HomeLayout>
  );
}
