"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  getListingsFeed,
  publishListing,
  getStoredUser,
  type Listing,
  type ListingLanguage,
  type PaginationInfo,
} from "@/lib/api";
import { ListingPost } from "@/app/components/ListingPost";
import { Button } from "@/components/ui/button";

const VISITED_LISTINGS_KEY = "visitedListings";
const FEED_STATE_KEY = "listingsFeedState";

type FeedState = {
  page: number;
  scrollY: number;
  categoryId?: string;
  language?: ListingLanguage;
};

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

function readFeedState(): FeedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FEED_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FeedState>;
    if (typeof parsed.page !== "number") return null;
    if (typeof parsed.scrollY !== "number") return null;
    return {
      page: parsed.page,
      scrollY: parsed.scrollY,
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : undefined,
      language: parsed.language === "POLISH" || parsed.language === "ENGLISH" ? parsed.language : undefined,
    };
  } catch {
    return null;
  }
}

function writeFeedState(state: FeedState) {
  try {
    window.sessionStorage.setItem(FEED_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (e.g. private mode / quota)
  }
}

function clearFeedState() {
  try {
    window.sessionStorage.removeItem(FEED_STATE_KEY);
  } catch {
    // Ignore storage errors (e.g. private mode / quota)
  }
}

export function ListingsFeed({
  categoryId,
  categorySlug,
  page,
  language,
  onCountChange,
}: {
  categoryId?: string;
  categorySlug: string;
  page: number;
  language?: ListingLanguage;
  onCountChange?: (count: number) => void;
}) {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const user = getStoredUser();

  const loadFeed = useCallback(
    (currentPage: number = page, opts?: { restoreScrollY?: number }) => {
      setLoading(true);
      getListingsFeed(currentPage, 15, categoryId, language)
        .then((res) => {
          setListings(res.items);
          setPagination(res.pagination);
          onCountChange?.(res.pagination.total);
          if (opts?.restoreScrollY != null) {
            // Wait for DOM paint before restoring scroll position
            requestAnimationFrame(() => {
              window.scrollTo({ top: opts.restoreScrollY ?? 0 });
            });
            clearFeedState();
          }
        })
        .catch(() => {
          setError("Nie udało się załadować ogłoszeń");
          onCountChange?.(0);
        })
        .finally(() => setLoading(false));
    },
    [categoryId, language, onCountChange, page]
  );

  useEffect(() => {
    setVisitedIds(readVisitedListings());
    const restored = readFeedState();
    const matchesFilters =
      restored &&
      (restored.categoryId ?? undefined) === (categoryId ?? undefined) &&
      (restored.language ?? undefined) === (language ?? undefined) &&
      restored.page === page;

    if (restored && matchesFilters) {
      loadFeed(page, { restoreScrollY: restored.scrollY });
      return;
    }

    loadFeed(page);
  }, [loadFeed, categoryId, language, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return;
    router.replace(`/offers/${encodeURIComponent(categorySlug)}/${newPage}`);
  };

  const markVisited = (listingId: string) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      next.add(listingId);
      writeVisitedListings(next);
      return next;
    });
  };

  const handleNavigateToListing = (listingId: string) => {
    markVisited(listingId);
    writeFeedState({
      page,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      categoryId,
      language,
    });
  };

  const handlePublish = (listingId: string) => {
    setPublishingId(listingId);
    publishListing(listingId)
      .then(() => loadFeed(page))
      .catch(() => setError("Nie udało się opublikować ogłoszenia"))
      .finally(() => setPublishingId(null));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border bg-card shadow-sm animate-pulse"
          >
            <div className="border-b px-4 py-4 sm:px-6 sm:py-4">
              <div className="h-5 w-3/4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="h-4 w-24 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
                <div className="h-4 w-32 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="h-10 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
                <div className="h-10 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
              </div>
              <div className="h-4 w-full rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-4 w-3/4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-7 w-16 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80"
                  />
                ))}
              </div>
              <div className="h-10 w-32 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
            </div>
          </div>
        ))}
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
        const isApplied =
          !!listing.currentUserApplied && user?.accountType === "FREELANCER";
        const isFavorite = !!listing.isFavorite;
        return (
          <div
            key={listing.id}
            className={[
              isDraft
                ? "overflow-hidden rounded-xl shadow-sm border border-amber-300/80 dark:border-amber-700/80"
                : "",
              isApplied && !isDraft
                ? "overflow-hidden rounded-xl shadow-sm border border-emerald-500/80 dark:border-emerald-500/80"
                : "",
              isFavorite && !isDraft
                ? "overflow-hidden rounded-xl shadow-sm border border-yellow-400/80 dark:border-yellow-500/80"
                : "",
              !isVisited && !isDraft && !isApplied && !isFavorite
                ? "rounded-xl border border-primary/80 dark:border-primary/90"
                : "",
            ].filter(Boolean).join(" ")}
          >
            <ListingPost
              listing={listing}
              isDraft={isDraft}
              showFavorite={!!user}
              onNavigate={() => handleNavigateToListing(listing.id)}
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
                  {isApplied && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100 px-2 py-0.5 text-xs font-medium">
                      Zgłosiłeś się
                    </span>
                  )}
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Poprzednia
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Następna
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {pagination && (
        <div className="text-center text-sm text-muted-foreground pt-2">
          Strona {pagination.page} z {pagination.totalPages} ({pagination.total} ogłoszeń)
        </div>
      )}
    </div>
  );
}
