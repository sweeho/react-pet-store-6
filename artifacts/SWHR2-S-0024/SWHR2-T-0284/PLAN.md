# PLAN — SWHR2-T-0284 Checkout and order placement

Change: `swhr2-i-0008-checkout-and-order-placemen`. Read its `design.md` FIRST: the Target design, then **Planning — SWHR2-S-0023** (decisions P1–P9, contracts, SD1–SD7), then **Re-plan — SWHR2-S-0024** (R1, R2, SD8). Then read `specs/checkout/spec.md` and `test-cases.md`.

## Objective

Deliver the whole checkout change (tasks.md groups 1–7) on this sprint's branch. The complete implementation already exists: commit `41e1140` on `origin/vortex/sprint/swhr2-s-0023-4fc9b4f3` (SWHR2-T-0281, PR #68), merged into a sprint that was cancelled before landing. Carry it over. Do not rebuild it (design.md R1).

## Steps

1. **Carry over the code** (R1). Bring the non-artifact files of `41e1140` onto your ticket branch, exactly as listed in the ownership map below. Leave out `artifacts/SWHR2-S-0023/**`: that is T-0281's evidence, not this ticket's. At planning the commit applied to this branch head with no conflicts.
2. **Re-verify against this branch.** The locked suites `tests/acceptance/checkout/**` and the deferred cases (shopping-cart C-0089/C-0090/C-0101, sign-on C-0252/C-0254, customer-account C-0174) must pass unchanged. Never edit `tests/acceptance/**`.
3. **Fix only what is red here.** If anything fails, fix it inside the ownership map. SD8 names the e2e cases that were flaky in CI before. Every change from `41e1140` must trace to a failing case.
4. **Record evidence** for this ticket under `artifacts/SWHR2-S-0024/SWHR2-T-0284/`.

## Fixed interface contracts

Fixed by `tests/acceptance/checkout/`, and already met by `41e1140` (design.md, "Interface contracts fixed by the locked suite"):

- `services/ids.ts` `nextId(prefix)`
- `services/documents/purchase-order.ts` `toXml` / `fromXml`
- `services/orders/receive.ts` `createPurchaseOrder(dbOrTx, po)` / `getPurchaseOrder(orderId)`
- `POST /api/orders` `{ billing, shipping }` → `{ orderId }` (401 `SignOnRequired`, 422 `EmptyCartOrder`, 500 `AppFailure` with message and trace)
- `GET /api/checkout` → `{ billing, shipping }`
- tables `id_sequences`, `op_purchase_orders`, `op_po_contacts`, `op_po_cards`, `op_po_line_items`, `op_order_workflow`, `messages` (an `order.new` row stays `pending` until the worker delivers it)

## File/module ownership

`bun.lock`, `package.json`, `db/client.ts`, `db/schema.ts`, `drizzle/0005_wet_scarecrow.sql`, `drizzle/meta/0005_snapshot.json`, `drizzle/meta/_journal.json`, `e2e/checkout.spec.ts`, `e2e/global-setup.ts`, `plugins/message-worker.ts`, `routes/api/checkout/index.get.ts`(+test), `routes/api/orders/index.post.ts`(+test), `services/documents/purchase-order.ts`(+test), `services/ids.ts`(+test), `services/messaging/index.ts`, `services/orders/checkout.ts`, `services/orders/receive.ts`(+test), `services/orders/harness.test.ts`, `src/locales/{en_US,ja_JP,zh_CN}/petstore-checkout.ts`, `src/locales/en_US/account.ts`, `src/locales/registry.ts`, `src/pages/petstore/checkout.tsx`(+test), `src/pages/petstore/confirm-order.tsx`, `src/pages/petstore/order-placed.tsx`(+test), `src/pages/petstore/error/server.tsx`, `src/pages/petstore/error/empty-cart.tsx`, `src/pages/petstore/error/pages.test.tsx`, `artifacts/SWHR2-S-0024/SWHR2-T-0284/**` (evidence only).

## Design reference

Mockups in `artifacts/SWHR2-S-0024/design/` (index `MANIFEST.md`), all at viewport 1440:

- `mockup-billing-and-shipping-information.html` → `/petstore/checkout`, signed-on customer with items in the cart
- `mockup-order-placed.html` → `/petstore/order-placed`, just after placing
- `mockup-empty-cart-order-error.html` → `/petstore/error/empty-cart`, order submitted with an empty cart
- `mockup-server-error.html` → `/petstore/error/server`, with a failure message and trace

T-0281's design check (`artifacts/SWHR2-S-0023/SWHR2-T-0281/design-check.md` on the S-0023 branch) compared the same screens to the same mockups.

## Definition of Done

- AC-1 … AC-16 on the ticket, one per scenario, each covered by its linked case C-0212 … C-0227.
- The six deferred cases C-0089, C-0090, C-0101, C-0174, C-0252 and C-0254 also pass.
- Every `tasks.md` line tagged SWHR2-T-0284 is delivered. No file outside the ownership map changes.
