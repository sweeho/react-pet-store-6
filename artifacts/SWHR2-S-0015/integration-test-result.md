---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0015
capability brief: SWHR2-I-0006
branch: vortex/sprint/swhr2-s-0015-ba46b929
downstream: [artifacts/SWHR2-S-0015/qa-test-report.md]
---

# Integration test result — SWHR2-S-0015

## Commands run

The container's Playwright expects chromium-1155 but ships chromium-1223, so the preflight refused. A symlink dir was used (`PLAYWRIGHT_BROWSERS_PATH=/tmp/pw`, `chromium-1155 -> /ms-playwright/chromium-1223`); Playwright then launched the real browser.

```
bun install && bun run build            # exit 0
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bun run test:e2e
```

First run (before fixes): `1 failed, 11 passed` (DEFECT-1, smoke.spec.ts 401 console error). Final run after fixes (includes new `e2e/account.spec.ts`): `15 passed (6.7s)`.

## Results

| Spec                          | Result | Notes                                                                                                                                                                             |
| ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| e2e/account.spec.ts (3 tests) | pass   | new: duplicate user name error page; sign-up with differing passwords, card type/year selects, account creation, Home with birds banner and My List; j2ee dogs banner, no My List |
| e2e/catalog.spec.ts (2)       | pass   |                                                                                                                                                                                   |
| e2e/home.spec.ts (2)          | pass   |                                                                                                                                                                                   |
| e2e/localization.spec.ts (5)  | pass   |                                                                                                                                                                                   |
| e2e/smoke.spec.ts (3)         | pass   | failed before DEFECT-1 fix                                                                                                                                                        |

No spec file was skipped.

E2E-RESULT: chromium 15 passed, 0 failed, 0 skipped
