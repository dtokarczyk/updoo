"use client";

import { useState } from "react";
import { HomeNav } from "@/app/components/HomeNav";
import { ListingsFeed } from "@/app/components/ListingsFeed";
import type { ListingLanguage } from "@/lib/api";

const LANGUAGE_OPTIONS: { value: "" | ListingLanguage; label: string }[] = [
  { value: "", label: "Wszystkie" },
  { value: "ENGLISH", label: "English" },
  { value: "POLISH", label: "Polish" },
];

export function ListingsSectionHeader({
  sectionTitle,
  categoryId,
}: {
  sectionTitle: string;
  categoryId?: string;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [language, setLanguage] = useState<"" | ListingLanguage>("");

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
            onChange={(e) => setLanguage((e.target.value || "") as "" | ListingLanguage)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filtruj po języku ogłoszenia"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <HomeNav showCreateOnly />
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
