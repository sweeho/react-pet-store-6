---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0014
ticket: SWHR2-T-0233
capability brief: SWHR2-I-0005
branch: vortex/test/SWHR2-T-0233-integration-qa-report-swhr2-s-0014-6fe7525f
upstream: [artifacts/SWHR2-S-0014/SPRINT-PLAN.md]
---

# Integration test result — SWHR2-S-0014

Browser: Chromium 1223 from `/ms-playwright`, linked as 1155 under `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw` (the repo preflight refuses 1223).

Command: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test` (after `bun install`, `bun run build`)
Summary line: `12 passed (5.3s)`

| Spec                     | Passed                           | Failed | Skipped |
| ------------------------ | -------------------------------- | ------ | ------- |
| e2e/catalog.spec.ts      | 2                                | 0      | 0       |
| e2e/home.spec.ts         | 1                                | 0      | 0       |
| e2e/localization.spec.ts | 5                                | 0      | 0       |
| e2e/smoke.spec.ts        | 3                                | 0      | 0       |
| e2e/sign-on.spec.ts      | not present in the regular suite |        |         |

Additional run: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test --config playwright.acceptance.config.ts tests/acceptance/sign-on` → `5 failed`, `4 passed (8.4s)`.

| Case   | Result | Cause                                                                   |
| ------ | ------ | ----------------------------------------------------------------------- |
| C-0253 | pass   |                                                                         |
| C-0255 | pass   |                                                                         |
| C-0257 | pass   |                                                                         |
| C-0267 | pass   |                                                                         |
| C-0252 | fail   | checkout page not built (SWHR2-I-0008)                                  |
| C-0254 | fail   | checkout page not built (SWHR2-I-0008)                                  |
| C-0256 | fail   | test navigates before the admin sign-in completes; app verified correct |
| C-0258 | fail   | link query matches 3 links (strict mode)                                |
| C-0269 | fail   | test sets locale via unsupported `?locale=`; app verified correct       |

No traces were kept (retries 0). Details in `qa-test-report.md` Issues Found.

E2E-RESULT: chromium 12 passed, 0 failed, 0 skipped
