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

None. Design fidelity: no side-by-side mockup render was produced in this run; the landing page screenshot was captured only to confirm it renders. DESIGN-VERDICT is therefore not asserted and no conformance proposal was made. Design never gates the verdict.

## Recommendation

Approve: fire `validation.all_acs_passed`. Note for the platform: the container's Chromium (1223) does not match Playwright 1.50's expected revision (1155), so `bun run test:e2e` fails its preflight unless `PLAYWRIGHT_BROWSERS_PATH` points at a symlinked directory.
