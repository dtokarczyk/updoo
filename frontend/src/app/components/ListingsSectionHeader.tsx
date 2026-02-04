"use client";

import { useState } from "react";
import { ListingsFeed } from "@/app/components/ListingsFeed";
import type { ListingLanguage } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";
import { useRouter, useSearchParams } from "next/navigation";

export function ListingsSectionHeader({
  sectionTitle,
  categoryId,
}: {
  sectionTitle: string;
  categoryId?: string;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [count, setCount] = useState<number | null>(null);
  const [language, setLanguage] = useState<"" | ListingLanguage>("");

  const LANGUAGE_OPTIONS: { value: "" | ListingLanguage; label: string }[] = [
    { value: "", label: t("listings.allLanguages") },
    { value: "ENGLISH", label: t("listings.english") },
    { value: "POLISH", label: t("listings.polish") },
  ];

  const titleWithCount =
    count !== null ? `${sectionTitle} (${count})` : sectionTitle;

  return (
    <section className="flex-1 min-w-0 space-y-6 lg:max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-foreground">
          {titleWithCount}
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => {
              setLanguage((e.target.value || "") as "" | ListingLanguage);
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", "1");
              router.replace(`/?${params.toString()}`, { scroll: false });
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={t("listings.filterByLanguage")}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ListingsFeed
        categoryId={categoryId}
        language={language || undefined}
        onCountChange={setCount}
      />
    </section>
  );
}
