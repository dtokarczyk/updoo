/**
 * Deadline utilities: compute remaining time from deadline and format for display.
 * All calculations derive from msLeft so display and "soon" logic stay in sync.
 */

export const HOURS_24_MS = 24 * 60 * 60 * 1000;

/**
 * Returns milliseconds left until deadline (positive = future, 0 or negative = past).
 * Returns null only when no deadline or invalid date.
 */
export function getDeadlineMsLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime() - Date.now();
}

/**
 * Derives days, hours, minutes from msLeft (avoids intervalToDuration quirks).
 */
export function getDeadlineDuration(msLeft: number): {
  days: number;
  hours: number;
  minutes: number;
} {
  const days = Math.floor(msLeft / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );
  const minutes = Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
  return { days, hours, minutes };
}

/**
 * True when deadline is in the future and less than 24 hours away, and job is not closed.
 */
export function isDeadlineSoon(
  msLeft: number | null,
  isClosed?: boolean
): boolean {
  return (
    !isClosed &&
    msLeft !== null &&
    msLeft > 0 &&
    msLeft < HOURS_24_MS
  );
}

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;

/**
 * Formats remaining time until deadline using granular translation keys.
 * Returns null if no deadline. Returns "" if invalid date. Returns "deadlinePassed" if past.
 */
export function formatDeadlineRemaining(
  deadline: string | null,
  t: TranslateFn
): string | null {
  if (!deadline) return null;
  const msLeft = getDeadlineMsLeft(deadline);
  if (msLeft === null) return ""; // invalid date
  if (msLeft <= 0) return t("jobs.deadlinePassed");
  const { days, hours, minutes } = getDeadlineDuration(msLeft);

  if (days > 0) {
    if (days === 1) return t("jobs.deadlineRemaining1");
    if (days < 5) return t("jobs.deadlineRemainingFew", { days });
    return t("jobs.deadlineRemainingMany", { days });
  }
  if (hours > 0) return t("jobs.deadlineRemainingHours", { hours });
  return t("jobs.deadlineRemainingMinutes", { minutes });
}
