---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0009
capability_brief: SWHR2-I-0004
branch: vortex/sprint/swhr2-s-0009-8024784a
upstream:
  [
    artifacts/SWHR2-S-0009/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0009/qa-test-report.md,
    artifacts/SWHR2-S-0009/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0009/release-notes.md]
---

# Sprint summary — SWHR2-S-0009

Goal: "SWHR2-I-0004: Catalog browsing and search". Met: every scenario of change `swhr2-i-0004-catalog-browsing-and-search` has a pass verdict in `qa-test-report.md`; browser-level E2E was not executed (see Verification).

## Tickets

| Ticket             | Type | Title                                                                          | Outcome                                                        |
| ------------------ | ---- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| SWHR2-T-0152       | TASK | Sprint plan — SWHR2-S-0009                                                     | DONE (re-plan after the S-0008 cancellation, 2a6113b, 533fd56) |
| SWHR2-T-0142       | TASK | Catalog data model (first plan)                                                | DONE; its commit 64a48ca was ported by SWHR2-T-0153            |
| SWHR2-T-0143..0148 | TASK | Catalog queries, paging, search, API/cache, screens, verification (first plan) | CANCELLED — superseded by SWHR2-T-0154..0159                   |
| SWHR2-T-0153       | TASK | Catalog data model                                                             | DONE, 7428121 — `SWHR2-T-0153/summary.md`                      |
| SWHR2-T-0154       | TASK | Catalog queries                                                                | DONE, 9f7be82 — `SWHR2-T-0154/summary.md`                      |
| SWHR2-T-0155       | TASK | Catalog paging                                                                 | DONE, d17c96d — `SWHR2-T-0155/summary.md`                      |
| SWHR2-T-0156       | TASK | Catalog keyword search                                                         | DONE, b0313ad — `SWHR2-T-0156/summary.md`                      |
| SWHR2-T-0157       | TASK | Catalog API and shared page cache                                              | DONE, c48965d — `SWHR2-T-0157/summary.md`                      |
| SWHR2-T-0158       | TASK | Storefront catalog screens                                                     | DONE, 6af706d — `SWHR2-T-0158/summary.md`, `design-check.md`   |
| SWHR2-T-0159       | TASK | Catalog browse-to-cart verification                                            | DONE, c797c2d — `SWHR2-T-0159/summary.md`, `design-check.md`   |
| SWHR2-T-0163       | TASK | Integration QA report                                                          | DONE, 0ba21c7 — `qa-test-report.md`                            |
| SWHR2-T-0164       | TASK | Sprint close bundle                                                            | this file                                                      |

## What shipped

- Localized three-level catalog (categories, products, items with per-locale details, prices in integer hundredths, enforced foreign keys and a 10-character category id limit) with migration `drizzle/0002_married_otto_octavius.sql` and a five-category seed (SWHR2-T-0153).
- Locale-scoped reads with no cross-locale fallback, a configurable data-access layer and `CatalogError` on store failure (SWHR2-T-0154); legacy paging defaults of start 0, size 2 (SWHR2-T-0155); whitespace-tokenized, case-insensitive, any-keyword search over product name, category id and item description (SWHR2-T-0156).
- `/api/catalog/*` routes and the shared 5-minute cache for list reads; item detail and search stay live (SWHR2-T-0157).
- Storefront screens: pet map home, category panel, paged category list, product item list, item detail, header search and results, Add to Cart (SWHR2-T-0158); browse-to-cart E2E and API journey tests (SWHR2-T-0159).

## Divergence from plan

- The sprint was re-planned on 2026-10-29 after S-0008 was cancelled: SWHR2-T-0143..0148 were cancelled and replaced one-for-one by SWHR2-T-0154..0159, which ported the already reviewed S-0008 commits. SWHR2-T-0142 had reached DONE before the re-plan and SWHR2-T-0153 ported it again.
- Ticket-level deviations, each recorded in its summary: out-of-range paging start returns the legacy empty page (T-0155); `itemsQuery`/`toItemRow` exported for search reuse (T-0156); new shared helper `services/catalog/http.ts` outside the ownership map (T-0157); `search.get.ts` passes `start`/`size` and the seed gained real product descriptions (T-0158).
- Defect SWHR2-T-0160 (planned in the backlog) was fixed in place by SWHR2-T-0159 rather than as its own dispatch: `e2e/localization.spec.ts` now expects `unitPrice: 14200`.

