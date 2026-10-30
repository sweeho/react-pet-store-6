# TDD result — SWHR2-T-0251

## Test cases

Cited by `[SWHR2-C-NNNN]` in title: C-0080/0081/0099/0100 `services/cart.test.ts`; C-0094/0098 `routes/api/cart/cart.test.ts`; C-0091/0092 `src/errors/routeFailure.test.ts`; C-0086/0087 `src/pages/petstore/cart.test.tsx`; C-0084/0085/0088/0096/0097 `e2e/cart.spec.ts` (Playwright; not runnable in this container: Chromium 1155 missing).

## Red run

Platform red run at 4b115d2: all unit/integration cases failed on the stub sentinel or an assertion (10 failed). The e2e cases were not in the vitest report, so the platform called the run invalid for them.

## Green run

`bun run test`: Test Files 58 passed (58), Tests 215 passed (215). `bun run lint`, `bun run typecheck` clean. Locked `bun run test:acceptance`: the shopping-cart suite passes except C-0090 (needs checkout, deferred to SWHR2-I-0008).

E2E (run locally with PLAYWRIGHT_BROWSERS_PATH=/tmp/pw, symlinks to the container's chromium-1223 standing in for the missing 1155): `bunx playwright test e2e/cart.spec.ts --project=chromium` → `5 passed (5.1s)` (C-0084, 0085, 0088, 0096, 0097). Locked `bun run test:acceptance:e2e`: C-0084, 0088, 0096, 0097 pass; locked C-0085 fails with `strict mode violation: getByLabel(/password/i) resolved to 3 elements` (signin page has three password inputs; SD4), disputed as a locked-test locator defect. Other failures in that run belong to other capabilities or to checkout (C-0089/0090/0101).

TDD-RESULT: 215 passed, 0 failed
