"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { type Category, getStoredUser, getToken } from "@/lib/api";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

export function CategoriesSidebarMobile({
  categories,
  currentCategorySlug,
}: {
  categories: Category[];
  currentCategorySlug?: string;
}) {
  const { t } = useTranslations();
  const allLabel = t("common.all");
  const [open, setOpen] = useState(false);
  const [canCreateListing, setCanCreateListing] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    setCanCreateListing(!!token && user?.accountType === "CLIENT");
  }, []);

  const currentLabel = currentCategorySlug
    ? categories.find((c) => c.slug === currentCategorySlug)?.name ?? allLabel
    : allLabel;

  return (
    <nav className="lg:hidden py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between gap-2 text-xl font-semibold text-foreground",
            "rounded-md border border-input bg-background px-3 shadow-sm",
            "py-2.5",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-expanded={open}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <CategoryIcon categoryName={currentLabel} className="h-9 w-9 shrink-0" />
            {currentLabel}
          </span>
          {open ? (
            <ChevronUp className="size-6 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="size-6 shrink-0" aria-hidden />
          )}
        </button>
        {canCreateListing && (
          <Link href="/listings/new" onClick={() => setOpen(false)} className="shrink-0">
            <Button
              type="button"
              size="icon"
              className="size-11 rounded-md"
              aria-label={t("listings.newListing")}
            >
              <Plus className="size-5" aria-hidden />
            </Button>
          </Link>
        )}
      </div>
      <ul
        className={cn(
          "space-y-1 overflow-hidden transition-[max-height] duration-200 ease-in-out pt-1",
          open ? "max-h-200" : "max-h-0"
        )}
      >
        {currentCategorySlug && (
          <li>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-xl font-semibold transition-colors",
                !currentCategorySlug
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CategoryIcon categoryName={allLabel} className="h-9 w-9 shrink-0" />
              {allLabel}
            </Link>
          </li>
        )}
        {categories
          .filter((cat) => cat.slug !== currentCategorySlug)
          .map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/?category=${encodeURIComponent(cat.slug)}`}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-xl font-semibold transition-colors",
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
    </nav>
  );
}
