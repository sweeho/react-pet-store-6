# SWHR2-T-0096 summary

Added locale-aware formatting and word splitting in `shared/i18n/` (tasks 5.1, 5.2).

- `format.ts`: `formatMoney(amount, locale, precision)` in major units with USD/JPY/CNY per locale, and `formatNumber`, both `Intl.NumberFormat` with min = max fraction digits. Unparseable locales use en_US.
- `words.ts`: `splitWords(phrase, locale)` via `Intl.Segmenter`, keeping word-like, non-blank segments.
- `format.test.ts`: cases SWHR2-C-0016/17/18/19, all pass; none were already passing at red.

AC coverage: all four ACs ("$1,234.50", "1,951", "gold"/"fish", "$16.50").

Verification: `bun run typecheck`, `bun run lint`, `bun run test` (60 passed), `bun run build` all exit 0. No UI, so no design check.

CODE-REVIEW: self-review — sub-agent not run; the diff is two small pure functions.
