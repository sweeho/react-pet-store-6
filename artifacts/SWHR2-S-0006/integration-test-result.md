---
artifact: integration-test-result
sprint: SWHR2-S-0006
ticket: SWHR2-T-0086
author: validation
---

# Integration test result

Command: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e` (the path holds symlinks `chromium-1155` -> installed `chromium-1223`; the stock path fails the preflight with "Chromium browser is not installed").

Summary line: `5 passed (2.9s)`

| Spec              | Test                                                                      | Result |
| ----------------- | ------------------------------------------------------------------------- | ------ |
| e2e/home.spec.ts  | Landing page › shows the welcome heading and a link to every primary area | pass   |
| e2e/home.spec.ts  | Landing page › has no vertical scrollbar on common viewport sizes         | pass   |
| e2e/smoke.spec.ts | home page loads with no console errors                                    | pass   |
| e2e/smoke.spec.ts | the API responds                                                          | pass   |
| e2e/smoke.spec.ts | a database-backed route responds                                          | pass   |

No failures, no skipped tests, every spec file ran.

E2E-RESULT: chromium 5 passed, 0 failed, 0 skipped
