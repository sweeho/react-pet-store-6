---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0035
capability_brief: Not Provided
branch: vortex/test/SWHR2-T-0331-integration-qa-report-swhr2-s-0035-80a834bf
upstream: [artifacts/SWHR2-S-0035/SWHR2-T-0328/PLAN.md]
---

## Executive Summary

SWHR2-T-0328 changes only `e2e/order-approval.spec.ts` so [SWHR2-C-0243] asserts the stable outcome (APPROVED or COMPLETED, absent from pending). Verified: build, unit suite and three consecutive full e2e runs all green. No defects. Locked acceptance suite has 8 failures, reported as UAT warnings.

## E2E Test Status

Full detail in `artifacts/SWHR2-S-0035/integration-test-result.md`. `bun run test:e2e`: `20 passed (13.4s)`, then `20 passed (12.1s)` twice; 0 failed, 0 skipped. [SWHR2-C-0243] passed in all three runs.

Warnings (acceptance enforced only at UAT; not fixed, not holding the sprint): `bun run test:acceptance:e2e` gave `8 failed`, `58 passed` (exit 1). Failing: SWHR2-C-0197, C-0198 (catalog-browsing/browse.spec.ts), C-0157 (customer-account/account.spec.ts), C-0079 (data-population/areas.spec.ts), C-0021, C-0026, C-0028, C-0039 (localization/localization.spec.ts). None is in order-approval; all order-approval acceptance tests (C-0240 to C-0249) passed. Causes not investigated.

## Unit Test Results

`bun run test`: `Test Files  90 passed (90)`, `Tests  434 passed (434)`, exit 0.

## Code Review

Verified by inspection of `git diff dev -- e2e`: the spec is retitled, polls with `toContainText(/APPROVED|COMPLETED/)`, asserts the row does not contain PENDING or DENIED, then asserts the row count is 0 on the Pending tab. No application file or `tests/acceptance/**` changed (the diff on `src/pages/admin/tool.test.tsx` is the unit tests for C-0288/C-0289).

## Coverage Summary

No coverage command is declared for this project and none was run. Coverage: Not Applicable (test-only change).

## Issues Found

None in scope. Acceptance warnings listed under E2E Test Status.

## Regression guards

- SWHR2-C-0288: working. `src/pages/admin/tool.test.tsx:295` passed within the 434/434 unit run.
- SWHR2-C-0289: working. `src/pages/admin/tool.test.tsx:299` passed within the same run.

## Recommendation

Pass the sprint. Evidence: build exit 0, unit 434/434, e2e 20/20 three times in a row.

SCENARIO-VERDICT: Pending and non-pending order views / Orders are split between the two views — pass (acceptance C-0242 passed; e2e C-0243 asserts pending absence)
SCENARIO-VERDICT: Pending and non-pending order views / Non-pending view reloaded on request — pass (acceptance C-0243 passed)
SCENARIO-VERDICT: Pending and non-pending order views / Approved order fulfilled before the refresh — pass (unit C-0288 and C-0289 passed; e2e C-0243 passed 3 of 3 runs)
