/**
 * Deterministic "random" number from jobId for blurred rate placeholder (unauthenticated users).
 * @param currency - If provided, returns full string e.g. "120 PLN/h"; otherwise returns formatted number only.
 */
export function getBlurredRatePlaceholder(
  jobId: string,
  billingType: string,
  currency?: string
): string {
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) hash = (hash * 31 + jobId.charCodeAt(i)) >>> 0;
  const isHourly = billingType === "HOURLY";
  const min = isHourly ? 50 : 1000;
  const max = isHourly ? 250 : 12000;
  const value = min + (hash % (max - min + 1));
  const formatted = value.toLocaleString("pl-PL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (currency) {
    return billingType === "HOURLY" ? `${formatted} ${currency}/h` : `${formatted} ${currency}`;
  }
  return formatted;
}

/** Full formatted rate string e.g. "1 200 PLN/h" or "5 000 PLN". */
export function formatRateValue(
  rate: string,
  currency: string,
  billingType: string
): string {
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

export type RateDisplayResult =
  | { type: "blur"; placeholder: string }
  | { type: "rate"; formatted: string }
  | { type: "negotiable" };

/** Whether job has a non-empty, valid numeric rate. */
function hasRate(rate: string | null): boolean {
  if (rate == null) return false;
  const s = String(rate).trim();
  if (s === "") return false;
  return !Number.isNaN(parseFloat(s));
}

/**
 * Single source of truth for rate display: 1) no user → blur, 2) user + rate → show rate, 3) user + no rate → negotiable.
 */
export function getRateDisplay(
  isLoggedIn: boolean,
  job: {
    id: string;
    rate: string | null;
    currency: string;
    billingType: string;
  }
): RateDisplayResult {
  if (!isLoggedIn) {
    return {
      type: "blur",
      placeholder: getBlurredRatePlaceholder(job.id, job.billingType, job.currency),
    };
  }
  if (hasRate(job.rate)) {
    return {
      type: "rate",
      formatted: formatRateValue(job.rate!, job.currency, job.billingType),
    };
  }
  return { type: "negotiable" };
}
