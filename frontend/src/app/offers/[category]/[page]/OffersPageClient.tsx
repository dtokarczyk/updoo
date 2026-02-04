"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingRedirect } from "@/app/components/OnboardingRedirect";
import { CategoriesSidebar } from "@/app/components/CategoriesSidebar";
import { HomeNav } from "@/app/components/HomeNav";
import { ListingsSectionHeader } from "@/app/components/ListingsSectionHeader";
import { AuthPromoSidebar } from "@/app/components/AuthPromoSidebar";
import { AuthBottomBar } from "@/app/components/AuthBottomBar";
import { getToken, type Category, type ListingLanguage } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

function parsePageParam(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function OffersPageClient({
  categories,
}: {
  categories: Category[];
}) {
  const { t } = useTranslations();
  const params = useParams<{ category: string; page: string }>();
  const searchParams = useSearchParams();
  const categoryParam =
    typeof params.category === "string" && params.category.length > 0
      ? params.category
      : "all";
  const pageParam =
    typeof params.page === "string" && params.page.length > 0
      ? params.page
      : "1";
  const page = parsePageParam(pageParam);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  const effectiveCategorySlug =
    categoryParam === "all" ? undefined : categoryParam;
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

  const routingCategorySlug = resolvedCategorySlug ?? "all";

  const { initialLanguage, initialSkillIds } = useMemo(() => {
    const languageParam = searchParams.get("language");
    const rawSkills = searchParams.get("skills");

    const normalizedLanguage =
      languageParam === "ENGLISH" || languageParam === "POLISH"
        ? (languageParam as ListingLanguage)
        : undefined;

    const skillIds = rawSkills
      ? rawSkills
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
      : [];

    return {
      initialLanguage: normalizedLanguage,
      initialSkillIds: skillIds,
    };
  }, [searchParams]);

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
              currentCategorySlug={resolvedCategorySlug}
            />
            <HomeNav placement="sidebar" />
          </aside>
          <ListingsSectionHeader
            sectionTitle={t("listings.listings")}
            categoryId={categoryId}
            categorySlugForRouting={routingCategorySlug}
            page={page}
            categoryName={categoryNameForHeader}
            initialLanguage={initialLanguage}
            initialSkillIds={initialSkillIds}
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

