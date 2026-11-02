---
artifact: integration-test-result
sprint: SWHR2-S-0027
ticket: SWHR2-T-0296
author: validation
---

# Integration test result — SWHR2-S-0027

Command (after `bun install` and `bun run build`, both exit 0): `bun run test:e2e`

Summary line: `19 passed (12.7s)`

| Spec                                                                                                  | Tests              | Result |
| ----------------------------------------------------------------------------------------------------- | ------------------ | ------ |
| e2e/order-approval.spec.ts                                                                            | 1 ([SWHR2-C-0243]) | pass   |
| e2e/account.spec.ts, cart.spec.ts, catalog.spec.ts, home.spec.ts, localization.spec.ts, smoke.spec.ts | 18                 | pass   |

No test skipped; no spec file ran zero tests. Playwright's project list: `chromium` only.

Locked acceptance e2e (`bun run test:acceptance:e2e`): 51 passed, 15 failed. All 8 order-approval specs (`tests/acceptance/order-approval/e2e/tool.spec.ts`, C-0240..C-0249) passed. The 15 failures are in other capabilities (account, data-population, localization, sales-reporting, sign-on, supplier-inventory); listed as warnings in qa-test-report.md.

E2E-RESULT: chromium 19 passed, 0 failed, 0 skipped
