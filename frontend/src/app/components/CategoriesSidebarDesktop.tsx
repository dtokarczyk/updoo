"use client";

import Link from "next/link";
import { type Category } from "@/lib/api";
import { CategoryIcon } from "@/components/CategoryIcon";
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

  return (
    <nav className="hidden lg:block">
      <ul className="space-y-2">
        <li>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 py-1.5 text-xl font-semibold transition-colors",
              !currentCategorySlug
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <CategoryIcon categorySlug="" categoryName={allLabel} className="size-5 shrink-0" />
            {allLabel}
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/?category=${encodeURIComponent(cat.slug)}`}
              className={cn(
                "flex items-center gap-2 py-1.5 text-xl font-semibold transition-colors",
                currentCategorySlug === cat.slug
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CategoryIcon
                categorySlug={cat.slug}
                categoryName={cat.name}
                className="size-5 shrink-0"
              />
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
