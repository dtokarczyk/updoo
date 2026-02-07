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
