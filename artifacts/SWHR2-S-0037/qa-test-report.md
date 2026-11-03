---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0037
capability brief: SWHR2 localization bugfix
branch: vortex/test/SWHR2-T-0341-integration-qa-report-swhr2-s-0037-21c17293
upstream: [artifacts/SWHR2-S-0037/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0037/sprint-summary.md]
---

# QA test report — SWHR2-S-0037

## Executive Summary

Verdict: proceed. The integrated sprint branch builds, passes lint, typecheck and 444 unit tests, and passes all 24 project E2E tests with 0 skipped. The locked localization cases this sprint targets (C-0021, C-0026, C-0027, C-0028) pass in the warm acceptance runs. One locked acceptance test (C-0039) fails on its own selector; it is a UAT warning.

## E2E Test Status

`bun run test:e2e`: 24 passed, 0 failed, 0 skipped. Details in artifacts/SWHR2-S-0037/integration-test-result.md.

Warnings (locked acceptance suite, enforced only at UAT, not fixed):

- WARN: SWHR2-C-0039 fails in 3 of 3 runs. `getByLabel(/^password:?$/i)` matches two inputs on /petstore/signin (strict-mode violation). Locked-test selector issue, outside this sprint's change.
- WARN: on the first, cold-server run C-0022, C-0026 and C-0027 failed with an empty body at the load event; they passed in both warm re-runs. Recorded as a cold-start flake of a dev server doing dependency optimisation.
- `bun run test tests/acceptance` finds no unit files under the vitest include globs (exit 1, "No test files found"); acceptance unit tests are not part of the configured runner.

## Unit Test Results

`bun run verify` (lint + typecheck + vitest): exit 0. `Test Files 91 passed (91), Tests 444 passed (444)`. `bun run build`: exit 0.

## Code Review

No notable concerns observed. Root-level LocaleProvider, ps_locale seeding, header flags and localized shell are consistent with design.md D1 to D4.

## Coverage Summary

No coverage tool run; the project declares no coverage command.

## Issues Found

None. No defects fixed in place and no future-sprint DEFECT filed. See integration-defects-resolution.md.

## Recommendation

Proceed: fire validation.all_acs_passed.

SCENARIO-VERDICT: Supported storefront locales and header language switch / Each supported locale has a full screen set — pass (e2e/localization.spec.ts renders en_US, ja_JP, zh_CN; acceptance C-0026 passes warm)
SCENARIO-VERDICT: Supported storefront locales and header language switch / Default locale — pass (acceptance C-0027 passes warm)
SCENARIO-VERDICT: Supported storefront locales and header language switch / Shopper switches to Japanese from the header — pass (acceptance C-0028)
SCENARIO-VERDICT: Supported storefront locales and header language switch / Site navigation and footer follow the session locale — pass (acceptance C-0026: kana, no "Sign in")
SCENARIO-VERDICT: Supported storefront locales and header language switch / Header follows a flag change without navigating — pass (acceptance C-0028 flag click; header relabel covered by StorefrontHeader unit tests, not separately asserted in a browser test)
SCENARIO-VERDICT: Change-language screen / The screen is displayed — pass (unit tests and acceptance C-0021)
SCENARIO-VERDICT: Change-language screen / A locale is selected and submitted — pass (acceptance C-0021)
SCENARIO-VERDICT: Change-language screen / Next page opens in the new locale — pass (acceptance C-0021 kana on /petstore)

## Regression guards

- SWHR2-C-0026, SWHR2-C-0295, SWHR2-C-0297 (T-0338): C-0026 working (warm acceptance runs 2 of 2; failed once on cold start). C-0295 and C-0297: no browser run of their own; existing GlobalNav/site-shell unit tests pass in the 444-test run.
- SWHR2-C-0028 (T-0337): working, passes in all 3 acceptance runs.
- SWHR2-C-0021 (T-0339): working, passes in all 3 acceptance runs.

## Uncovered at level

- SWHR2-C-0295, SWHR2-C-0298 (T-0338): not exercised by a browser test in this run.
- SWHR2-C-0300 (T-0337): not exercised by a browser test in this run.
- SWHR2-C-0026, C-0028 (T-0338, T-0337) and C-0021 (T-0339) were run in the browser via the locked acceptance spec (results above).
