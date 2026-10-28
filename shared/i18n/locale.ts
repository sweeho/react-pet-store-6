export const SUPPORTED_LOCALES = ["en_US", "ja_JP", "zh_CN"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en_US";

export interface ParsedLocale {
  language: string;
  country: string;
  code: string;
}

/**
 * Reads `language_COUNTRY`; `default` (any case) is the server default locale.
 * A code without an underscore is invalid and yields `null`.
 */
export function parseLocale(code: string): ParsedLocale | null {
  const trimmed = code.trim();
  if (trimmed.toLowerCase() === "default") return parseLocale(DEFAULT_LOCALE);
  const [language, country] = trimmed.split("_");
  if (!language || !country) return null;
  return { language, country, code: `${language}_${country}` };
}
