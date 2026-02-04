"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { type Category, getStoredUser, getToken } from "@/lib/api";
import { CategoryIcon } from "@/components/CategoryIcon";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUserLocale, type Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/translations";

export function CategoriesSidebarDesktop({
  categories,
  currentCategorySlug,
  initialLocale,
}: {
  categories: Category[];
  currentCategorySlug?: string;
  initialLocale?: Locale;
}) {
  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? getUserLocale());
  const [mounted, setMounted] = useState(false);
  const [canCreateJob, setCanCreateJob] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Update locale after mount if client locale differs from initial locale
  useEffect(() => {
    setMounted(true);
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      setLocaleState(currentLocale);
    }
    const token = getToken();
    const user = getStoredUser();
    setIsLoggedIn(!!token);
    setCanCreateJob(!!token && user?.accountType === "CLIENT");
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  const allLabel = t("common.all");

  return (
    <nav className="hidden lg:block">
      <ul className="space-y-1">
        <li>
          <Link
            href="/jobs/all/1"
            className={cn(
              "flex items-center gap-3 py-1.5 text-xl font-semibold transition-colors",
              !currentCategorySlug
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CategoryIcon categoryName={allLabel} className="h-9 w-9 shrink-0" />
            {allLabel}
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/jobs/${encodeURIComponent(cat.slug)}/1`}
              className={cn(
                "flex items-center gap-3 py-1.5 text-xl font-semibold transition-colors",
                currentCategorySlug === cat.slug
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CategoryIcon
                categoryName={cat.name}
                className="h-9 w-9 shrink-0"
              />
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
      {mounted && !isLoggedIn && (
        <div className="mt-6">
          <LanguageToggle size="default" className="w-full justify-center" showFullName initialLocale={initialLocale} />
        </div>
      )}
      {canCreateJob && (
        <div className="mt-6">
          <Button asChild variant="default" size="lg" className="w-full justify-start">
            <Link href="/jobs/new">
              <Plus className="size-5 shrink-0" aria-hidden />
              {t("jobs.newJob")}
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
