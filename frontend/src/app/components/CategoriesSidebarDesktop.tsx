"use client";

import Link from "next/link";
import { type Category } from "@/lib/api";
import { cn } from "@/lib/utils";

export function CategoriesSidebarDesktop({
  categories,
  currentCategorySlug,
}: {
  categories: Category[];
  currentCategorySlug?: string;
}) {
  return (
    <nav className="hidden lg:block">
      <ul className="space-y-2">
        <li>
          <Link
            href="/"
            className={cn(
              "block py-1.5 text-xl font-semibold transition-colors",
              !currentCategorySlug
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Wszystkie
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/?category=${encodeURIComponent(cat.slug)}`}
              className={cn(
                "block py-1.5 text-xl font-semibold transition-colors",
                currentCategorySlug === cat.slug
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
