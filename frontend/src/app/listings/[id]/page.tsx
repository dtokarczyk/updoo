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
  Send,
  Tag,
  User,
  Users,
  Wrench,
  Laptop,
  BarChart3,
} from "lucide-react";
import {
  getListing,
  applyToListing,
  getStoredUser,
  authorDisplayName,
  isApplicationFull,
  type Listing,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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

function getDeadlineRemainingDays(deadline: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  const now = new Date();
  if (end <= now) return 0;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function formatDeadlineRemaining(deadline: string | null): string | null {
  const days = getDeadlineRemainingDays(deadline);
  if (days === null) return null;
  if (days === 0) return "Termin zbierania ofert minął";
  if (days === 1) return "Pozostał 1 dzień";
  if (days < 5) return `Pozostały ${days} dni`;
  return `Pozostało ${days} dni`;
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
  const [applyMessage, setApplyMessage] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="text-muted-foreground">Ładowanie oferty…</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-destructive">{error ?? "Oferta nie istnieje."}</p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Link>
        </Button>
      </div>
    );
  }

  const skills = listing.skills?.map((r) => r.skill.name) ?? [];
  const isOwnListing = user?.id === listing.authorId;
  const isDraft = listing.status === "DRAFT";
  const deadlinePassed = listing.deadline
    ? getDeadlineRemainingDays(listing.deadline) === 0
    : false;
  const canApply =
    user?.accountType === "FREELANCER" &&
    !isOwnListing &&
    !isDraft &&
    !deadlinePassed &&
    !listing.currentUserApplied;
  const applications = listing.applications ?? [];

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !canApply) return;
    setApplySubmitting(true);
    setApplyError(null);
    try {
      await applyToListing(id, applyMessage || undefined);
      const updated = await getListing(id);
      setListing(updated);
      setApplyMessage("");
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : "Błąd zgłoszenia");
    } finally {
      setApplySubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
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
                  {authorDisplayName(listing.author) || listing.author.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(listing.createdAt)}
                </span>
                {listing.deadline && formatDeadlineRemaining(listing.deadline) && (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDeadlineRemaining(listing.deadline)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {listing.category.name}
              </span>
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                {listing.language === "ENGLISH" ? "English" : "Polish"}
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
            {listing.deadline && (
              <DetailRow
                icon={Clock}
                label="Termin zbierania ofert"
                value={formatDeadlineRemaining(listing.deadline) ?? undefined}
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

          {/* Freelancer applications: full data for author, initials for others */}
          {applications.length > 0 && (
            <section>
              <div className="flex gap-3 items-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Zgłoszenia ({applications.length})
                  </p>
                  {isOwnListing ? (
                    <div className="space-y-4">
                      {applications.map((app) =>
                        isApplicationFull(app) ? (
                          <div
                            key={app.id}
                            className="rounded-lg border bg-muted/30 p-3 space-y-1.5"
                          >
                            <p className="font-medium text-foreground">
                              {authorDisplayName(app.freelancer) || app.freelancer.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {app.freelancer.email}
                            </p>
                            {app.message && (
                              <p className="text-sm whitespace-pre-wrap pt-1 border-t mt-2">
                                {app.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(app.createdAt)}
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {applications.map((app) => (
                        <span
                          key={app.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-foreground"
                          title="Zgłoszony freelancer"
                        >
                          {"freelancerInitials" in app
                            ? app.freelancerInitials || "?"
                            : "?"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Apply form (freelancer, before deadline, not own listing) */}
          {user?.accountType === "FREELANCER" && !isOwnListing && !isDraft && (
            <section className="border-t pt-6">
              {listing.currentUserApplied ? (
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-3 py-2 text-sm">
                  Zgłosiłeś się do tej oferty.
                </div>
              ) : deadlinePassed ? (
                <p className="text-sm text-muted-foreground">
                  Termin zgłoszeń minął. Nie można już się zgłosić.
                </p>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Zgłoś się do oferty
                  </p>
                  <Textarea
                    placeholder="Opcjonalna wiadomość do zleceniodawcy…"
                    value={applyMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setApplyMessage(e.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    className="resize-none"
                    disabled={applySubmitting}
                  />
                  {applyError && (
                    <p className="text-sm text-destructive">{applyError}</p>
                  )}
                  <Button type="submit" disabled={applySubmitting}>
                    {applySubmitting ? (
                      "Wysyłanie…"
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Zgłoś się
                      </>
                    )}
                  </Button>
                </form>
              )}
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
