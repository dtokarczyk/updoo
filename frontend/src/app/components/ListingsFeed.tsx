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

const BILLING_LABELS: Record<string, string> = {
  FIXED: "Ryczałt",
  HOURLY: "Godzinowo",
};

const HOURS_LABELS: Record<string, string> = {
  LESS_THAN_10: "< 10 h/tydz.",
  FROM_11_TO_20: "11–20 h/tydz.",
  FROM_21_TO_30: "21–30 h/tydz.",
  MORE_THAN_30: "> 30 h/tydz.",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "Junior",
  MID: "Mid",
  SENIOR: "Senior",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: "Jednorazowy",
  CONTINUOUS: "Ciągły",
};

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

function formatRate(rate: string, currency: string, billingType: string) {
  const r = parseFloat(rate);
  if (Number.isNaN(r)) return "";
  const formatted = r.toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return billingType === "HOURLY" ? `${formatted} ${currency}/h` : `${formatted} ${currency}`;
}

function ListingCard({ listing }: { listing: Listing }) {
  const skills = listing.skills?.map((r) => r.skill.name) ?? [];
  const hasDetails =
    listing.billingType ||
    listing.rate ||
    listing.experienceLevel ||
    listing.location ||
    listing.isRemote ||
    listing.projectType ||
    skills.length > 0;

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
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
          {listing.description}
        </p>
        {hasDetails && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
            {listing.billingType && (
              <span>{BILLING_LABELS[listing.billingType] ?? listing.billingType}</span>
            )}
            {listing.billingType === "HOURLY" && listing.hoursPerWeek && (
              <span>{HOURS_LABELS[listing.hoursPerWeek] ?? listing.hoursPerWeek}</span>
            )}
            {listing.rate && (
              <span className="font-medium text-foreground">
                {formatRate(listing.rate, listing.currency, listing.billingType)}
              </span>
            )}
            {listing.experienceLevel && (
              <span>{EXPERIENCE_LABELS[listing.experienceLevel] ?? listing.experienceLevel}</span>
            )}
            {listing.location && <span>{listing.location.name}</span>}
            {listing.isRemote && <span>Remote</span>}
            {listing.projectType && (
              <span>{PROJECT_TYPE_LABELS[listing.projectType] ?? listing.projectType}</span>
            )}
            {skills.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {skills.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground"
                  >
                    {name}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
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
