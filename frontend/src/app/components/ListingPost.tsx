"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Clock, Settings2 } from "lucide-react";
import type { Listing } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const formatted = r.toLocaleString("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return billingType === "HOURLY"
    ? `${formatted} ${currency}/h`
    : `${formatted} ${currency}`;
}

function formatPostedAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pl });
}

export function ListingPost({
  listing,
  headerAction,
  isDraft,
}: {
  listing: Listing;
  headerAction?: React.ReactNode;
  isDraft?: boolean;
}) {
  const skills = listing.skills?.map((r) => r.skill.name) ?? [];
  const shortDescription = truncateDescription(
    listing.description,
    LISTING_DESCRIPTION_MAX_LENGTH
  );
  const metaPosted = formatPostedAgo(listing.createdAt);
  const firstFieldLabel = EXPERIENCE_LABELS[listing.experienceLevel] ?? listing.experienceLevel;
  const firstFieldSub = "Poziom doświadczenia";
  const secondFieldLabel = formatRate(
    listing.rate,
    listing.currency,
    listing.billingType
  );
  const secondFieldSub = listing.billingType === "HOURLY" ? "Stawka godzinowa" : "Stawka";

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm",
        isDraft
          ? "rounded-t-xl rounded-b-none border-amber-400 border-b-0 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-600 dark:border-b-0"
          : "rounded-xl"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl font-bold leading-tight text-foreground">
              <Link
                href={`/listings/${listing.id}`}
                className="hover:underline focus:outline-none focus:underline"
              >
                {listing.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Opublikowano {metaPosted}
            </p>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
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
                {secondFieldLabel}
                {listing.rateNegotiable && " (do negocjacji)"}
              </p>
              <p className="text-sm text-muted-foreground">{secondFieldSub}</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-foreground">{shortDescription}</p>

        {skills.length > 0 && (
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
        )}

        <Button asChild variant="default" size="lg" className="mt-2">
          <Link href={`/listings/${listing.id}`}>Zobacz więcej</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
