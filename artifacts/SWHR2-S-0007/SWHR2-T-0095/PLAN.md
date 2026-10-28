# SWHR2-T-0095 — Localization 2: Changing locale

Change `swhr2-i-0003-localization`. Read `design.md` first (Target design → Components, Data, Interfaces; Spec discrepancies SD1, SD5, SD7, SD8).
Requirements: Supported storefront locales and header language switch (SWHR2-R-0078), Locale change applies to session and cart (SWHR2-R-0076), Change-language screen (SWHR2-R-0020); tasks 2.1–2.4.

## Objective

A server-held session locale (en_US by default) that the header flags and the change-language screen change, and storefront pages rendered from the resolved screen definition.

## Steps

1. `middleware/10.session.ts`: default-export handler; cookie-identified in-memory session store, `event.context.session = { id, locale }`, new sessions start at `DEFAULT_LOCALE` (design.md, Data → Session locale). Keep it minimal; sign-on will extend it.
2. `routes/api/session/locale.post.ts` (`{ locale }` → `parseLocale`, set session locale, reply `{ locale }`, 400 on invalid) and `routes/api/session/index.get.ts` (reply `{ locale }`) (design.md, Interfaces). The cart reads the session locale through `services/locale.ts`, so this one write applies to session and cart together (task 2.2, SD4).
3. Client locale state: a small provider/hook under `src/locales/` is owned by SWHR2-T-0093; here, fetch `GET /api/session` in `src/pages/petstore.tsx` and pass the locale down; re-render on change.
4. `src/components/storefront/LanguageFlags.tsx`: three buttons (EN, 日本語, 中文) with accessible names naming the language; clicking posts the locale and re-renders the current page. Render it in the `/petstore` area header slot (task 2.1; design.md, Components → Header language switch).
5. `src/pages/petstore/change-language.tsx`: one `<select>` with options "US English", "German", "Japanese", "Simplified Chinese" (values en_US, de_DE, ja_JP, zh_CN) and a "Change Locale" submit; on success show a confirmation stating the new locale code, e.g. "Your locale is now ja_JP" (tasks 2.3, 2.4; mockups SWHR2-MCK-5/6).
6. Switch `src/pages/petstore/{index,cart,signin}.tsx` and the new page to text from the resolved screen definition (SWHR2-R-0078.01, SD8).
7. Point the **Language** entry in `src/components/shell/areas.ts` at `/petstore/change-language` (SD5).

## File/module ownership

Create: `middleware/10.session.ts`, `routes/api/session/locale.post.ts`, `routes/api/session/index.get.ts`, `src/components/storefront/LanguageFlags.tsx`, `src/pages/petstore/change-language.tsx`. Modify: `src/pages/petstore.tsx`, `src/pages/petstore/{index,cart,signin}.tsx`, `src/components/shell/areas.ts`. Read-only: `src/locales/**` (SWHR2-T-0093; add missing strings there only by coordinating via a ticket comment). Tests belong to SWHR2-T-0098.

## Design reference

- `artifacts/SWHR2-S-0007/design/mockup-change-language-screen.html` (SWHR2-MCK-5) — `/petstore/change-language`, default state, 1440 px.
- `artifacts/SWHR2-S-0007/design/mockup-change-language-confirmation.html` (SWHR2-MCK-6) — `/petstore/change-language` after a successful submit, 1440 px.

See `artifacts/SWHR2-S-0007/design/MANIFEST.md`.

## Definition of Done

AC-1 to AC-6 on the ticket. SWHR2-C-0020 (`screens.test.tsx`), SWHR2-C-0021 and SWHR2-C-0027 (`e2e/localization.spec.ts`) pass. The cart part of AC-4 (SWHR2-C-0022) completes once SWHR2-T-0097 lands; its item-page step needs catalog-browsing (SD1).
