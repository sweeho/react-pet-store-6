---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0017
capability brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0017-002e294d
upstream: [artifacts/SWHR2-S-0017/SPRINT-PLAN.md]
---

# Integration test result — SWHR2-S-0017

Command: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e` after `bun install` and `bun run build` (both exit 0).

The stock preflight failed because the installed Playwright expects `chromium-1155` while the container ships `chromium-1223` in `/ms-playwright`. I symlinked the shipped 1223 build into `/tmp/pw` under the expected names and pointed `PLAYWRIGHT_BROWSERS_PATH` at it. Nothing was installed and no repo file changed.

Run summary: `1 failed` / `14 passed (7.5s)`. Playwright's skipped count was not printed, so it is 0.

| Spec                     | Result                              |
| ------------------------ | ----------------------------------- |
| e2e/account.spec.ts      | 2 passed, 1 failed (line 14, flaky) |
| e2e/catalog.spec.ts      | 2 passed                            |
| e2e/home.spec.ts         | 2 passed                            |
| e2e/localization.spec.ts | 5 passed                            |
| e2e/smoke.spec.ts        | 3 passed                            |

No spec file was wholly skipped.

Failure: `e2e/account.spec.ts:14` "new visitor signs up with differing passwords", expected `#acct-cardType` options `["Java(TM) Card","Duke Express","Meow Card"]`, received `[]`. Re-run of that one spec (`bunx playwright test e2e/account.spec.ts -g "differing passwords"`): `1 passed (3.9s)`. Disagreement across runs, so it is recorded as flaky and filed as SWHR2-T-0256, not retried further.

No e2e spec covers the cart screen's Remove, Update Cart, total or Check Out, because those controls are not built (SWHR2-T-0255).

E2E-RESULT: chromium 14 passed, 1 failed, 0 skipped
