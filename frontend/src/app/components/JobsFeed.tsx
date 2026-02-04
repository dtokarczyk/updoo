"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  getJobsFeed,
  publishJob,
  getStoredUser,
  type Job,
  type JobLanguage,
  type PaginationInfo,
} from "@/lib/api";
import { JobPost } from "@/app/components/JobPost";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

const VISITED_JOBS_KEY = "visitedJobs";
const FEED_STATE_KEY = "jobsFeedState";

type FeedState = {
  page: number;
  scrollY: number;
  categoryId?: string;
  language?: JobLanguage;
  skillIds?: string[];
};

function readVisitedJobs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(VISITED_JOBS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeVisitedJobs(ids: Set<string>) {
  try {
    window.localStorage.setItem(VISITED_JOBS_KEY, JSON.stringify(Array.from(ids)));
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
      categoryId:
        typeof parsed.categoryId === "string"
          ? parsed.categoryId
          : undefined,
      language:
        parsed.language === "POLISH" || parsed.language === "ENGLISH"
          ? parsed.language
          : undefined,
      skillIds: Array.isArray(parsed.skillIds)
        ? parsed.skillIds.filter((v): v is string => typeof v === "string")
        : undefined,
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

export function JobsFeed({
  categoryId,
  categorySlug,
  page,
  language,
  skillIds,
  onCountChange,
}: {
  categoryId?: string;
  categorySlug: string;
  page: number;
  language?: JobLanguage;
  skillIds?: string[];
  onCountChange?: (count: number) => void;
}) {
  const { t } = useTranslations();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const user = getStoredUser();

  const loadFeed = useCallback(
    (currentPage: number = page, opts?: { restoreScrollY?: number }) => {
      setLoading(true);
      getJobsFeed(currentPage, 15, categoryId, language, skillIds)
        .then((res) => {
          setJobs(res.items);
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
          setError(t("jobs.failedToLoad"));
          onCountChange?.(0);
        })
        .finally(() => setLoading(false));
    },
    [categoryId, language, skillIds, onCountChange, page]
  );

  useEffect(() => {
    setVisitedIds(readVisitedJobs());
    const restored = readFeedState();
    const matchesFilters =
      restored &&
      (restored.categoryId ?? undefined) === (categoryId ?? undefined) &&
      (restored.language ?? undefined) === (language ?? undefined) &&
      JSON.stringify(restored.skillIds ?? []) ===
      JSON.stringify(skillIds ?? []) &&
      restored.page === page;

    if (restored && matchesFilters) {
      loadFeed(page, { restoreScrollY: restored.scrollY });
      return;
    }

    loadFeed(page);
  }, [loadFeed, categoryId, language, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return;
    const searchParams = new URLSearchParams();
    if (language && (language === "ENGLISH" || language === "POLISH")) {
      searchParams.set("language", language);
    }
    if (skillIds && skillIds.length > 0) {
      searchParams.set("skills", skillIds.join(","));
    }
    const search = searchParams.toString();
    const target = `/jobs/${encodeURIComponent(categorySlug)}/${newPage}${search ? `?${search}` : ""
      }`;
    router.replace(target);
  };

  const markVisited = (jobId: string) => {
    setVisitedIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      writeVisitedJobs(next);
      return next;
    });
  };

  const handleNavigateToJob = (jobId: string) => {
    markVisited(jobId);
    writeFeedState({
      page,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      categoryId,
      language,
      skillIds,
    });
  };

  const handlePublish = (jobId: string) => {
    setPublishingId(jobId);
    publishJob(jobId)
      .then(() => loadFeed(page))
      .catch(() => setError(t("jobs.failedToPublish")))
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

  if (jobs.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
        {t("jobs.noJobs")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const isDraft = job.status === "DRAFT";
        const canPublish = user?.accountType === "ADMIN" && isDraft;
        const isAdmin = user?.accountType === "ADMIN";
        const isOwnJob = isAdmin || user?.id === job.authorId;
        const isVisited = visitedIds.has(job.id);
        const isApplied =
          !!job.currentUserApplied && user?.accountType === "FREELANCER";
        const isFavorite = !!job.isFavorite;
        return (
          <div
            key={job.id}
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
            <JobPost
              job={job}
              isDraft={isDraft}
              showFavorite={!!user}
              onNavigate={() => handleNavigateToJob(job.id)}
              onFavoriteToggle={(jobId) =>
                setJobs((prev) =>
                  prev.map((j) =>
                    j.id === jobId
                      ? { ...j, isFavorite: !j.isFavorite }
                      : j
                  )
                )
              }
              headerAction={
                <div className="flex items-center gap-2">
                  {isApplied && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-100 px-2 py-0.5 text-xs font-medium">
                      {t("jobs.appliedShort")}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {job.category.name}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <ReactCountryFlag
                      svg
                      countryCode={job.language === "ENGLISH" ? "GB" : "PL"}
                      style={{ width: "1em", height: "1em" }}
                    />
                    {job.language === "ENGLISH" ? t("jobs.english") : t("jobs.polish")}
                  </span>
                </div>
              }
              headerRightAction={
                isOwnJob ? (
                  <Button variant="outline" size="icon-lg" asChild>
                    <Link
                      href={`/job/${job.id}/edit`}
                      aria-label={t("jobs.editJob")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : undefined
              }
            />
            {isDraft && (
              <div className="bg-amber-200/90 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 border-t border-amber-300/80 dark:border-amber-700/80 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">
                  {t("jobs.waitingForAdmin")}
                </p>
                {canPublish && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-amber-700 hover:bg-amber-800 text-amber-50 dark:bg-amber-600 dark:hover:bg-amber-700 shrink-0"
                    onClick={() => handlePublish(job.id)}
                    disabled={publishingId === job.id}
                  >
                    {publishingId === job.id ? t("jobs.publishing") : t("jobs.publish")}
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
            className="cursor-pointer"
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("jobs.previous")}
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
                  className="min-w-10 cursor-pointer"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            {t("jobs.next")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {pagination && (
        <div className="text-center text-sm text-muted-foreground pt-2">
          {t("jobs.page")} {pagination.page} {t("jobs.of")} {pagination.totalPages} ({pagination.total} {t("jobs.jobsCount")})
        </div>
      )}
    </div>
  );
}
