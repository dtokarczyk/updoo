import Link from "next/link";
import { OnboardingRedirect } from "@/app/components/OnboardingRedirect";
import { CategoriesSidebar } from "@/app/components/CategoriesSidebar";
import { HomeNav } from "@/app/components/HomeNav";
import { ListingsSectionHeader } from "@/app/components/ListingsSectionHeader";
import { getCategories, sortCategoriesByOrder } from "@/lib/api";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category ?? undefined;
  const categories = sortCategoriesByOrder(await getCategories());
  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const categoryId = selectedCategory?.id;

  return (
    <OnboardingRedirect>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
          <aside className="sticky top-0 z-10 shrink-0 bg-background lg:top-14 lg:w-52 lg:self-start">
            <Link
              href="/"
              className="hidden text-xl font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus:underline lg:block lg:pb-4"
            >
              Updoo
            </Link>
            <CategoriesSidebar
              categories={categories}
              currentCategorySlug={categorySlug}
            />
            <HomeNav placement="sidebar" />
          </aside>
          <ListingsSectionHeader
            sectionTitle="Ogłoszenia"
            categoryId={categoryId}
          />
        </div>
      </div>
    </OnboardingRedirect>
  );
}
