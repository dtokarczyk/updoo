"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type Category } from "@/lib/api";
import { cn } from "@/lib/utils";

const ALL_LABEL = "Wszystkie";

export function CategoriesSidebarMobile({
  categories,
  currentCategorySlug,
}: {
  categories: Category[];
  currentCategorySlug?: string;
}) {
  const [open, setOpen] = useState(false);

  const currentLabel = currentCategorySlug
    ? categories.find((c) => c.slug === currentCategorySlug)?.name ?? ALL_LABEL
    : ALL_LABEL;

  return (
    <nav className="lg:hidden py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2.5 text-xl font-semibold text-foreground"
        aria-expanded={open}
      >
        {currentLabel}
        {open ? (
          <ChevronUp className="size-6 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="size-6 shrink-0" aria-hidden />
        )}
      </button>
      <ul
        className={cn(
          "space-y-1 overflow-hidden transition-[max-height] duration-200 ease-in-out pt-1",
          open ? "max-h-200" : "max-h-0"
        )}
      >
        <li>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "block py-1 text-xl font-semibold transition-colors",
              !currentCategorySlug
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {ALL_LABEL}
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/?category=${encodeURIComponent(cat.slug)}`}
              onClick={() => setOpen(false)}
              className={cn(
                "block py-1 text-xl font-semibold transition-colors",
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
