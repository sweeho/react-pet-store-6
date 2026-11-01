---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0022
capability brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0022-358d0d57
downstream: [artifacts/SWHR2-S-0022/qa-test-report.md]
---

# Integration test result — SWHR2-S-0022

## Commands run

```
bun install && bun run build            # both exit 0
bun run test:e2e -- --project=chromium  # existing suite, exit 0
bunx playwright test e2e/cart.spec.ts --project=chromium  # new cart spec written by QA, exit 0
```

`playwright test --list` shows a single project (`chromium`) covering all 5 pre-existing spec files.
The installed browser is revision 1223 but the preflight expects 1155, so QA symlinked `/ms-playwright/chromium-1155` and `chromium_headless_shell-1155` to the 1223 directories (outside the repo, nothing installed).

Existing suite summary: `15 passed (6.9s)`
Cart spec summary: `3 passed (4.6s)`

## Results

| Spec                     | Result   | Notes                                                                                                     |
| ------------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| e2e/account.spec.ts      | 3 passed |                                                                                                           |
| e2e/catalog.spec.ts      | 2 passed | includes Add to Cart then cart page (C-0206, C-0207)                                                      |
| e2e/home.spec.ts         | 2 passed |                                                                                                           |
| e2e/localization.spec.ts | 4 passed | includes zh_CN EST-1 cart line                                                                            |
| e2e/smoke.spec.ts        | 3 passed |                                                                                                           |
| e2e/cart.spec.ts (new)   | 3 passed | empty cart; add, update quantity, Check Out href, remove, back to empty; two sessions have separate carts |

No test skipped; no spec file ran zero tests.

E2E-RESULT: chromium 18 passed, 0 failed, 0 skipped
