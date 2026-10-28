import { DEFAULT_LOCALE, parseLocale } from "./locale";

const CURRENCY: Record<string, string> = { en_US: "USD", ja_JP: "JPY", zh_CN: "CNY" };

function tag(locale: string): string {
  const parsed = parseLocale(locale) ?? parseLocale(DEFAULT_LOCALE);
  return parsed ? `${parsed.language}-${parsed.country}` : "en-US";
}

/** Formats a major-unit amount in the locale's currency with exactly `precision` decimals. */
export function formatMoney(amount: number, locale: string, precision: number): string {
  return new Intl.NumberFormat(tag(locale), {
    style: "currency",
    currency: CURRENCY[parseLocale(locale)?.code ?? ""] ?? CURRENCY[DEFAULT_LOCALE],
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount);
}

/** Formats a number with the locale's grouping and exactly `precision` decimals. */
export function formatNumber(value: number, locale: string, precision: number): string {
  return new Intl.NumberFormat(tag(locale), {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}
