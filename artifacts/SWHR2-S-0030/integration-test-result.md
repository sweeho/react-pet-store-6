---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0030
capability brief: SWHR2-I-0011
branch: vortex/sprint/swhr2-s-0030-1957f09b
downstream: [artifacts/SWHR2-S-0030/qa-test-report.md]
---

# Integration test result — SWHR2-S-0030

## Commands run

```
$ bun install && bun run build            # exit 0
$ bunx playwright test --list             # Total: 20 tests in 8 files (single project: chromium)
$ bun run test:e2e                        # playwright test, exit 0
```

## Results

Playwright summary line: `20 passed (12.3s)`

| Spec                             | Result | Notes |
| -------------------------------- | ------ | ----- |
| `e2e/account.spec.ts`            | pass   |       |
| `e2e/cart.spec.ts`               | pass   |       |
| `e2e/catalog.spec.ts`            | pass   |       |
| `e2e/home.spec.ts`               | pass   |       |
| `e2e/localization.spec.ts`       | pass   |       |
| `e2e/order-approval.spec.ts`     | pass   |       |
| `e2e/smoke.spec.ts`              | pass   |       |
| `e2e/supplier-inventory.spec.ts` | pass   |       |

The sprint's capability (fulfilment) has no screen, so no project spec targets it directly; these specs show the storefront and admin screens it sits behind still work.

Locked acceptance browser suite (`bun run test:acceptance:e2e`): `11 failed`, `55 passed`. None of the 11 are in order-fulfillment; they are in customer-account, data-population, localization, sales-reporting and supplier-inventory acceptance specs. Acceptance is enforced only at release UAT, so these are warnings and are not counted in the marker below.

E2E-RESULT: chromium 20 passed, 0 failed, 0 skipped
