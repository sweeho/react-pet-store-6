# SWHR2-T-0095 summary

Added a server-held session locale and the UI that changes it (tasks 2.1-2.4).

- `middleware/10.session.ts`: cookie-keyed in-memory session `{ id, locale }`, default en_US.
- `routes/api/session/locale.post.ts` (400 on invalid code) and `index.get.ts` (reads through `requestLocale`).
- `src/components/storefront/`: `LocaleProvider` (fetches and sets the session locale) and `LanguageFlags` (EN/JA/ZH buttons, named from the `header` definition).
- `src/pages/petstore.tsx` wraps the area in the provider and shows the flags; `index`, `cart`, `signin` render from `useScreen`; new `change-language.tsx` with selector, "Change Locale" and a confirmation stating the code.
- `areas.ts`: Language points at `/petstore/change-language`; `GlobalNav.test.tsx` updated to match.
- Tests: `src/pages/petstore/change-language.test.tsx` (C-0020), `src/pages/petstore/locale.test.tsx` (C-0021/22/26/27/28), `routes/api/session/session.test.ts` (API). Red/green recorded by the platform; C-0027 already passed at red.

AC coverage: all six pass at the jsdom level. The cart-line part of C-0022 (zh_CN name and price) waits for SWHR2-T-0097; this ticket proves the locale reaches the session.

Deviations: flags are in the area content, not the shell header (slot only reachable from `src/main.tsx`); the e2e cases are jsdom tests because there is no Chromium here; mockups were not on disk (see `design-check.md`).

Verification: `bun run typecheck`, `bun run lint`, `bun run test` (65 passed), `bun run build` all exit 0. E2E not run (no browser).

CODE-REVIEW: self-review — sub-agent not run; checked session/cookie handling, 400 path and fallback to en_US for de_DE.
