"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingRedirect } from "@/app/components/OnboardingRedirect";
import { CategoriesSidebar } from "@/app/components/CategoriesSidebar";
import { HomeNav } from "@/app/components/HomeNav";
import { ListingsSectionHeader } from "@/app/components/ListingsSectionHeader";
import { AuthPromoSidebar } from "@/app/components/AuthPromoSidebar";
import { AuthBottomBar } from "@/app/components/AuthBottomBar";
import { getCategories, sortCategoriesByOrder, getToken } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";
import type { Category } from "@/lib/api";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { t } = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    searchParams.then((params) => {
      setCategorySlug(params.category);
    });
    getCategories().then((cats) => {
      setCategories(sortCategoriesByOrder(cats));
    });
    const token = getToken();
    setIsLoggedIn(!!token);
  }, [searchParams]);

  const selectedCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;
  const categoryId = selectedCategory?.id;

  return (
    <OnboardingRedirect>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          <aside className="z-10 shrink-0 lg:sticky lg:top-14 lg:self-start lg:basis-1/5">
            <div className="hidden items-center justify-between lg:flex lg:pb-4">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus:underline"
              >
                Updoo
              </Link>
              <ThemeToggle />
            </div>
            <CategoriesSidebar
              categories={categories}
              currentCategorySlug={categorySlug}
            />
            <HomeNav placement="sidebar" />
          </aside>
          <ListingsSectionHeader
            sectionTitle={t("listings.listings")}
            categoryId={categoryId}
          />
          {!isLoggedIn && (
            <aside className="sticky top-0 z-10 hidden shrink-0 lg:top-14 lg:block lg:self-start lg:basis-1/5">
              <AuthPromoSidebar />
            </aside>
          )}
        </div>
      </div>
      {!isLoggedIn && <AuthBottomBar />}
    </OnboardingRedirect>
  );
}
