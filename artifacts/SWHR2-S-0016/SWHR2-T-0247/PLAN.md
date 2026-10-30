# PLAN — SWHR2-T-0247 Shopping cart (FEATURE)

Change: `swhr2-i-0007-shopping-cart`. Read its `design.md` FIRST (Target design, then `## Planning` and `## Spec discrepancies`), then `specs/shopping-cart/spec.md` and `tasks.md`.

## Resumed ticket

T-0247 was planned in SWHR2-S-0016, implemented on `vortex/feat/SWHR2-T-0247-shopping-cart-8b2f9f34` (commit `648f31b`, "[tdd:green]"), and deferred without merging; the sprint branch still has the pre-sprint partial cart. It is carried into SWHR2-S-0017 and dispatched from the S-0017 sprint branch. Start from that commit: review it against this plan and the change's design.md, bring over what holds, and fix what does not. Do not bring over `src/pages/petstore/error/empty-cart.tsx`; checkout (SWHR2-I-0008) owns the error pages.

## Objective

Finish the session-only shopping cart: the model operations, the cart API, failure-kind routing, the cart screen and Add to Cart, so every linked acceptance case in `tests/acceptance/shopping-cart/` passes.

## Steps

Work the `tasks.md` groups in order; tick nothing yourself (the platform ticks on merge).

1. **Cart model** (tasks 1.1–1.4, 2.1–2.4, 2.6) — design.md Planning P1, P2, P3, P4. Extend `services/cart.ts`; add unit tests to `services/cart.test.ts` (re-add sets 1, replace quantity, remove whole line, absent remove no-op, clear, update ≤ 0 removes, total).
2. **Routes** (2.1, 2.2, 2.3, 2.5) — P4, P5. Integration tests next to the routes under `routes/api/cart/` (two sessions separate, sign-out empties, anonymous add/remove, PUT update). The session wiring for sign-out/expiry already exists in `services/session/store.ts`; test it, do not rewrite it.
3. **Failure routing** (3.1–3.3) — P7. `services/errors.ts`, `src/errors/routeFailure.ts`, with unit tests.
4. **Cart screen** (4.1–4.5) — P6, P8, mockups below. Rewrite `src/pages/petstore/cart.tsx`; update the three `petstore-cart` locale definitions; `AddToCart` navigates to the cart after a successful add. UI test `src/pages/petstore/cart.test.tsx`.
5. **Verification** (5.1–5.5) — the acceptance suite, unit/UI/integration tests above, and the existing catalog E2E (`browse.spec.ts` C-0200, `e2e/catalog.spec.ts`) still pass.

Deferred cases C-0089, C-0090, C-0101 belong to checkout (SWHR2-I-0008); do not build checkout pages or `/api/orders`.

## Design reference

- `artifacts/SWHR2-S-0017/design/default-shopping-cart.html` — SWHR2-MCK-22, route `/petstore/cart`, state: cart with lines, viewport 1440.
- `artifacts/SWHR2-S-0017/design/empty-shopping-cart-empty.html` — SWHR2-MCK-23, route `/petstore/cart`, state: empty cart, viewport 1440.

Render `/petstore/cart` in both states beside the mockup. Build from existing tokens and `src/components/ui`; no design-system change.

## File/module ownership

Create or modify only:

- `services/cart.ts`, `services/cart.test.ts`
- `services/errors.ts` (+ test)
- `routes/api/cart/index.get.ts`, `routes/api/cart/index.put.ts`, `routes/api/cart/items.post.ts`, `routes/api/cart/items/[itemId].delete.ts`, `routes/api/cart/*.test.ts`
- `src/errors/routeFailure.ts` (+ test)
- `src/pages/petstore/cart.tsx`, `src/pages/petstore/cart.test.tsx`
- `src/locales/{en_US,ja_JP,zh_CN}/petstore-cart.ts`
- `src/components/storefront/AddToCart.tsx` (+ its test)
- `e2e/cart.spec.ts` (if brought over from the earlier branch)
- Tests whose assertions the Add to Cart navigation or the re-add rule legitimately changes (`src/pages/petstore/item/[itemId].test.tsx`, `product/[productId].test.tsx`, `search.test.tsx`, `routes/api/catalog/browse-to-cart.test.ts`)

Read-only: `services/session/**`, `services/catalog/**`, `tests/acceptance/**`.

## Definition of Done

AC-1 … AC-22 on the ticket, each 1:1 with a spec scenario. AC-14 (order placed), AC-16 (empty-cart order page) and AC-22 (Check Out lands on order entry) are met here by their cart-side parts (`clearCart`, the `EmptyCartOrder` mapping, the Check Out link to `/petstore/checkout`); their end-to-end cases are owed by checkout.
