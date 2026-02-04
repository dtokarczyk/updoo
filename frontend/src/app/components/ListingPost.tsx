"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, formatDuration, intervalToDuration } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Calendar, Clock, Settings2, Star } from "lucide-react";
import type { Listing } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
};

const LISTING_DESCRIPTION_MAX_LENGTH = 200;

function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

function formatRate(rate: string, currency: string, billingType: string): string {
  const r = parseFloat(rate);
  if (Number.isNaN(r)) return "";
  const rounded = Math.round(r);
  const formatted = rounded.toLocaleString("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatted;
}

function formatPostedAgo(iso: string, locale: "pl" | "en"): string {
  const dateFnsLocale = locale === "en" ? enUS : pl;
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: dateFnsLocale });
}

function formatTimeLeftUntil(iso: string, locale: "pl" | "en", t: (key: string, params?: Record<string, string | number>) => string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const msLeft = d.getTime() - Date.now();
  if (msLeft <= 0) return t("listings.deadlinePassed");

  const duration = intervalToDuration({
    start: Date.now(),
    end: d.getTime(),
  });

  const daysLeft = duration.days ?? 0;
  if (daysLeft === 0) {
    const hoursLeft = duration.hours ?? 0;
    if (hoursLeft === 0) {
      const minutesLeft = duration.minutes ?? 0;
      return t("listings.deadlineRemainingMinutes", { minutes: minutesLeft });
    }
    return t("listings.deadlineRemainingHours", { hours: hoursLeft });
  }

  if (daysLeft === 1) {
    return t("listings.deadlineRemaining1");
  }

  if (daysLeft < 5) {
    return t("listings.deadlineRemainingFew", { days: daysLeft });
  }

  return t("listings.deadlineRemainingMany", { days: daysLeft });
}

export function ListingPost({
  listing,
  headerAction,
  isDraft,
  onFavoriteToggle,
  onNavigate,
  showFavorite,
}: {
  listing: Listing;
  headerAction?: React.ReactNode;
  isDraft?: boolean;
  /** Called after favorite add/remove; parent can refetch. */
  onFavoriteToggle?: (listingId: string) => void;
  /** Called when user navigates to listing details. */
  onNavigate?: () => void;
  /** When true, show star in top-right (e.g. when user is logged in). */
  showFavorite?: boolean;
}) {
  const isFavorite = Boolean(listing.isFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoriteLoading || !onFavoriteToggle) return;
    setFavoriteLoading(true);
    try {
      const { addFavorite, removeFavorite } = await import("@/lib/api");
      if (isFavorite) await removeFavorite(listing.id);
      else await addFavorite(listing.id);
      onFavoriteToggle(listing.id);
    } catch {
      // Error could be shown via toast; for now just ignore
    } finally {
      setFavoriteLoading(false);
    }
  };
  const { t, locale } = useTranslations();
  const skills = listing.skills?.map((r) => r.skill.name) ?? [];
  const shortDescription = truncateDescription(
    listing.description,
    LISTING_DESCRIPTION_MAX_LENGTH
  );
  const metaPosted = formatPostedAgo(listing.createdAt, locale);
  const metaDeadlineLeft = listing.deadline ? formatTimeLeftUntil(listing.deadline, locale, t) : "";
  const firstFieldLabel = EXPERIENCE_LABELS[listing.experienceLevel] ?? listing.experienceLevel;
  const firstFieldSub = t("listings.experienceLevel");
  const secondFieldLabel = formatRate(
    listing.rate,
    listing.currency,
    listing.billingType
  );
  const secondFieldSub = listing.billingType === "HOURLY" ? t("listings.hourlyRate") : t("listings.rate");

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm",
        isDraft
          ? "rounded-t-xl rounded-b-none border-0 bg-amber-50 dark:bg-amber-950/30"
          : "rounded-xl"
      )}
    >
      <CardHeader className="pb-2">
        {(headerAction || showFavorite) && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">{headerAction}</div>
            {showFavorite && (
              <button
                type="button"
                onClick={handleFavoriteClick}
                disabled={favoriteLoading}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label={isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    isFavorite
                      ? "fill-yellow-500 text-yellow-500"
                      : "fill-none text-muted-foreground"
                  )}
                />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl font-bold leading-tight text-foreground">
              <Link
                href={`/listings/${listing.id}`}
                scroll={false}
                className="hover:underline focus:outline-none focus:underline"
                onClick={onNavigate}
              >
                {listing.title}
              </Link>
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                {t("listings.published")} {metaPosted}
              </span>
              {metaDeadlineLeft && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden />
                  {metaDeadlineLeft}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{firstFieldLabel}</p>
              <p className="text-sm text-muted-foreground">{firstFieldSub}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {secondFieldLabel}
                </span>
                <span className="ml-1">
                  {listing.currency}
                  {listing.billingType === "HOURLY" ? "/h" : ""}
                </span>
                {listing.rateNegotiable && ` (${t("listings.negotiable")})`}
              </p>
              <p className="text-sm text-muted-foreground">{secondFieldSub}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-foreground">{shortDescription}</p>

        {skills.length > 0 ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                >
                  {name}
                </span>
              ))}
            </div>

            <Button
              asChild
              variant="default"
              size="lg"
              className="mt-2 shrink-0"
            >
              <Link href={`/listings/${listing.id}`} scroll={false} onClick={onNavigate}>
                {t("listings.seeMore")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              asChild
              variant="default"
              size="lg"
              className="mt-2 shrink-0"
            >
              <Link href={`/listings/${listing.id}`} scroll={false} onClick={onNavigate}>
                {t("listings.seeMore")}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
