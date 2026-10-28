export const SUPPORTED_LOCALES = ["en_US", "ja_JP", "zh_CN"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en_US";

export interface ParsedLocale {
  language: string;
  country: string;
  code: string;
}

export function parseLocale(code: string): ParsedLocale | null {
  void code;
  throw new Error("VortexNotImplemented");
}
