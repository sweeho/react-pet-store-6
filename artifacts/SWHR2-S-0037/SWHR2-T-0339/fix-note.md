# Fix note — SWHR2-T-0339

CODE-REVIEW: self-review — small diff, reviewed against design.md D1/D2; no findings.

## Root cause

Every storefront screen first rendered en_US: `LocaleProvider` started at `DEFAULT_LOCALE` and adopted the session locale only after an async `/api/session` fetch (the `ps_sid` cookie is HttpOnly). The provider was also mounted separately per page rather than once.

## Fix

- Server keeps a readable `ps_locale` cookie equal to the storefront session locale (session start, `POST /api/session/locale`, `?locale=` middleware branch).
- `LocaleProvider` seeds its state from `ps_locale` when supported; the session fetch remains authoritative.
- One `LocaleProvider` around `AppShell` in `src/main.tsx`; per-page providers removed.

## Files

services/session/store.ts, routes/api/session/locale.post.ts (+test), middleware/10.session.ts, src/components/storefront/LocaleProvider.tsx (+new test), src/main.tsx, src/pages/index.tsx, src/pages/petstore.tsx, src/pages/petstore/locale.test.tsx (wrapped in the root provider, as the app now is).
