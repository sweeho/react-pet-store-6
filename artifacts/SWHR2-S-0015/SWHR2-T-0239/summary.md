# SWHR2-T-0239 — Customer account and profile

Delivers change swhr2-i-0006 groups 1–6: customer/account/profile schema and migration 0004, all-or-nothing customer creation, address transactions, contact snapshot, account GET/POST/PUT and register routes, My List API and panel, pet-tips banner, double-password sign-up with the User Creation Error page, and the account page with fixed card type and expiry year selects. Locale files `account.ts` added for en_US, ja_JP, zh_CN.

Files: `db/`, `drizzle/0004_*`, `services/customers/`, `shared/account.ts`, `routes/api/account/*`, `routes/api/session.get.ts`, `src/pages/petstore/*`, `src/components/storefront/{MyListPanel,PetTipsBanner}.tsx`, `src/locales/*`, with tests.

Verification: `bun run verify` (lint, typecheck, unit) — 55 files, 204 tests passed. `bun run test:e2e` not run: Chromium is not installed in this container (preflight refused); E2E runs in QA. C-0174 purchase step deferred to SWHR2-I-0008 per ticket.

Cases already passing at red: none known beyond what the platform red run reports.

CODE-REVIEW: self-review — sub-agent not started in this run; diff reviewed against acceptance criteria and mockups, no further findings.
