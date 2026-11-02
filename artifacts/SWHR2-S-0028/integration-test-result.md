---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0028
capability brief: SWHR2-I-0010
branch: vortex/sprint/swhr2-s-0028-1d7ea54c
upstream: [artifacts/SWHR2-S-0028/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0028/qa-test-report.md]
---

# Integration test result — SWHR2-S-0028

Command: `bun install && bun run build && bun run test:e2e` (Playwright, project chromium; the only project in `playwright.config.ts`).

Run summary (verbatim): `20 passed (12.2s)`

| Spec                           | Result                                          |
| ------------------------------ | ----------------------------------------------- |
| e2e/account.spec.ts            | passed                                          |
| e2e/cart.spec.ts               | passed                                          |
| e2e/catalog.spec.ts            | passed                                          |
| e2e/home.spec.ts               | passed                                          |
| e2e/localization.spec.ts       | passed (5 tests)                                |
| e2e/order-approval.spec.ts     | passed                                          |
| e2e/smoke.spec.ts              | passed (3 tests)                                |
| e2e/supplier-inventory.spec.ts | passed (`supplier updates only the marked row`) |

No skipped tests, no spec file with zero executed tests. Full log was at /tmp/e.log (not committed).

Locked acceptance E2E (`bun run test:acceptance:e2e`, warning only at UAT): 54 passed, 12 failed; see qa-test-report.md.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
