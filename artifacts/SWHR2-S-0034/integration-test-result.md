---
artifact: integration-test-result
sprint: SWHR2-S-0034
---

# Integration test result

Command: `bun run test:e2e` (playwright test, chromium). Summary: `1 failed, 19 passed (39.8s)`.

| Spec                                                                  | Result                                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| account, cart, catalog, home, localization, smoke, supplier-inventory | passed                                                                                            |
| order-approval.spec.ts [SWHR2-C-0243]                                 | failed in full run (row showed COMPLETED, 30s timeout); passed on rerun alone (`1 passed (6.5s)`) |

Flaky per the pass/fail disagreement; filed as SWHR2-T-0328. No spec file was wholly skipped (0 skipped).

E2E-RESULT: chromium 19 passed, 1 failed, 0 skipped
