---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0024
ticket: SWHR2-T-0285
capability brief: SWHR2-I-0008
branch: vortex/sprint/swhr2-s-0024-d5762589
upstream: [artifacts/SWHR2-S-0024/SWHR2-T-0284/summary.md]
downstream: [artifacts/SWHR2-S-0024/qa-test-report.md]
---

# Integration test result — SWHR2-S-0024

Browser note: `bun run test:e2e` stops at its preflight, which looks for Chromium 1155 at `/ms-playwright/chromium-1155`. The container has Chromium 1223 instead (`/ms-playwright/chromium-1223/chrome-linux/chrome`). The real Playwright suite was therefore run with `bunx playwright test` using a throw-away config (not committed, deleted after the run) that reused the repo's `playwright.config.ts` and only set `launchOptions.executablePath` and `--no-sandbox` for the `chromium` project, plus a copy of `e2e/global-setup.ts` with the same executable path. Specs, web server, port 5178 and env are the repo's own.

Command: `bunx playwright test --config pw.tmp.config.ts --project=chromium` (`bunx playwright test --list`: 22 tests in 7 files, all in project `chromium`)

Run 1 (before fix): `1 failed, 21 passed` — `checkout.spec.ts:28` failed (`getByRole('heading', { name: /order placed/i })` not found). Re-run of that spec twice, same failure (consistent, not flaky). Fixed as DEFECT-1, see `integration-defects-resolution.md`.

Run 2 (after fix, final):

```
  22 passed (12.5s)
```

| Spec                                                                                       | Result                              |
| ------------------------------------------------------------------------------------------ | ----------------------------------- |
| account.spec.ts (3 tests)                                                                  | 3 passed                            |
| cart.spec.ts (3 tests)                                                                     | 3 passed                            |
| catalog.spec.ts (2 tests)                                                                  | 2 passed                            |
| checkout.spec.ts: C-0089 Check Out opens the form                                          | passed                              |
| checkout.spec.ts: C-0252 visitor not signed in sent to sign in                             | passed                              |
| checkout.spec.ts: C-0101 / C-0254 placing an order shows Order Placed and empties the cart | passed (failed before DEFECT-1 fix) |
| checkout.spec.ts: C-0174 first-time visitor signs up and can buy                           | passed                              |
| home.spec.ts (2 tests)                                                                     | 2 passed                            |
| localization.spec.ts (5 tests)                                                             | 5 passed                            |
| smoke.spec.ts (3 tests)                                                                    | 3 passed                            |

No spec file was skipped; skipped count is 0.

Locked acceptance browser specs for this capability, same browser override, `playwright.acceptance.config.ts` copy: `bunx playwright test --config pw.acc.tmp.config.ts tests/acceptance/checkout` → `3 passed (7.1s)` (SWHR2-C-0215, C-0216, C-0212).

E2E-RESULT: chromium 22 passed, 0 failed, 0 skipped
