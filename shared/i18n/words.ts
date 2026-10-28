import { DEFAULT_LOCALE, parseLocale } from "./locale";

/** Splits a phrase into its words for the locale; punctuation and blank segments are dropped. */
export function splitWords(phrase: string, locale: string): string[] {
  const parsed = parseLocale(locale) ?? parseLocale(DEFAULT_LOCALE);
  const tag = parsed ? `${parsed.language}-${parsed.country}` : "en-US";
  const segmenter = new Intl.Segmenter(tag, { granularity: "word" });
  return [...segmenter.segment(phrase)]
    .filter((s) => s.isWordLike && s.segment.trim() !== "")
    .map((s) => s.segment);
}
