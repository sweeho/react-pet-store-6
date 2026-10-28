---
artifact: qa-test-report
sprint: SWHR2-S-0006
ticket: SWHR2-T-0086
author: validation
---

## Executive Summary

Sprint SWHR2-S-0006 (SWHR2-I-0002, landing page and shared site shell) passes. Build, lint, typecheck, 44 unit tests and the 5-test Playwright suite all ran green on the integrated branch, and a throwaway 9-test Playwright probe confirmed the shell on every route. No defects found. There is no separate staging deployment in this container; verification ran against the Vite dev server that Playwright starts on :5178.

## E2E Test Status

`bun run test:e2e` (Chromium, via a symlinked browser path because the installed Chromium revision differs from the one Playwright 1.50 expects): `5 passed (2.9s)`, 0 failed, 0 skipped. Full table in `integration-test-result.md`.

## Unit Test Results

`bun run verify` exit 0: lint clean, `tsc --build` clean, `Test Files  14 passed (14)`, `Tests  44 passed (44)`.

SCENARIO-VERDICT: Landing page / A user opens the root route — pass
SCENARIO-VERDICT: Global navigation / Navigation is present on every page — pass
SCENARIO-VERDICT: Shared page layout / A page renders inside the shell — pass
SCENARIO-VERDICT: Shared state frames / A page has nothing to show — pass
SCENARIO-VERDICT: Shared state frames / A page fails to load — pass

Evidence: scenarios 1 to 4 by `e2e/home.spec.ts` plus a deleted-after-run probe that loaded `/`, `/petstore`, `/petstore/cart`, `/petstore/signin`, `/admin`, `/supplier`, `/about` and an unknown URL and asserted banner, navigation (four groups, link to `/`) and contentinfo on each (9 passed). The empty frame was seen rendered on `/admin`. The error frame with Try again is verified by `ErrorFrame.test.tsx` (unit), not in a browser.

## Code Review

Inspected `src/components/shell/*`, `areas.ts` and `src/pages/index.tsx`. Navigation entries come from one `areas.ts` list grouped Shop / Account / Administration / Supplier. Some entries share a route (Checkout and Shopping cart both go to `/petstore/cart`), which is by design for unshipped areas. No issues.

## Coverage Summary

No coverage tool is configured in the declared commands and none was run. Every shell component has a sibling `*.test.tsx`; this is by inspection, not a measured percentage.

## Issues Found

None. Design fidelity: paired 1440x900 screenshots are under `artifacts/SWHR2-S-0006/qa/design/` (mockup-landing/app-landing, mockup-empty/app-empty, mockup-shell and mockup-error for reference). Differences are mostly scope: the header search, language switch, Cart/Account/Sign in controls, catalog sub-list, "Choose a pet" panel and per-card descriptions belong to later capabilities (the plan leaves them out). One small visual issue: on `/petstore/cart` both "Shopping cart" and "Checkout" nav items show as active because they share a route. The error frame is not rendered on any route yet, so it could not be screenshotted; it is unit-tested.

## Design fidelity

DESIGN-VERDICT: SWHR2-MCK-1 differs — landing content, button and card grid present; category panel and header controls out of scope, card descriptions absent
DESIGN-VERDICT: SWHR2-MCK-2 differs — rail, header brand and footer present; header search, language and account controls absent (later capabilities); loading frame not screenshotted
DESIGN-VERDICT: SWHR2-MCK-3 differs — shared empty frame (icon, heading, text, home link) rendered; mockup's cart-specific copy and actions are cart-capability content
DESIGN-VERDICT: SWHR2-MCK-4 not built — ErrorFrame component exists and is unit-tested but no route renders it yet

## Recommendation

Approve: fire `validation.all_acs_passed`. Note for the platform: the container's Chromium (1223) does not match Playwright 1.50's expected revision (1155), so `bun run test:e2e` fails its preflight unless `PLAYWRIGHT_BROWSERS_PATH` points at a symlinked directory.
