# TDD result — SWHR2-T-0281 Checkout and order placement

## Notes

Linked cases: SWHR2-C-0089, 0090, 0101, 0174, 0212–0227, 0252, 0254. Colocated tests cite each key in the title (`services/ids.test.ts`, `services/documents/purchase-order.test.ts`, `services/orders/receive.test.ts`, `routes/api/orders/index.post.test.ts`, `routes/api/checkout/index.get.test.ts`, `src/pages/petstore/{checkout,order-placed}.test.tsx`, `error/pages.test.tsx`). The locked `tests/acceptance/checkout/` suite also passes unmodified (`vitest.acceptance.config.ts`: 14 passed).

- Red run id: 1b1735ee-2a87-40d9-b360-28b5fef5792d. Every case failed on an assertion or the stub; C-0214 and C-0225 already passed against the throwing stubs. The run reported only `e2e/checkout.spec.ts` as missing from the report: this container has no Chromium (`/ms-playwright` absent), so Playwright cannot run here.
- Green run id: 823debb0-f1f1-4401-a57e-89e93d0e0c53 (valid, all cases pass).
- Full gate `bun run verify` (lint, typecheck, unit): exit 0, 68 files, 281 tests passed.
- `bun run test:e2e` not run: browser missing, not retried.
