"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  ArrowLeft,
  ArrowRight,
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
  X,
} from "lucide-react";
import {
  getJob,
  getJobPrevNext,
  applyToJob,
  closeJob,
  getStoredUser,
  authorDisplayName,
  isApplicationFull,
  type Job,
  type JobPrevNext,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
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
  const dateFormat = locale === "en" ? "d MMMM yyyy 'at' HH:mm" : "d MMMM yyyy 'o' HH:mm";
  return format(date, dateFormat, { locale: dateFnsLocale });
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
  const router = useRouter();
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
  const [prevNext, setPrevNext] = useState<JobPrevNext | null>(null);
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const user = getStoredUser();
  const applyFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([
      getJob(id),
      getJobPrevNext(id).catch(() => ({ prev: null, next: null })),
    ])
      .then(([data, prevNextData]) => {
        setJob(data);
        setPrevNext(prevNextData);
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

  // Fill default message when job loads and user is freelancer
  useEffect(() => {
    if (!job || !user) return;

    const isOwnJob = user.id === job.authorId;
    const isDraft = job.status === "DRAFT";
    const deadlinePassed = job.deadline
      ? getDeadlineRemainingDays(job.deadline) === 0
      : false;
    const canApply =
      user.accountType === "FREELANCER" &&
      !isOwnJob &&
      !isDraft &&
      !deadlinePassed &&
      !job.currentUserApplied;

    // Only fill default message if user can apply and hasn't already applied
    // Set it only once when job loads (check if applyMessage is still empty)
    if (canApply && user.defaultMessage && user.defaultMessage.trim().length > 0) {
      setApplyMessage((prev) => {
        // Only set if previous value is empty (don't overwrite user's edits)
        if (prev.trim().length === 0) {
          return user.defaultMessage || "";
        }
        return prev;
      });
    }
  }, [job, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8 space-y-4">
          <div>
            <div className="h-10 w-3/4 rounded-md bg-muted mb-3" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="h-4 w-32 rounded-md bg-muted" />
              <div className="h-4 w-40 rounded-md bg-muted" />
              <div className="h-4 w-36 rounded-md bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-24 rounded-full bg-muted" />
            <div className="h-7 w-20 rounded-full bg-muted" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-6">
          {/* Main content skeleton */}
          <div className="lg:col-span-4 space-y-6">
            {/* Skills skeleton */}
            <div className="flex gap-3 items-start">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-16 rounded-md bg-muted" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-7 w-20 rounded-full bg-muted" />
                  ))}
                </div>
              </div>
            </div>

            {/* Description skeleton */}
            <div className="flex gap-3 items-start">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 rounded-md bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded-md bg-muted" />
                  <div className="h-4 w-full rounded-md bg-muted" />
                  <div className="h-4 w-5/6 rounded-md bg-muted" />
                  <div className="h-4 w-4/6 rounded-md bg-muted" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className="lg:col-span-2">
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-20 rounded-md bg-muted" />
                    <div className="h-4 w-32 rounded-md bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
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
  const isAdmin = user?.accountType === "ADMIN";
  const isDraft = job.status === "DRAFT";
  const isClosed = job.status === "CLOSED";
  const deadlinePassed = job.deadline
    ? getDeadlineRemainingDays(job.deadline) === 0
    : false;
  const canApply =
    user?.accountType === "FREELANCER" &&
    !isOwnJob &&
    !isDraft &&
    !isClosed &&
    !deadlinePassed &&
    !job.currentUserApplied;
  const canClose = (isOwnJob || isAdmin) && !isClosed && !isDraft;
  const applications = job.applications ?? [];
  // Admin can see full application data even if not the author
  const canSeeFullApplications = isOwnJob || isAdmin;

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

  function handleApplyClick() {
    // If user is not logged in, redirect to login
    if (!user) {
      const returnUrl = `/job/${id}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // If user is logged in but not a freelancer, redirect to login (they need to switch account)
    if (user.accountType !== "FREELANCER") {
      const returnUrl = `/job/${id}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // If user can apply, scroll to form
    if (canApply && applyFormRef.current) {
      applyFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus on textarea after scroll
      setTimeout(() => {
        const textarea = applyFormRef.current?.querySelector("textarea");
        if (textarea) {
          textarea.focus();
        }
      }, 500);
    }
  }

  async function handleClose() {
    if (!id || !canClose) return;
    setCloseSubmitting(true);
    try {
      const updated = await closeJob(id);
      setJob(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd zamykania oferty");
    } finally {
      setCloseSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header with title and meta - full width */}
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="text-4xl font-semibold leading-tight">{job.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        {isDraft && (
          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
            {t("jobs.draftVisibleOnlyToYou")}
          </div>
        )}
        {isClosed && (
          <div className="rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
            {t("jobs.closed")}
            {job.closedAt && (
              <span className="ml-2">
                ({formatDate(job.closedAt, locale)})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-6">
        {/* Main content with description */}
        <div className="lg:col-span-4 space-y-6">
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

          {/* Description */}
          <section>
            <div className="flex gap-3 items-start mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t("jobs.description")}
                </p>
                <p className="text-base whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>
          </section>

          {/* Prev/Next Navigation */}
          {(prevNext?.prev || prevNext?.next) && (
            <section className="border-t pt-6">
              <div className="flex gap-4">
                {prevNext.prev ? (
                  <Link
                    href={`/job/${prevNext.prev.id}`}
                    className="group flex-1 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                      <ArrowLeft className="h-4 w-4" />
                      <span>{t("jobs.previous")}</span>
                    </div>
                    <p className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {prevNext.prev.title}
                    </p>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
                {prevNext.next ? (
                  <Link
                    href={`/job/${prevNext.next.id}`}
                    className="group flex-1 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50 text-right"
                  >
                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1.5">
                      <span>{t("jobs.next")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <p className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {prevNext.next.title}
                    </p>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </section>
          )}

          {/* Apply form (freelancer, before deadline, not own listing) */}
          {user?.accountType === "FREELANCER" && !isOwnJob && !isDraft && (
            <section ref={applyFormRef} className="border-t pt-6">
              {job.currentUserApplied ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 px-3 py-2 text-sm">
                    {t("jobs.applied")}
                  </div>
                  {lastApplicationMessage && (
                    <div className="rounded-lg border bg-muted/40 px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        {t("jobs.applicationMessageContent")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {lastApplicationMessage}
                      </p>
                    </div>
                  )}
                </div>
              ) : deadlinePassed ? (
                <p className="text-sm text-muted-foreground">
                  {t("jobs.deadlinePassedMessage")}
                </p>
              ) : (
                <form onSubmit={handleApply} className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("jobs.applyToJob")}
                  </p>
                  <Textarea
                    placeholder={t("jobs.applyMessagePlaceholder")}
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
                      t("jobs.applying")
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {t("jobs.apply")}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </section>
          )}
        </div>

        {/* Sidebar with job data */}
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-8 space-y-6">
            {/* CTA Button for desktop */}
            {(isOwnJob || isAdmin) ? (
              <div className="hidden lg:block space-y-2">
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/job/${job.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("jobs.edit")}
                  </Link>
                </Button>
                {canClose && (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="destructive"
                    onClick={handleClose}
                    disabled={closeSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {closeSubmitting ? t("jobs.closing") : t("jobs.close")}
                  </Button>
                )}
              </div>
            ) : !isDraft && !isClosed && user?.accountType === "FREELANCER" ? (
              <div className="hidden lg:block">
                {canApply ? (
                  <Button onClick={handleApplyClick} className="w-full" size="lg">
                    <Send className="mr-2 h-4 w-4" />
                    {t("jobs.apply")}
                  </Button>
                ) : job.currentUserApplied ? (
                  <Button disabled className="w-full" size="lg" variant="outline">
                    {t("jobs.appliedShort")}
                  </Button>
                ) : deadlinePassed ? (
                  <Button disabled className="w-full" size="lg" variant="outline">
                    {t("jobs.deadlinePassed")}
                  </Button>
                ) : (
                  <Button onClick={handleApplyClick} className="w-full" size="lg">
                    <Send className="mr-2 h-4 w-4" />
                    {t("jobs.apply")}
                  </Button>
                )}
              </div>
            ) : null}

            {/* Freelancer applications: full data for author and admin, initials for others */}
            {applications.length > 0 && (
              <div className="space-y-3 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("jobs.applicationsCount", { count: applications.length })}
                  </p>
                </div>
                {canSeeFullApplications ? (
                  <div className="space-y-3">
                    {applications.map((app) =>
                      isApplicationFull(app) ? (
                        <div
                          key={app.id}
                          className="rounded-lg border bg-muted/30 p-3 space-y-1.5"
                        >
                          <p className="font-medium text-sm text-foreground">
                            {authorDisplayName(app.freelancer) || app.freelancer.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.freelancer.email}
                          </p>
                          {app.message && (
                            <p className="text-xs whitespace-pre-wrap pt-1 border-t mt-2 text-muted-foreground">
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
                    {applications.slice(0, 7).map((app) => (
                      <span
                        key={app.id}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-foreground"
                        title={t("jobs.appliedFreelancer")}
                      >
                        {"freelancerInitials" in app
                          ? app.freelancerInitials || "?"
                          : "?"}
                      </span>
                    ))}
                    {applications.length > 7 && (
                      <span
                        className="inline-flex h-8 items-center justify-center rounded-full bg-primary/10 px-3 text-sm font-medium text-foreground"
                        title={t("jobs.appliedFreelancer")}
                      >
                        +{applications.length - 7}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

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
            {job.deadline && (
              <DetailRow
                icon={Clock}
                label={t("jobs.deadline")}
                value={formatDeadlineRemaining(job.deadline, locale, t) ?? undefined}
              />
            )}
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
          </div>
        </aside>
      </div>

      {/* Sticky CTA button */}
      {!isOwnJob && !isDraft && !isClosed && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto max-w-4xl">
            {canApply ? (
              <Button onClick={handleApplyClick} className="w-full" size="lg">
                <Send className="mr-2 h-4 w-4" />
                {t("jobs.apply")}
              </Button>
            ) : user?.accountType === "FREELANCER" && job.currentUserApplied ? (
              <Button disabled className="w-full" size="lg" variant="outline">
                {t("jobs.appliedShort")}
              </Button>
            ) : deadlinePassed ? (
              <Button disabled className="w-full" size="lg" variant="outline">
                {t("jobs.deadlinePassed")}
              </Button>
            ) : (
              <Button onClick={handleApplyClick} className="w-full" size="lg">
                <Send className="mr-2 h-4 w-4" />
                {t("jobs.apply")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
