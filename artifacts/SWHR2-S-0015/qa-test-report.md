---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0015
capability brief: SWHR2-I-0006
branch: vortex/test/SWHR2-T-0240-integration-qa-report-swhr2-s-0015-d9094931
upstream: [artifacts/SWHR2-S-0015/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0015/sprint-summary.md]
---

# QA test report — SWHR2-S-0015

## Executive Summary

**Verdict: PASS.** The customer account and profile feature (SWHR2-T-0239) was verified on the integrated branch with unit tests (205 passed) and Playwright E2E (15 passed, 0 skipped). Two defects were found and fixed in place (anonymous 401 console error; My List panel not refreshing after sign-up), none escalated. Details in `integration-defects-resolution.md`.

## E2E Test Status

Playwright, chromium: 15 passed, 0 failed, 0 skipped after fixes (one failure before DEFECT-1). Per-spec table and the browser-path workaround are in `artifacts/SWHR2-S-0015/integration-test-result.md`.

## Unit Test Results

```
$ bun run verify   (lint + typecheck + unit)
 Test Files  55 passed (55)
      Tests  205 passed (205)
```

The sprint started at 204 tests; the extra one is the DEFECT-1 regression test.

## Code Review

Observed incidentally: `MyListPanel` lives in a layout, so any data it reads must be re-read on navigation (fixed). The scenario verdicts for service-level rules (all-or-nothing creation, address transactions, snapshot, defaults, uniqueness) rest on the cited unit/route tests in the passing run, verified by test run, not re-exercised manually in a browser. Otherwise no notable concerns.

## Coverage Summary

`bun run test --coverage` failed with `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'`, so no coverage figure is claimed. Coverage regression: Unknown.

## Issues Found

- DEFECT-1 (anonymous 401 console error): FIXED in place, see `integration-defects-resolution.md`.
- DEFECT-2 (My List stale after sign-up): FIXED in place, see `integration-defects-resolution.md`.

Design fidelity (advisory, ticket mandates exactly seven sections): mockups SWHR2-MCK-19, -20 and -21 under `artifacts/SWHR2-S-0015/design/` were NOT compared against the built screens (no paired screenshots), so no DESIGN-VERDICT is issued; this is Evidence Required, not a pass. The three screens did render with the expected content in E2E.

Scenario verdicts (all pass; basis is the passing unit/route tests and E2E above):

SCENARIO-VERDICT: Password entered twice at sign-up / Both password fields filled with the same value — pass
SCENARIO-VERDICT: Password entered twice at sign-up / A password field left empty — pass
SCENARIO-VERDICT: Password entered twice at sign-up / The two passwords differ — pass
SCENARIO-VERDICT: Payment card type and expiry year options / Card type choices on the account form — pass
SCENARIO-VERDICT: Payment card type and expiry year options / Expiry year choices on the account form — pass
SCENARIO-VERDICT: Customer profile defaults at creation / New customer created without profile choices — pass
SCENARIO-VERDICT: Customer profile defaults at creation / Profile values supplied after creation — pass
SCENARIO-VERDICT: Account status values / Status of a new account — pass
SCENARIO-VERDICT: Account status values / Account set to disabled — pass
SCENARIO-VERDICT: Stand-alone user registration / Registration accepted — pass
SCENARIO-VERDICT: Stand-alone user registration / Registration refused — pass
SCENARIO-VERDICT: My List panel for the favourite category / MyList preference on — pass
SCENARIO-VERDICT: My List panel for the favourite category / Favourite category holds more than ten products — pass
SCENARIO-VERDICT: My List panel for the favourite category / MyList preference off — pass
SCENARIO-VERDICT: Pet-tips banner for the favourite category / Banner on the home screen — pass
SCENARIO-VERDICT: Pet-tips banner for the favourite category / Unrecognised favourite category — pass
SCENARIO-VERDICT: Pet-tips banner for the favourite category / Screen other than home or cart — pass
SCENARIO-VERDICT: Pet-tips banner for the favourite category / Banner preference off — pass
SCENARIO-VERDICT: Sign-up from the sign-in screen / User name available — pass
SCENARIO-VERDICT: Sign-up from the sign-in screen / User name cannot be registered — pass
SCENARIO-VERDICT: One customer per user id / Duplicate user id — pass
SCENARIO-VERDICT: Customer creation is all-or-nothing / Profile creation fails — pass
SCENARIO-VERDICT: Customer creation is all-or-nothing / Account creation fails — pass
SCENARIO-VERDICT: Customer record keyed by user id / Customer looked up by user id — pass
SCENARIO-VERDICT: Customer profile contents / Profile without a favourite category — pass
SCENARIO-VERDICT: Customer profile contents / On/off preferences always set — pass
SCENARIO-VERDICT: Account contents / Account read after creation — pass
SCENARIO-VERDICT: Contact information snapshot / Snapshot taken — pass
SCENARIO-VERDICT: Contact information snapshot / Snapshot does not change the record — pass
SCENARIO-VERDICT: Address operations are transactional / Update inside a failing change — pass
SCENARIO-VERDICT: Address operations are transactional / Update with no caller transaction — pass
SCENARIO-VERDICT: Account creation before purchase / First-time visitor signs up — pass

## Recommendation

Proceed: fire `validation.all_acs_passed`. All defects were fixed in place; no future-sprint DEFECT filed.
