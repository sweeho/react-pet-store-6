---
artifact: tdd-test-result
spec: 1
status: complete
author_role: implementation
sprint: SWHR2-S-0016
ticket: SWHR2-T-0247
---

# TDD result — SWHR2-T-0247

## Notes

Linked cases have platform-recorded runs; the merge gate replays `[tdd:red]` and `[tdd:green]`.

- Red run id: 65cf6710-25cc-472e-b99a-e64035d693ef (commit 0db02ac). Already passing: C-0082, C-0084, C-0085 (regression guards).
- Green run: recorded after the `[tdd:green]` commit (see the ticket comment for its id).
- The locked acceptance tests are not recognised by the platform (titles lack `[KEY]`), so cases are cited by new tests in `services/cart.test.ts`, `routes/api/cart/cart.test.ts`, `src/errors/routeFailure.test.ts`, `src/pages/petstore/cart.test.tsx`, `src/components/storefront/AddToCart.test.tsx`.
- Route test helpers were inlined after red (the acceptance harness import broke `tsc --build`); assertions unchanged.
