"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { type Category, getStoredUser, getToken } from "@/lib/api";
import { CategoryIcon } from "@/components/CategoryIcon";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

export function CategoriesSidebarDesktop({
  categories,
  currentCategorySlug,
}: {
  categories: Category[];
  currentCategorySlug?: string;
}) {
  const { t } = useTranslations();
  const allLabel = t("common.all");
  const [canCreateListing, setCanCreateListing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const user = getStoredUser();
    setIsLoggedIn(!!token);
    setCanCreateListing(!!token && user?.accountType === "CLIENT");
  }, []);

  return (
    <nav className="hidden lg:block">
      <ul className="space-y-1">
        <li>
          <Link
            href="/offers/all/1"
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
              href={`/offers/${encodeURIComponent(cat.slug)}/1`}
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
          <LanguageToggle size="default" className="w-full justify-center" showFullName />
        </div>
      )}
      {canCreateListing && (
        <div className="mt-6">
          <Button asChild variant="default" size="lg" className="w-full justify-start">
            <Link href="/listings/new">
              <Plus className="size-5 shrink-0" aria-hidden />
              {t("listings.newListing")}
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
