"use client";

import { CategoriesSidebarDesktop } from "@/app/components/CategoriesSidebarDesktop";
import { CategoriesSidebarMobile } from "@/app/components/CategoriesSidebarMobile";
import { type Category } from "@/lib/api";

export function CategoriesSidebar({
  categories,
  currentCategorySlug,
}: {
  categories: Category[];
  currentCategorySlug?: string;
}) {
  return (
    <>
      <CategoriesSidebarDesktop
        categories={categories}
        currentCategorySlug={currentCategorySlug}
      />
      <CategoriesSidebarMobile
        categories={categories}
        currentCategorySlug={currentCategorySlug}
      />
    </>
  );
}
