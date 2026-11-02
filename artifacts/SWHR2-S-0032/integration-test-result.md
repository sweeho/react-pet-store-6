---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0032
capability brief: SWHR2-I-0013
branch: vortex/sprint/swhr2-s-0032-f7be8d82
downstream: [artifacts/SWHR2-S-0032/qa-test-report.md]
---

# Integration test result — SWHR2-S-0032

## Commands run

`bun install`, `bun run build`, `bunx playwright test --list` (20 tests in 8 files, all under `chromium`), then `bun run test:e2e -- --project=chromium`.

Playwright summary line: `20 passed (12.4s)`

## Results

| Spec                           | Result   | Notes |
| ------------------------------ | -------- | ----- |
| e2e/account.spec.ts            | 3 passed |       |
| e2e/cart.spec.ts               | 3 passed |       |
| e2e/catalog.spec.ts            | 2 passed |       |
| e2e/home.spec.ts               | 2 passed |       |
| e2e/localization.spec.ts       | 5 passed |       |
| e2e/order-approval.spec.ts     | 1 passed |       |
| e2e/smoke.spec.ts              | 3 passed |       |
| e2e/supplier-inventory.spec.ts | 1 passed |       |

No skips. No Playwright spec targets `/admin/tool` (Orders and sales); that screen is verified by component, route and acceptance tests, see qa-test-report.md.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
