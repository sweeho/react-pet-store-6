---
artifact: qa-test-report
sprint: SWHR2-S-0009
ticket: SWHR2-T-0163
author: validation
---

# QA Test Report — SWHR2-S-0009 (SWHR2-I-0004 Catalog browsing and search)

## Executive Summary

Sprint head `7ec4ba1`. Lint, typecheck, build, unit suite (143 tests) and the catalog-browsing acceptance suite (26 tests) all pass. The Playwright browser tier could not be executed because Chromium is not installed in this container, so browser-level behaviour is verified only through jsdom component/page tests. No defects found. No mockup HTML was present on the branch (`design/` contains only MANIFEST.md), so no design comparison was possible.

## E2E Test Status

Not executed: `bun run test:e2e` stopped in its preflight with "Playwright's Chromium browser is not installed (expected at: /ms-playwright/chromium-1155/chrome-linux/chrome)". `bunx playwright test --list` shows 12 tests in 4 files, 0 run. The catalog E2E spec `tests/acceptance/catalog-browsing/e2e/browse.spec.ts` was not run either. Details in `integration-test-result.md`.

## Unit Test Results

- `bun run test`: `Test Files 43 passed (43)`, `Tests 143 passed (143)`, exit 0.
- `NODE_ENV=test bun --bun vitest run --config vitest.acceptance.config.ts tests/acceptance/catalog-browsing`: `Test Files 5 passed (5)`, `Tests 26 passed (26)`, exit 0.
- `bun run test:acceptance` over all capabilities: `156 failed | 48 passed`. Failures are in other capabilities' suites (sign-on, shopping-cart, checkout, order-approval, sales-reporting, ... missing modules/tables), outside this sprint's scope.

## Code Review

Not a line-by-line review of merged tickets. Verified by execution: `bun run lint` exit 0 (max-warnings 0), `bun run typecheck` exit 0, `bun run build` exit 0.

## Coverage Summary

No coverage tool was run; no coverage figure is claimed.

## Issues Found

- I1: Chromium missing in this container, so browser E2E is unverified (environment limitation, not a product defect).
- I2: Approved mockups are not committed on the branch, so the design fidelity pass was not performed. No design reference was available to compare; no DESIGN-VERDICT is claimed.

No product defects found.

## Recommendation

Pass on the evidence available. Run `bun run test:e2e` in a browser-equipped environment (CI) to confirm the UI scenarios marked below as verified by jsdom tests.

Scenario verdicts (UI scenarios rest on jsdom component/page tests in `src/pages/petstore*`, `src/components/storefront`, and `tests/acceptance/catalog-browsing/item-page.test.tsx`; service scenarios on the passing acceptance suite):

SCENARIO-VERDICT: Catalog keyword search / Any keyword matches — pass
SCENARIO-VERDICT: Catalog keyword search / Category id matches — pass
SCENARIO-VERDICT: Catalog keyword search / Duplicate keywords — pass
SCENARIO-VERDICT: Catalog keyword search / Mixed-case keyword — pass
SCENARIO-VERDICT: Catalog keyword search / Blank search text — pass
SCENARIO-VERDICT: Catalog read paths and failure reporting / Both read paths agree — pass
SCENARIO-VERDICT: Catalog read paths and failure reporting / Data access selected by configuration — pass
SCENARIO-VERDICT: Catalog read paths and failure reporting / Catalog store unreachable — pass
SCENARIO-VERDICT: Item visible only where its product is localized / Product not localized — pass
SCENARIO-VERDICT: Item visible only where its product is localized / Item and product both localized — pass
SCENARIO-VERDICT: Default catalog paging / No paging values supplied — pass
SCENARIO-VERDICT: Default catalog paging / Only a page size supplied — pass
SCENARIO-VERDICT: Shared five-minute cache of catalog pages / Change appears within five minutes — pass
SCENARIO-VERDICT: Shared five-minute cache of catalog pages / Cached copy reused across shoppers — pass
SCENARIO-VERDICT: Shared five-minute cache of catalog pages / Item detail not cached — pass
SCENARIO-VERDICT: Catalog hierarchy / Product without a category is refused — pass
SCENARIO-VERDICT: Catalog hierarchy / Item localization without prices is refused — pass
SCENARIO-VERDICT: Catalog hierarchy / Per-locale details — pass
SCENARIO-VERDICT: List categories / Categories sorted by name — pass
SCENARIO-VERDICT: List categories / Page within the list — pass
SCENARIO-VERDICT: List categories / Category not localized — pass
SCENARIO-VERDICT: Category product list with Previous and Next / First page of a category — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Category product list with Previous and Next / Last page of a category — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Item detail page / Item detail displayed — pass
SCENARIO-VERDICT: Item detail page / Add to Cart from item detail — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Home screen pet selection / Home screen displayed — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Home screen pet selection / Pet region selected — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Home screen and category navigation panel / Side panel on every screen — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Home screen and category navigation panel / Side panel entry selected — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Locale-scoped catalog descriptions / Shopper sees own locale only — pass
SCENARIO-VERDICT: Category code is mandatory and unique / Duplicate category code — pass
SCENARIO-VERDICT: Category code is mandatory and unique / Missing category code — pass
SCENARIO-VERDICT: Category identifier length / Over-long category id — pass
SCENARIO-VERDICT: Category identifier length / Ten-character category id — pass
SCENARIO-VERDICT: Localized catalog details / Category names in shopper's locale — pass
SCENARIO-VERDICT: Browse from home to item / Navigate to a product's items — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Browse from home to item / Add an item from the product's item list — pass (jsdom; browser E2E not run)
SCENARIO-VERDICT: Search keyword tokenization / Tabs and repeated words — pass
SCENARIO-VERDICT: Search keyword tokenization / Whitespace-only query — pass