## Verification

PASS on the evidence available — see `qa-test-report.md`. Lint, typecheck, build, 143 unit tests and the 26-test catalog-browsing acceptance suite pass. The browser tier was not executed: Chromium was missing in the QA container (`integration-test-result.md`, `E2E-RESULT: chromium 0 passed, 0 failed, 0 skipped`), so UI scenarios rest on jsdom page tests. CI on the sprint branch reports `pass` with no workflow runs listed by `a2a_get_ci_status`; whether CI executed `e2e/catalog.spec.ts` is `Unknown`. No product defects found (`integration-defects-resolution.md`).

## Defects Raised

| Ticket       | Description                                                                            | Filed by       | Status                                                                                    |
| ------------ | -------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| SWHR2-T-0160 | Localization E2E still expected the major-unit cart price after the move to hundredths | planning       | BACKLOG — fix already merged in c797c2d (SWHR2-T-0159); ticket should be closed by Triage |
| SWHR2-T-0161 | `e2e/localization.spec.ts` expects cart `unitPrice` 142; prices are now 14200          | implementation | BACKLOG — duplicate of SWHR2-T-0160, same fix merged                                      |

## Retrospective

- Went well: porting the reviewed S-0008 commits made the re-plan cheap — six implementation tickets landed within about an hour of planning, each with a short summary and its case ids cited.
- Went well: the money-in-hundredths decision was taken once in `design.md` and promoted to ARCHITECTURE.md, so the fixture fallout was a single assertion.
- Could improve: the browser tier never ran in any agent container this sprint (T-0158, T-0159 and QA all report no Chromium, while T-0159's design check says it rendered with the container's Chromium — the records disagree). UI acceptance therefore rests on jsdom; a browser-equipped run of `e2e/catalog.spec.ts` is still owed.
- Could improve: approved mockups were exported to the platform workspace, not committed, so QA had no design reference and T-0158 compared by reading. Design gaps D1–D8 in `SWHR2-T-0159/design-check.md` were left unfiled; they need a screen-polish ticket.
- Could improve: the hundredths change missed one E2E fixture, and two agents filed the same defect (SWHR2-T-0160, SWHR2-T-0161) seven minutes apart.

## Compliance / Control Evidence

| Control                        | Evidence                                                  | Location                                                                                         | Status                       | Exception                          |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------- | ---------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; per-ticket PLAN.md | `openspec/changes/swhr2-i-0004-catalog-browsing-and-search/`, `artifacts/SWHR2-S-0009/*/PLAN.md` | Satisfied                    | —                                  |
| Change verified before release | QA report, PASS verdict with per-scenario verdicts        | `artifacts/SWHR2-S-0009/qa-test-report.md`                                                       | Satisfied                    | Browser E2E not executed           |
| Tests executed                 | per-ticket TDD results; QA unit and acceptance runs       | `artifacts/SWHR2-S-0009/SWHR2-T-015*/tdd-test-result.md`, `qa-test-report.md`                    | Satisfied                    | —                                  |
| Browser E2E executed           | E2E result marker 0/0/0                                   | `artifacts/SWHR2-S-0009/integration-test-result.md`                                              | Evidence Required            | Chromium missing in QA container   |
| Code reviewed before merge     | self-review lines in each ticket summary                  | `artifacts/SWHR2-S-0009/SWHR2-T-015*/summary.md`                                                 | Satisfied (self-review only) | No independent reviewer            |
| Design conformance             | design checks with differences D1–D8                      | `artifacts/SWHR2-S-0009/SWHR2-T-0158/design-check.md`, `SWHR2-T-0159/design-check.md`            | Partially satisfied          | Differences accepted, not ticketed |
| Defects dispositioned          | 0 found at QA; 2 raised, fixed in c797c2d                 | `integration-defects-resolution.md`, this file                                                   | Satisfied                    | Tickets still BACKLOG              |
| Release accepted               | `Not Provided`                                            | —                                                                                                | Not Provided                 | —                                  |
