"use client";

import { useState } from "react";
import { HomeNav } from "@/app/components/HomeNav";
import { ListingsFeed } from "@/app/components/ListingsFeed";

export function ListingsSectionHeader({
  sectionTitle,
  categoryId,
}: {
  sectionTitle: string;
  categoryId?: string;
}) {
  const [count, setCount] = useState<number | null>(null);

  const titleWithCount =
    count !== null ? `${sectionTitle} (${count})` : sectionTitle;

  return (
    <section className="flex-1 min-w-0 space-y-6 lg:max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">
          {titleWithCount}
        </h2>
        <HomeNav showCreateOnly />
      </div>
      <ListingsFeed categoryId={categoryId} onCountChange={setCount} />
    </section>
  );
}
