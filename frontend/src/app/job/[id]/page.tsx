"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag";
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
  getJob,
  applyToJob,
  getStoredUser,
  authorDisplayName,
  isApplicationFull,
  type Job,
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
import { useTranslations } from "@/hooks/useTranslations";
import { format } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { intervalToDuration } from "date-fns";

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

function formatDate(iso: string, locale: "pl" | "en"): string {
  const dateFnsLocale = locale === "en" ? enUS : pl;
  const date = new Date(iso);
  return format(date, "d MMMM yyyy 'at' HH:mm", { locale: dateFnsLocale });
}

function getDeadlineRemainingDays(deadline: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  const now = new Date();
  if (end <= now) return 0;
  const ms = end.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function formatDeadlineRemaining(deadline: string | null, locale: "pl" | "en", t: (key: string, params?: Record<string, string | number>) => string): string | null {
  if (!deadline) return null;
  const end = new Date(deadline);
  const now = new Date();
  if (end <= now) return t("jobs.deadlinePassed");

  const duration = intervalToDuration({
    start: now,
    end: end.getTime(),
  });

  const daysLeft = duration.days ?? 0;
  if (daysLeft === 0) {
    const hoursLeft = duration.hours ?? 0;
    if (hoursLeft === 0) {
      const minutesLeft = duration.minutes ?? 0;
      return t("jobs.deadlineRemainingMinutes", { minutes: minutesLeft });
    }
    return t("jobs.deadlineRemainingHours", { hours: hoursLeft });
  }

  if (daysLeft === 1) {
    return t("jobs.deadlineRemaining1");
  }

  if (daysLeft < 5) {
    return t("jobs.deadlineRemainingFew", { days: daysLeft });
  }

  return t("jobs.deadlineRemainingMany", { days: daysLeft });
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

export default function JobDetailPage() {
  const { t, locale } = useTranslations();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [lastApplicationMessage, setLastApplicationMessage] = useState<string | null>(
    null
  );
  const user = getStoredUser();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getJob(id)
      .then((data) => {
        setJob(data);
        const backendMessage = data.currentUserApplicationMessage;
        if (backendMessage && backendMessage.trim().length > 0) {
          setLastApplicationMessage(backendMessage);
        } else if (data.currentUserApplied && data.applications && data.applications.length > 0) {
          const maybeOwnApplication = data.applications.find(isApplicationFull);
          if (maybeOwnApplication && maybeOwnApplication.message) {
            setLastApplicationMessage(maybeOwnApplication.message);
          }
        }
      })
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

  if (error || !job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-destructive">{error ?? t("jobs.jobNotFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/offers/all/1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("jobs.backToList")}
          </Link>
        </Button>
      </div>
    );
  }

  const skills = job.skills?.map((r) => r.skill.name) ?? [];
  const isOwnJob = user?.id === job.authorId;
  const isDraft = job.status === "DRAFT";
  const deadlinePassed = job.deadline
    ? getDeadlineRemainingDays(job.deadline) === 0
    : false;
  const canApply =
    user?.accountType === "FREELANCER" &&
    !isOwnJob &&
    !isDraft &&
    !deadlinePassed &&
    !job.currentUserApplied;
  const applications = job.applications ?? [];

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !canApply) return;
    const messageToSend = applyMessage.trim();
    setLastApplicationMessage(messageToSend || null);
    setApplySubmitting(true);
    setApplyError(null);
    try {
      await applyToJob(id, messageToSend || undefined);
      const updated = await getJob(id);
      setJob(updated);
      if (
        updated.currentUserApplicationMessage &&
        updated.currentUserApplicationMessage.trim().length > 0
      ) {
        setLastApplicationMessage(updated.currentUserApplicationMessage);
      }
      setApplyMessage("");
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : "Błąd zgłoszenia");
    } finally {
      setApplySubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-2xl leading-tight">{job.title}</CardTitle>
              <CardDescription className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {authorDisplayName(job.author) || job.author.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(job.createdAt, locale)}
                </span>
                {job.deadline && formatDeadlineRemaining(job.deadline, locale, t) && (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDeadlineRemaining(job.deadline, locale, t)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {job.category.name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <ReactCountryFlag
                  svg
                  countryCode={job.language === "ENGLISH" ? "GB" : "PL"}
                  style={{ width: "1em", height: "1em" }}
                />
                {job.language === "ENGLISH" ? t("jobs.english") : t("jobs.polish")}
              </span>
            </div>
          </div>
          {isDraft && (
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
              {t("jobs.draftVisibleOnlyToYou")}
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
                  {t("jobs.description")}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>
          </section>

          {/* Details grid */}
          <section className="grid gap-6 sm:grid-cols-2">
            <DetailRow
              icon={Banknote}
              label={t("jobs.rate")}
              value={
                <>
                  {formatRate(job.rate, job.currency, job.billingType)}
                  {job.rateNegotiable && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {t("jobs.negotiable")}
                    </span>
                  )}
                </>
              }
            />
            <DetailRow
              icon={Briefcase}
              label={t("jobs.billingType")}
              value={BILLING_LABELS[job.billingType] ?? job.billingType}
            />
            {job.billingType === "HOURLY" && job.hoursPerWeek && (
              <DetailRow
                icon={Clock}
                label={t("jobs.hoursPerWeek")}
                value={HOURS_LABELS[job.hoursPerWeek] ?? job.hoursPerWeek}
              />
            )}
            <DetailRow
              icon={BarChart3}
              label={t("jobs.experienceLevel")}
              value={
                EXPERIENCE_LABELS[job.experienceLevel] ?? job.experienceLevel
              }
            />
            <DetailRow
              icon={Briefcase}
              label={t("jobs.projectType")}
              value={
                PROJECT_TYPE_LABELS[job.projectType] ?? job.projectType
              }
            />
            {job.location && (
              <DetailRow
                icon={MapPin}
                label={t("jobs.location")}
                value={job.location.name}
              />
            )}
            {job.isRemote && (
              <DetailRow
                icon={Laptop}
                label={t("jobs.remoteWork")}
                value={t("common.yes")}
              />
            )}
            {job.deadline && (
              <DetailRow
                icon={Clock}
                label={t("jobs.deadline")}
                value={formatDeadlineRemaining(job.deadline, locale, t) ?? undefined}
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
                    {t("jobs.skills")}
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
                    {t("listings.applicationsCount", { count: applications.length })}
                  </p>
                  {isOwnJob ? (
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
                              {formatDate(app.createdAt, locale)}
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
                          title={t("listings.appliedFreelancer")}
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
          {user?.accountType === "FREELANCER" && !isOwnJob && !isDraft && (
            <section className="border-t pt-6">
              {job.currentUserApplied ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-3 py-2 text-sm">
                    {t("jobs.applied")}
                  </div>
                  {lastApplicationMessage && (
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        {t("listings.applicationMessageContent")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {lastApplicationMessage}
                      </p>
                    </div>
                  )}
                </div>
              ) : deadlinePassed ? (
                <p className="text-sm text-muted-foreground">
                  {t("listings.deadlinePassedMessage")}
                </p>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("listings.applyToListing")}
                  </p>
                  <Textarea
                    placeholder={t("listings.applyMessagePlaceholder")}
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
                      t("listings.applying")
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {t("listings.apply")}
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
