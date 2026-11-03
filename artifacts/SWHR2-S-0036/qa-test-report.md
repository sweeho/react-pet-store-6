---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0036
capability_brief: SWHR2-I-0017
branch: vortex/test/SWHR2-T-0335-integration-qa-report-swhr2-s-0036-29336c98
upstream: [artifacts/SWHR2-S-0036/SWHR2-T-0333/fix-note.md]
---

## Executive Summary

The PetMap fix (SWHR2-T-0333) meets all five scenarios of SWHR2-R-0041. Lint, typecheck, unit and Playwright runs are green; no defects found. Seven locked acceptance failures in unrelated capabilities are warnings (enforced at UAT only).

## E2E Test Status

`bun run test:e2e -- --project=chromium`: `24 passed (14.3s)`. Details in `integration-test-result.md`.
Warning (locked acceptance, not enforced until UAT): `bun run test:acceptance` gave `Tests 7 failed | 214 passed (221)`: customer-notifications/notifications.test.ts (SWHR2-C-0049, 0055, 0056, 0061, 0062, 0067) and sign-on/internal.test.ts (SWHR2-C-0264). None touch the catalog or PetMap.

SCENARIO-VERDICT: Home screen pet selection / Home screen displayed — pass (PetMap.test.tsx links for all five pets; e2e name-cell alignment lookups)
SCENARIO-VERDICT: Home screen pet selection / Pet region selected — pass (unit test checks region hrefs incl. Fish -> /petstore/category/FISH)
SCENARIO-VERDICT: Home screen pet selection / Picture aligned with the names on a wide screen — pass (e2e at 1800px: no gutter, edges within 2px)
SCENARIO-VERDICT: Home screen pet selection / Pet region selected on a wide screen — pass (e2e at 1800px clicks Cats centre -> CATS; 1800px used, not exactly 1400px)
SCENARIO-VERDICT: Home screen pet selection / Pet region selected on a narrow screen — pass (e2e at 700px clicks Dogs centre -> DOGS; 700px used, not exactly 600px)

## Unit Test Results

`bun run verify` (lint, typecheck, vitest): exit 0, `Test Files 90 passed (90)`, `Tests 434 passed (434)`.

## Code Review

Reviewed the diff of `src/components/storefront/PetMap.tsx`: the img is `h-auto w-full`, and five absolutely positioned 20%-wide links replace the fixed-coordinate `<map>`. No findings. Design fidelity: the sprint has no design/ directory in the worktree; no design reference was compared.

## Coverage Summary

No coverage tool was run (none declared for this project); coverage is Unknown. The changed component has a unit test and two e2e tests at 700px and 1800px.

## Issues Found

None. No SPEC-GAP.

## Recommendation

Pass. All scenarios verified by executed runs; defects fixed in place: none.
