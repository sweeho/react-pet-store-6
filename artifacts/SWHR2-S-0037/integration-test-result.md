---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0037
branch: vortex/sprint/swhr2-s-0037-dbc051b2
---

# Integration test result — SWHR2-S-0037

Command: `bun run test:e2e` (Playwright, project chromium, testDir `e2e/`)

Run summary (verbatim): `24 passed (13.9s)`

| Spec                           | Result                        |
| ------------------------------ | ----------------------------- |
| e2e/account.spec.ts            | 3 passed, 0 failed, 0 skipped |
| e2e/cart.spec.ts               | 3 passed, 0 failed, 0 skipped |
| e2e/catalog.spec.ts            | 2 passed, 0 failed, 0 skipped |
| e2e/home.spec.ts               | 2 passed, 0 failed, 0 skipped |
| e2e/localization.spec.ts       | 5 passed, 0 failed, 0 skipped |
| e2e/order-approval.spec.ts     | 1 passed, 0 failed, 0 skipped |
| e2e/pet-map.spec.ts            | 4 passed, 0 failed, 0 skipped |
| e2e/smoke.spec.ts              | 3 passed, 0 failed, 0 skipped |
| e2e/supplier-inventory.spec.ts | 1 passed, 0 failed, 0 skipped |

No spec file ran zero tests; skipped count is 0.

Locked acceptance browser suite (tests/acceptance/localization/e2e/localization.spec.ts, run via a temporary config pointing testDir at it; warnings only, enforced at UAT):

- Run 1 (cold Vite start): 2 passed, 4 failed. C-0022, C-0026, C-0027 read an empty body (`Received string: ""`) at the load event, the first-load dependency-optimisation reload of a cold dev server. C-0039 failed on a strict-mode locator violation.
- Runs 2 and 3 (warm): 5 passed, 1 failed. C-0021, C-0022, C-0026, C-0027, C-0028 pass in both. C-0039 fails in all three runs: the locked test's `getByLabel(/^password:?$/i)` matches two inputs on /petstore/signin (the sign-in field and the "New customer" field). That is the locked test's selector, unrelated to this sprint's localization changes. Left for UAT triage.

E2E-RESULT: chromium 24 passed, 0 failed, 0 skipped
