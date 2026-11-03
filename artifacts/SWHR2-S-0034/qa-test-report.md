---
artifact: qa-test-report
sprint: SWHR2-S-0034
ticket: SWHR2-T-0327
---

# QA test report — SWHR2-S-0034

## Executive Summary

Goal "Place order duplicating shopping cart": the duplicate "Place order" nav entry was removed (SWHR2-T-0324). All four SWHR2-R-0289 scenarios hold. Lint, typecheck, build and 432 unit tests pass. One e2e spec (order-approval) failed once in the full run and passed on a single-spec rerun; filed as flaky future DEFECT SWHR2-T-0328. Verdict: pass.

SCENARIO-VERDICT: Global navigation / Navigation is present on every page — pass (GlobalNav.test.tsx, unit run; e2e home/smoke specs load the shell)
SCENARIO-VERDICT: Global navigation / Shop group entries — pass (unit test C-0283; verified in jsdom, no dedicated browser spec)
SCENARIO-VERDICT: Global navigation / No two entries share a destination — pass (unit test C-0285)
SCENARIO-VERDICT: Global navigation / Only the current page's entry is highlighted — pass (unit test C-0286; no browser spec for C-0287)

## E2E Test Status

Command `bun run test:e2e`: `1 failed, 19 passed (39.8s)`. Failed: `order-approval.spec.ts:15 [SWHR2-C-0243]` (order 10011 already COMPLETED, timeout 30s). Rerun of that spec alone: `1 passed (6.5s)`. Mixed outcome = flaky; recorded as DEFECT SWHR2-T-0328 (future sprint). Details in `integration-test-result.md`.

Warnings (acceptance enforced only at UAT, not fixed): `bun run test:acceptance` gave `7 failed | 214 passed`: C-0049, C-0056, C-0055, C-0061, C-0062, C-0067 (customer-notifications/notifications.test.ts) and C-0264 (sign-on/internal.test.ts). None concern the navigation.

## Unit Test Results

`bun run test`: `Test Files 90 passed (90); Tests 432 passed (432)`.

## Code Review

Diff of SWHR2-T-0324 inspected: removes the "Place order" area and unused credit-card icon from `src/components/shell/areas.ts` and `GlobalNav.tsx`, adds regression tests. No findings. `bun run lint` and `bun run typecheck` exit 0.

## Coverage Summary

No coverage tool run; coverage not measured.

## Issues Found

- SWHR2-T-0328: flaky e2e order-approval C-0243 (future sprint, not fixed in place).
- Design: the brief carries one wireframe ("Shop menu — before → after", no mockup key); the built Shop group matches its "after" intent per unit tests; no screenshot comparison was done.
- No SPEC-GAP found.

## Recommendation

Pass. Pending: SWHR2-T-0328 flaky test and UAT triage of the 7 acceptance warnings.
