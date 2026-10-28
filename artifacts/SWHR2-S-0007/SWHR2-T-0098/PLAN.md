# SWHR2-T-0098 — Localization 6: Verification

Change `swhr2-i-0003-localization`. Read `design.md` first (Stack choices → Tests; Sprint SWHR2-S-0007 planning → Phases, Spec discrepancies).
Requirements: all eleven of the change; tasks 6.1–6.6.

## Objective

The repository's own tests cover every scenario the change states, run in CI, and stay green.

## Steps

1. Test harness: in `vitest.config.ts` add `middleware/**/*.test.ts` and `services/**/*.test.ts` to the `server` project's `include` and exclude them from the `client` project, so tests reaching `bun:sqlite` run under node.
2. 6.1: `shared/i18n/locale.test.ts` — two-part code, `default`/`DEFAULT`, no underscore, supported set and en_US default.
3. 6.2: `src/locales/resolveScreen.test.ts` — request over session, de_DE fallback, per-screen fallback, missing-screen error text.
4. 6.3: `src/pages/petstore/change-language.test.tsx`, `src/components/storefront/LanguageFlags.test.tsx`, `routes/api/session/locale.post.test.ts` (valid, invalid → 400, session persists); `e2e/localization.spec.ts` — default en_US, header Japanese flag, change-language submit and confirmation, cart line re-shown in zh_CN after a change.
5. 6.4: `services/catalog.test.ts`, `services/cart.test.ts`, `routes/api/catalog/items/[itemId].get.test.ts` — same item in two locales; cart with no locale and with ja_JP.
6. 6.5: `middleware/00.encoding.test.ts` — Japanese form value and Chinese query parameter round-trip; the middleware runs before `10.session.ts` and a following handler sees decoded values.
7. 6.6: `shared/i18n/format.test.ts`, `shared/i18n/words.test.ts` — the four formatting/splitting scenarios.
8. CI: no workflow change; confirm the new tests run in the existing CI job. Report which `tests/acceptance/localization` cases still fail because their capability is unbuilt (SD1) rather than fixing them here.

## File/module ownership

Modify: `vitest.config.ts`. Create: the test files named above and `e2e/localization.spec.ts`. Any product fix a failing test exposes goes back to the owning ticket as a defect, not into this ticket.

## Design reference

The e2e spec asserts against the screens drawn in `artifacts/SWHR2-S-0007/design/mockup-change-language-screen.html` (SWHR2-MCK-5, `/petstore/change-language`), `mockup-change-language-confirmation.html` (SWHR2-MCK-6, same route after submit) and `mockup-screen-definition-not-found.html` (SWHR2-MCK-7), all at 1440 px. See `artifacts/SWHR2-S-0007/design/MANIFEST.md`.

## Definition of Done

AC-1 to AC-25 on the ticket, each covered by at least one test in the files above; the app builds and its unit, integration and E2E suites are green.
