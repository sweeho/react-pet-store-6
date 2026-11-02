---
artifact: integration-test-result
sprint: SWHR2-S-0033
ticket: SWHR2-T-0322
---

# Integration test result

Command: `bun install && bun run build && bun run test:e2e` (Playwright, project chromium; the only project in `playwright.config.ts`)

Summary line: `20 passed (11.8s)`

| Spec                               | Result |
| ---------------------------------- | ------ |
| e2e/account.spec.ts (3 tests)      | pass   |
| e2e/cart.spec.ts (3)               | pass   |
| e2e/catalog.spec.ts (2)            | pass   |
| e2e/home.spec.ts (2)               | pass   |
| e2e/localization.spec.ts (5)       | pass   |
| e2e/order-approval.spec.ts (1)     | pass   |
| e2e/smoke.spec.ts (3)              | pass   |
| e2e/supplier-inventory.spec.ts (1) | pass   |

No spec file was skipped. Locked acceptance Playwright (`bun run test:acceptance:e2e`: 8 failed, 58 passed) is reported as warnings in qa-test-report.md.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
