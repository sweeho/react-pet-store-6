---
artifact: integration-test-result
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0026
capability brief: SWHR2-I-0008
branch: vortex/sprint/swhr2-s-0026-8875aed6
downstream: [artifacts/SWHR2-S-0026/qa-test-report.md]
---

# Integration test result — SWHR2-S-0026

## Commands run

`bun install`, `bun run build` (exit 0), `bunx playwright test --list` (18 tests in 6 files, all project `chromium`), then `bun run test:e2e` (exit 0). Summary line verbatim: `18 passed (11.2s)`.

## Results

| Spec                     | Result | Notes                                                              |
| ------------------------ | ------ | ------------------------------------------------------------------ |
| e2e/account.spec.ts      | pass   | Included in the 18; per-test lines not individually recorded       |
| e2e/cart.spec.ts         | pass   | add/update/check-out link/remove; two sessions have separate carts |
| e2e/catalog.spec.ts      | pass   | C-0206, C-0207                                                     |
| e2e/home.spec.ts         | pass   | 2 tests                                                            |
| e2e/localization.spec.ts | pass   | 5 tests                                                            |
| e2e/smoke.spec.ts        | pass   | 3 tests                                                            |

0 failed, 0 skipped. Checkout's own browser tests are in the locked acceptance suite (`bun run test:acceptance:e2e`): SWHR2-C-0215, C-0216 and C-0212 passed there; 25 tests of other capabilities failed and are reported as warnings in `qa-test-report.md`.

E2E-RESULT: chromium 18 passed, 0 failed, 0 skipped
