// Thresholds in stored hundredths: US orders under 500.00, ja_JP orders under 50000 (SWHR2-R-0021,
// SWHR2-R-0022). Open Business Owner decisions (zh_CN, exact-500) change only this function.
const LIMITS: Record<string, number> = { en_US: 500_00, ja_JP: 50000_00 };

/** Whether an order of this locale and stored total (hundredths) is approved on receipt. */
export function autoApproves(locale: string, total: number): boolean {
  const limit = LIMITS[locale];
  return limit !== undefined && total < limit;
}
