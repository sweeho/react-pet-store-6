---
artifact: integration-test-result
sprint: SWHR2-S-0007
ticket: SWHR2-T-0103
author: validation
---

# Integration test result — SWHR2-S-0007

Command: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test --project=chromium` (the container's Chromium 1223 was symlinked under the 1155 path Playwright 1.50 expects; `bun run test:e2e` preflight otherwise stops on the missing 1155 build).

Run summary (final run): `10 passed (3.7s)`. Three consecutive runs after the fix were green. Before the fix, runs showed `2 failed, 8 passed` and `1 failed, 9 passed` (defect D1, a test race with the client session-locale fetch).

| Spec                                                                                                           | Result |
| -------------------------------------------------------------------------------------------------------------- | ------ |
| e2e/home.spec.ts › shows the welcome heading and a link to every primary area                                  | pass   |
| e2e/home.spec.ts › has no vertical scrollbar on common viewport sizes                                          | pass   |
| e2e/localization.spec.ts › a shopper who has not chosen a locale sees US English                               | pass   |
| e2e/localization.spec.ts › activating the Japanese flag in the header switches the storefront to Japanese      | pass   |
| e2e/localization.spec.ts › selecting Japanese and submitting Change Locale sets ja_JP and confirms it          | pass   |
| e2e/localization.spec.ts › changing locale to zh_CN re-lists the EST-1 cart line with its zh_CN name and price | pass   |
| e2e/localization.spec.ts › storefront screens render localized text in en_US, ja_JP and zh_CN                  | pass   |
| e2e/smoke.spec.ts › home page loads with no console errors                                                     | pass   |
| e2e/smoke.spec.ts › the API responds                                                                           | pass   |
| e2e/smoke.spec.ts › a database-backed route responds                                                           | pass   |

No spec file was skipped.

E2E-RESULT: chromium 10 passed, 0 failed, 0 skipped
