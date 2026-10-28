# SWHR2-T-0096 — Localization 5: Formatting utilities

Change `swhr2-i-0003-localization`. Read `design.md` first (Target design → Components → Formatting, Keyword splitting; Spec discrepancies SD3).
Requirements: Locale-aware money and number formatting (SWHR2-R-0018), Locale-aware formatting and keyword splitting (SWHR2-R-0019); tasks 5.1, 5.2.

## Objective

Pure formatting and word-splitting functions shared by the SPA and the server.

## Steps

1. `shared/i18n/format.ts`: `formatMoney(amount, locale, precision)` (major units, SD3; USD/JPY/CNY by locale) and `formatNumber(value, locale, precision)`, both `Intl.NumberFormat` with min = max fraction digits = precision; convert `ja_JP` to the BCP-47 tag via `parseLocale` from `shared/i18n/locale.ts` (task 5.1).
2. `shared/i18n/words.ts`: `splitWords(phrase, locale)` with `Intl.Segmenter` word granularity, keeping word-like, non-blank segments (task 5.2).

## File/module ownership

Create: `shared/i18n/format.ts`, `shared/i18n/words.ts`. Read-only: `shared/i18n/locale.ts`. Tests belong to SWHR2-T-0098.

## Design reference

No approved mockup applies to this ticket.

## Definition of Done

AC-1 to AC-4 on the ticket; SWHR2-C-0016, 0017, 0018 and 0019 in `tests/acceptance/localization/i18n.test.ts` pass.
