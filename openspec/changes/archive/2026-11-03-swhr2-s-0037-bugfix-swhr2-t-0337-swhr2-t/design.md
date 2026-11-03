## Context

DEFECTs SWHR2-T-0339 (C-0021), SWHR2-T-0338 (C-0026) and SWHR2-T-0337 (C-0028), from UAT round 1 at rc-2026.11.4. The locked spec is `tests/acceptance/localization/e2e/localization.spec.ts`:

- **C-0021:** Change Locale → Japanese, then open `/petstore` and read the body text, which must contain kana.
- **C-0026:** for each locale (set via `POST /api/session/locale`), open `/petstore`, `/petstore/category/FISH` and `/petstore/cart`. The body text must contain kana (ja_JP) or Han and no kana (zh_CN), and must not contain "Sign in" in either.
- **C-0028:** on the FISH page, click the Japanese flag, poll for kana, then open `/petstore` and read the body, which must contain kana.

C-0021 and C-0026 read `innerText` straight after `page.goto`, which resolves at the page's load event.

## Root cause

Verified in code.

- **Server: correct.**
  - `POST /api/session/locale` (`routes/api/session/locale.post.ts`) stores the code on the in-memory session.
  - `GET /api/session` (`routes/api/session.get.ts` via `services/locale.ts#requestLocale`) returns it. Reproduced against the dev server with curl: POST `ja_JP`, then GET returns `{"locale":"ja_JP"}` on the same cookie.
  - The ja_JP and zh_CN screen definitions exist under `src/locales/` and contain kana or Han. The UAT notes' "add the translations" is not needed.
- **R1: the first render is always US English** (C-0021, C-0026, C-0028's second check).
  - `LocaleProvider` (`src/components/storefront/LocaleProvider.tsx`) starts at `DEFAULT_LOCALE` and switches only when a `useEffect` fetch of `/api/session` returns.
  - That fetch completes after the load event, so a test, or a shopper on a slow link, sees English first.
  - The session cookie `ps_sid` is HttpOnly, so the client has no way to know the locale at first render.
- **R2: there is no single locale state, and the flags are not in the header** (C-0028).
  - `LocaleProvider` is mounted twice, separately in `src/pages/index.tsx` (landing) and `src/pages/petstore.tsx` (storefront layout), not around `AppShell`.
  - `StorefrontHeader` sits outside both, keeps its own session copy, and refetches only when the pathname changes, so a flag click never reaches the header.
  - `LanguageFlags` renders at the top of the `/petstore` layout's main area, not in the page header that SWHR2-R-0078 names.
- **R3: the shell chrome is hard-coded English** (C-0026's "no Sign in").
  - `GlobalNav` renders `areas.ts` labels ("Catalog & search", "Shopping cart", "Language", "Sign in", "Account & profile", …), group headings ("Shop", "Account", …) and "Home" verbatim.
  - `AppShell`'s footer renders "Pet Store · Home".
  - The nav is on every page, so a ja_JP page always contains "Sign in".

## Decisions

- **D1 Seed the client from a readable locale cookie.**
  - The server keeps a non-HttpOnly cookie `ps_locale` equal to the storefront session's locale. It is set whenever a storefront session starts or its locale changes (`services/session/store.ts`, `locale.post.ts`, and the `?locale=` branch of `middleware/10.session.ts`).
  - `LocaleProvider` initialises its state from `document.cookie`'s `ps_locale` when it holds a supported code, else en_US. It still fetches `/api/session` and adopts the server's answer, which is authoritative.
  - The cookie carries only the locale code, which is not sensitive. `ps_sid` stays HttpOnly.
  - Rejected: hiding the page until the fetch resolves only moves the race, because the load event still fires first. Rejected: server-rendering the locale needs SSR, which the SPA does not have.
- **D2 One provider at the app root.**
  - `src/main.tsx` wraps `AppShell` in a single `LocaleProvider`. The providers in `src/pages/index.tsx` and `src/pages/petstore.tsx` are removed.
  - `StorefrontHeader` takes the locale from `useLocale()`, keeping its own session fetch only for sign-on state.
- **D3 Flags in the header.** `LanguageFlags` moves from the `/petstore` layout into `StorefrontHeader`, shown on storefront paths (not on `/admin/**` or `/supplier/**`). Its accessible names (the `header` screen's `en`/`ja`/`zh`) are unchanged.
- **D4 Localize the shell chrome.**
  - A new `shell` screen definition per locale (`src/locales/{en_US,ja_JP,zh_CN}/shell.ts`, registered in `src/locales/registry.ts`) holds the area labels keyed by route, the group headings, "Home" and the footer text.
  - `GlobalNav` and the `AppShell` footer render through `useScreen("shell", locale)`.
  - The en_US values equal today's literals exactly, so `GlobalNav.test.tsx` and the site-shell suites keep their English expectations. `areas.ts` keeps its labels as the en_US source and routes as keys.
- **D5 The shell follows the storefront locale everywhere.** The global navigation is one component on every page. Staff areas keep English page content. Pinning staff-area chrome to en_US is out of scope (proposal follow-up).
- **D6 Order and ownership.** All three fixes are needed for C-0026, and they touch overlapping files, so they run in a chain:
  1. SWHR2-T-0339: D1 and D2 provider hoist.
  2. SWHR2-T-0337: D2 header consumer and D3, which depend on the root provider.
  3. SWHR2-T-0338: D4, which needs the root provider and the header change merged.

## Verification

- C-0021, C-0026 and C-0028 pass in the locked browser suite after the third fix.
- C-0021 is expected to pass after the first fix, and C-0028 after the second.
- C-0022 and C-0027 (US English default) stay green.
- The unit suites for `LocaleProvider`, `GlobalNav`, `AppShell`, `StorefrontHeader` and the session routes are updated or added beside each changed file.
