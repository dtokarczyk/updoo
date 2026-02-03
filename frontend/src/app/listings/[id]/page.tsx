"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Pencil,
  Tag,
  User,
  Wrench,
  Laptop,
  BarChart3,
} from "lucide-react";
import { getListing, getStoredUser, type Listing } from "@/lib/api";
import { HomeNav } from "@/app/components/HomeNav";
import { Button } from "@/components/ui/button";
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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRate(rate: string, currency: string, billingType: string) {
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

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getListing(id)
      .then(setListing)
      .catch((e) => setError(e instanceof Error ? e.message : "Błąd ładowania"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
        <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
          <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-foreground hover:underline"
            >
              Updoo
            </Link>
            <HomeNav />
          </header>
          <p className="text-muted-foreground">Ładowanie oferty…</p>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
        <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
          <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-foreground hover:underline"
            >
              Updoo
            </Link>
            <HomeNav />
          </header>
          <p className="text-destructive mb-4">{error ?? "Oferta nie istnieje."}</p>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do listy
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  const skills = listing.skills?.map((r) => r.skill.name) ?? [];
  const isOwnListing = user?.id === listing.authorId;
  const isDraft = listing.status === "DRAFT";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-6 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-foreground hover:underline"
          >
            Updoo
          </Link>
          <HomeNav />
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Lista ofert
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl leading-tight">{listing.title}</CardTitle>
                <CardDescription className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {listing.author.name || listing.author.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(listing.createdAt)}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />
                  {listing.category.name}
                </span>
                {isOwnListing && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/listings/${listing.id}/edit`}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edytuj
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            {isDraft && (
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
                Szkic — widoczny tylko dla Ciebie.
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Full description */}
            <section>
              <div className="flex gap-3 items-start mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Opis
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              </div>
            </section>

            {/* Details grid */}
            <section className="grid gap-6 sm:grid-cols-2">
              <DetailRow
                icon={Banknote}
                label="Stawka"
                value={
                  <>
                    {formatRate(listing.rate, listing.currency, listing.billingType)}
                    {listing.rateNegotiable && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · do negocjacji
                      </span>
                    )}
                  </>
                }
              />
              <DetailRow
                icon={Briefcase}
                label="Typ rozliczenia"
                value={BILLING_LABELS[listing.billingType] ?? listing.billingType}
              />
              {listing.billingType === "HOURLY" && listing.hoursPerWeek && (
                <DetailRow
                  icon={Clock}
                  label="Godziny tygodniowo"
                  value={HOURS_LABELS[listing.hoursPerWeek] ?? listing.hoursPerWeek}
                />
              )}
              <DetailRow
                icon={BarChart3}
                label="Poziom doświadczenia"
                value={
                  EXPERIENCE_LABELS[listing.experienceLevel] ?? listing.experienceLevel
                }
              />
              <DetailRow
                icon={Briefcase}
                label="Typ projektu"
                value={
                  PROJECT_TYPE_LABELS[listing.projectType] ?? listing.projectType
                }
              />
              {listing.location && (
                <DetailRow
                  icon={MapPin}
                  label="Lokalizacja"
                  value={listing.location.name}
                />
              )}
              {listing.isRemote && (
                <DetailRow
                  icon={Laptop}
                  label="Praca zdalna"
                  value="Tak"
                />
              )}
            </section>

            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <div className="flex gap-3 items-start">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Umiejętności
                    </p>
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
                  </div>
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
