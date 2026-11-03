---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0035
capability_brief: Not Provided
branch: vortex/test/SWHR2-T-0331-integration-qa-report-swhr2-s-0035-80a834bf
upstream: [artifacts/SWHR2-S-0035/SWHR2-T-0328/PLAN.md]
---

# Integration test result

Command: `bun run test:e2e` (runs `playwright test`; projects selected: chromium, 20 tests in 8 files per `bunx playwright test --list`), on the merged sprint branch after `bun install` and `bun run build` (both exit 0).

Run summary (verbatim): `20 passed (13.4s)`. Repeated twice more: `20 passed (12.1s)`, `20 passed (12.1s)`. Three consecutive full runs, no failure, no skip, no flake.

| Spec                                           | Result             |
| ---------------------------------------------- | ------------------ |
| e2e/account.spec.ts (3)                        | pass               |
| e2e/cart.spec.ts (3)                           | pass               |
| e2e/catalog.spec.ts (2)                        | pass               |
| e2e/home.spec.ts (2)                           | pass               |
| e2e/localization.spec.ts (5)                   | pass               |
| e2e/order-approval.spec.ts (1, [SWHR2-C-0243]) | pass in all 3 runs |
| e2e/smoke.spec.ts (3)                          | pass               |
| e2e/supplier-inventory.spec.ts (1)             | pass               |

Locked acceptance suite (`bun run test:acceptance:e2e`): 58 passed, 8 failed. Warnings only (acceptance enforced at release UAT); listed in qa-test-report.md.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
