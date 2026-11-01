---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0023
ticket: SWHR2-T-0281
capability_brief: SWHR2-I-0008
change: swhr2-i-0008-checkout-and-order-placemen
branch: vortex/sprint/swhr2-s-0023-4fc9b4f3
---

# PLAN — SWHR2-T-0281 Checkout and order placement

## Objective

Deliver the whole change `swhr2-i-0008-checkout-and-order-placemen`, working through every `tasks.md` group in order (1 to 7). A signed-on customer opens the pre-filled checkout form from the cart and submits it. The order gets the next id from the "1001" sequence and is queued on `order.new` in the same transaction, and the cart is cleared. The customer then sees Order Placed. The in-process worker later receives the order, stores it atomically, and starts its workflow in PENDING.

Read `design.md` first: **Target design**, then **Planning — SWHR2-S-0023**, which holds the measured code state, the interface contracts fixed by the locked suite, decisions P1–P9 and discrepancies SD1–SD6. Then read `specs/checkout/spec.md` and `test-cases.md`.

## Steps

1. **Data model** (1.1–1.6; P1, P2, P3). Add `id_sequences`, `op_purchase_orders`, `op_po_contacts`, `op_po_cards`, `op_po_line_items`, `messages` and `op_order_workflow` to `db/schema.ts`, with no foreign key into storefront tables. Generate one migration into `drizzle/`.
2. **Id issue** (2.1–2.5). `services/ids.ts#nextId(prefix, tx?)`: create on first use, increment, return `prefix + value`; throw on a null or empty prefix or any store error.
3. **Document codec** (5.1–5.3, 6.1–6.2; P4, P5, P9). `services/documents/purchase-order.ts#toXml/fromXml` with the element order and rejection messages of SWHR2-R-0050.
4. **Outbox, worker and receipt** (5.4–5.7; P2, P3). `services/messaging/` (`enqueue`, poll/deliver), `plugins/message-worker.ts` (Nitro plugin, `order.new` → receipt), and `services/orders/receive.ts#createPurchaseOrder/getPurchaseOrder`.
5. **Placement** (4.1–4.6, 4.8, 5.5; P6). `GET /api/checkout` returns the pre-fill mapped from `services/customers` (SD5). `POST /api/orders`: guard, trim and require fields, refuse an empty cart with `EmptyCartOrder`, number lines from 0, total in hundredths, `nextId("1001")` and `enqueue` in one transaction, then `clearCart`. Wrap the handler in `guardRoute`.
6. **Screens** (3.1–3.5, 4.7, 4.8; P7, P8, SD6). Build `src/pages/petstore/checkout.tsx` and `order-placed.tsx`, and rebuild `error/empty-cart.tsx` and `error/server.tsx` to the mockups. Server Error must show the reply's message and trace and ask the shopper to notify the administrator. Screen text goes through per-locale definitions under `src/locales/` (en_US, ja_JP, zh_CN). The checkout form uses labelled inputs, so the suite's label queries resolve.
7. **Tests** (7.1–7.4). Add colocated tests mirroring the nearest file: `services/ids.test.ts`, `services/documents/purchase-order.test.ts`, `services/orders/receive.test.ts`, `routes/api/orders/index.post.test.ts`, `routes/api/checkout/index.get.test.ts`, page tests, and `e2e/checkout.spec.ts`. CI needs no change (design.md Phases 8).

## File/module ownership

| Path                                                                                                      | Change                              |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `db/schema.ts`, `drizzle/0005_*.sql`, `drizzle/meta/*`                                                    | new tables + migration              |
| `services/ids.ts` (+ test)                                                                                | new                                 |
| `services/documents/purchase-order.ts` (+ test)                                                           | new                                 |
| `services/orders/receive.ts` (+ test)                                                                     | new                                 |
| `services/messaging/*` (+ tests), `plugins/message-worker.ts`                                             | new (P2)                            |
| `services/errors.ts`                                                                                      | extend only if a new kind is needed |
| `routes/api/orders/index.post.ts`, `routes/api/checkout/index.get.ts` (+ `*.test.ts`)                     | new                                 |
| `src/pages/petstore/checkout.tsx`, `order-placed.tsx` (+ tests)                                           | new                                 |
| `src/pages/petstore/error/server.tsx`, `empty-cart.tsx`, `pages.test.tsx`                                 | rebuild to mockups                  |
| `src/errors/routeFailure.ts`                                                                              | touch only if page routing changes  |
| `src/locales/{en_US,ja_JP,zh_CN}/petstore-checkout.ts`, `src/locales/registry.ts`, `src/locales/types.ts` | screen text                         |
| `shared/` (state and country lists, if both sides need them)                                              | new file only                       |
| `e2e/checkout.spec.ts`                                                                                    | new                                 |
| `package.json`, `bun.lock`                                                                                | `fast-xml-parser` (P9)              |

`tests/acceptance/**` is locked: read it, never edit it. Nothing under `openspec/` is yours beyond the platform's ticking.

## Design reference

The approved mockups are committed in `artifacts/SWHR2-S-0023/design/` (index: `MANIFEST.md`), all at viewport 1440:

- `mockup-billing-and-shipping-information.html` (SWHR2-MCK-24): `/petstore/checkout`, signed-on customer with a non-empty cart.
- `mockup-order-placed.html` (SWHR2-MCK-25): `/petstore/order-placed`, right after a successful placement.
- `mockup-empty-cart-order-error.html` (SWHR2-MCK-26): `/petstore/error/empty-cart`, after submitting with an empty cart.
- `mockup-server-error.html` (SWHR2-MCK-27): `/petstore/error/server`, after an unexpected placement failure.

Render each route beside its mockup to check the build.

## Definition of Done

- AC-1 to AC-16 are met, each covered by its linked case (C-0212 to C-0227).
- The shopping-cart cases deferred to checkout (C-0089, C-0090 and C-0101) also pass.
- The locked suite `tests/acceptance/checkout/` passes unmodified, and the existing catalog, localization, sign-on, customer-account and shopping-cart suites still pass.
- Every `tasks.md` line tagged SWHR2-T-0281 is implemented.
