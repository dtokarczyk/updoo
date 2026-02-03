import { ListingsFeed } from "@/app/components/ListingsFeed";
import { OnboardingRedirect } from "@/app/components/OnboardingRedirect";
import { HomeNav } from "@/app/components/HomeNav";
import { CategoriesSidebar } from "@/app/components/CategoriesSidebar";
import { getCategories } from "@/lib/api";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category ?? undefined;
  const categories = await getCategories();
  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const categoryId = selectedCategory?.id;
  const sectionTitle = selectedCategory ? selectedCategory.name : "Ogłoszenia";

  return (
    <OnboardingRedirect>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="shrink-0 lg:sticky lg:top-20 lg:w-52 lg:self-start">
            <CategoriesSidebar
              categories={categories}
              currentCategorySlug={categorySlug}
            />
          </aside>
          <section className="flex-1 min-w-0 space-y-6 lg:max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                {sectionTitle}
              </h2>
              <HomeNav showCreateOnly />
            </div>
            <ListingsFeed categoryId={categoryId} />
          </section>
        </div>
      </div>
    </OnboardingRedirect>
  );
}
