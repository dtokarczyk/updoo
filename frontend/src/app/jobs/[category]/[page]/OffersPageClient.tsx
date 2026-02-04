"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingRedirect } from "@/app/components/OnboardingRedirect";
import { CategoriesSidebar } from "@/app/components/CategoriesSidebar";
import { HomeNav } from "@/app/components/HomeNav";
import { JobsSectionHeader } from "@/app/components/JobsSectionHeader";
import { AuthPromoSidebar } from "@/app/components/AuthPromoSidebar";
import { AuthBottomBar } from "@/app/components/AuthBottomBar";
import { Logotype } from "@/app/components/Logotype";
import { getToken, getStoredUser, type Category, type JobLanguage } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";
import { type Locale } from "@/lib/i18n";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function parsePageParam(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

// Component that uses useSearchParams - must be wrapped in Suspense
function OffersPageContent({
  categories,
  categoryId,
  categoryNameForHeader,
  routingCategorySlug,
  page,
  isHomePage,
  isLoggedIn,
}: {
  categories: Category[];
  categoryId: string | undefined;
  categoryNameForHeader: string | undefined;
  routingCategorySlug: string;
  page: number;
  isHomePage: boolean;
  isLoggedIn: boolean;
}) {
  const { t } = useTranslations();
  const searchParams = useSearchParams();

  const { initialLanguage, initialSkillIds } = useMemo(() => {
    const languageParam = searchParams.get("language");
    const rawSkills = searchParams.get("skills");

    const normalizedLanguage =
      languageParam === "ENGLISH" || languageParam === "POLISH"
        ? (languageParam as JobLanguage)
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
    <>
      {!isLoggedIn && isHomePage && (
        <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden mb-6">
          <Image
            src="/images/u2844336958_freelancer_woman_at_work_good_mood_macbook_reflex_h_86dbbfef-0bcd-4592-94db-4b415b4965c4.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-start justify-end">
            <div className="px-5 pb-5 w-full">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-left mb-4">
                {t("homepage.heroText")}
              </h1>
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link href="/job/new">
                  {t("jobs.createJob")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      <JobsSectionHeader
        sectionTitle={t("jobs.jobs")}
        categoryId={categoryId}
        categorySlugForRouting={routingCategorySlug}
        page={page}
        categoryName={categoryNameForHeader}
        initialLanguage={initialLanguage}
        initialSkillIds={initialSkillIds}
      />
    </>
  );
}

export function OffersPageClient({
  categories,
  initialLocale,
}: {
  categories: Category[];
  initialLocale: Locale;
}) {
  const { t } = useTranslations();
  const params = useParams<{ category: string; page: string }>();
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
  const isHomePage = routingCategorySlug === "all" && page === 1;

  return (
    <OnboardingRedirect>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          <aside className="z-10 shrink-0 lg:sticky lg:top-14 lg:self-start lg:w-1/5">
            <div className="hidden items-center justify-between lg:flex lg:pb-4">
              <Logotype initialLocale={initialLocale} />
              <ThemeToggle />
            </div>
            <CategoriesSidebar
              categories={categories}
              currentCategorySlug={resolvedCategorySlug}
              initialLocale={initialLocale}
            />
            <HomeNav placement="sidebar" />
          </aside>
          <div className="min-w-0 lg:w-3/5 pt-0 lg:pt-14">
            <Suspense fallback={<div className="h-96" />}>
              <OffersPageContent
                categories={categories}
                categoryId={categoryId}
                categoryNameForHeader={categoryNameForHeader}
                routingCategorySlug={routingCategorySlug}
                page={page}
                isHomePage={isHomePage}
                isLoggedIn={isLoggedIn}
              />
            </Suspense>
          </div>
          {!isLoggedIn && (
            <aside className="sticky top-0 z-10 hidden shrink-0 lg:top-14 lg:block lg:self-start lg:w-1/5">
              <AuthPromoSidebar />
            </aside>
          )}
        </div>
      </div>
      {!isLoggedIn && <AuthBottomBar initialLocale={initialLocale} />}
    </OnboardingRedirect>
  );
}

