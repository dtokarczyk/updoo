"use client";

import { useEffect, useState } from "react";
import { getListingsFeed, type Listing } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{listing.title}</CardTitle>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {listing.category.name}
          </span>
        </div>
        <CardDescription className="text-xs">
          {listing.author.name || listing.author.email} ·{" "}
          {formatDate(listing.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
          {listing.description}
        </p>
      </CardContent>
    </Card>
  );
}

export function ListingsFeed() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getListingsFeed(50)
      .then((res) => setListings(res.items))
      .catch(() => setError("Nie udało się załadować ogłoszeń"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Ładowanie ogłoszeń...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">{error}</div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
        Brak ogłoszeń. Dodaj pierwsze ogłoszenie!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
