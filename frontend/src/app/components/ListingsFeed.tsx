"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getListingsFeed, publishListing, getStoredUser, type Listing, type ListingLanguage } from "@/lib/api";
import { ListingPost } from "@/app/components/ListingPost";
import { Button } from "@/components/ui/button";

const VISITED_LISTINGS_KEY = "visitedListings";

function readVisitedListings(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(VISITED_LISTINGS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeVisitedListings(ids: Set<string>) {
  try {
    window.localStorage.setItem(VISITED_LISTINGS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage errors (e.g. private mode / quota)
  }
}

export function ListingsFeed({
  categoryId,
  language,
  onCountChange,
}: {
  categoryId?: string;
  language?: ListingLanguage;
  onCountChange?: (count: number) => void;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const user = getStoredUser();

  const loadFeed = () => {
    setLoading(true);
    getListingsFeed(50, undefined, categoryId, language)
      .then((res) => {
        setListings(res.items);
        onCountChange?.(res.items.length);
      })
      .catch(() => {
        setError("Nie udało się załadować ogłoszeń");
        onCountChange?.(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setVisitedIds(readVisitedListings());
    loadFeed();
  }, [categoryId, language]);

  const markVisited = (listingId: string) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      next.add(listingId);
      writeVisitedListings(next);
      return next;
    });
  };

  const handlePublish = (listingId: string) => {
    setPublishingId(listingId);
    publishListing(listingId)
      .then(() => loadFeed())
      .catch(() => setError("Nie udało się opublikować ogłoszenia"))
      .finally(() => setPublishingId(null));
  };

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
      {listings.map((listing) => {
        const isDraft = listing.status === "DRAFT";
        const canPublish = user?.accountType === "ADMIN" && isDraft;
        const isOwnListing = user?.id === listing.authorId;
        const isVisited = visitedIds.has(listing.id);
        return (
          <div
            key={listing.id}
            className={[
              isDraft
                ? "overflow-hidden rounded-xl shadow-sm border border-amber-300/80 dark:border-amber-700/80"
                : "",
              isVisited ? "opacity-70" : "",
            ].filter(Boolean).join(" ")}
          >
            <ListingPost
              listing={listing}
              isDraft={isDraft}
              showFavorite={!!user}
              onNavigate={() => markVisited(listing.id)}
              onFavoriteToggle={(listingId) =>
                setListings((prev) =>
                  prev.map((l) =>
                    l.id === listingId
                      ? { ...l, isFavorite: !l.isFavorite }
                      : l
                  )
                )
              }
              headerAction={
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {listing.category.name}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {listing.language === "ENGLISH" ? "English" : "Polish"}
                  </span>
                  {isOwnListing && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                      <Link
                        href={`/listings/${listing.id}/edit`}
                        aria-label="Edytuj ogłoszenie"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              }
            />
            {isDraft && (
              <div className="bg-amber-200/90 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 border-t border-amber-300/80 dark:border-amber-700/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  Czeka na akceptację administratora. Widoczny tylko dla autora.
                </p>
                {canPublish && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-amber-700 hover:bg-amber-800 text-amber-50 dark:bg-amber-600 dark:hover:bg-amber-700 shrink-0"
                    onClick={() => handlePublish(listing.id)}
                    disabled={publishingId === listing.id}
                  >
                    {publishingId === listing.id ? "Publikowanie…" : "Opublikuj"}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
