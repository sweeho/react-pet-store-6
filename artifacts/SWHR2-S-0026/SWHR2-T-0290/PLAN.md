# SWHR2-T-0290: Checkout and order placement (PLAN)

Change: `swhr2-i-0008-checkout-and-order-placemen`. Read its `design.md` FIRST, especially "Planning (sprint SWHR2-S-0026)" (findings F1–F7, discrepancies SD1–SD7, decisions P1–P4). Then read `specs/checkout/spec.md` and `test-cases.md`.

## Objective

A signed-on customer presses Check Out, sees the billing and shipping form pre-filled from their account, and submits it. The order gets the next "1001" id. It is handed to order processing through the `order.new` outbox and stored atomically on receipt as PENDING. The cart is emptied, and the Order Placed screen shows the id. An empty cart shows the Empty-cart order error. Any unexpected failure shows the Server Error page with the message and trace.

## Steps

Work through `tasks.md` groups 1 to 7 in order. The design.md "Phases" list maps the groups to phases.

1. Data model: add tables to `db/schema.ts` (SD1) and generate one migration (tasks 1.x, plus `messages` and `op_order_workflow` per SD2).
2. `services/ids.ts` (P3) and `services/documents/purchase-order.ts` (P4) (tasks 2.x, 5.1–5.3, 6.2).
3. `services/messages/` and the Nitro plugin (P1, P2); `services/orders/receive.ts` (tasks 5.4–5.7, 6.1).
4. Routes: `GET /api/checkout`, `POST /api/orders` (tasks 4.x). Lines are numbered from 1 (SD3). The card follows SD7.
5. Screens: checkout form, Order Placed (SD6), and the Server Error rebuild (SD5), with per-locale screen text under `src/locales/` (tasks 3.x, 4.7, 4.8).
6. Seed alignment in `db/client.ts` (SD4).
7. Tests per tasks 7.x, then the locked `tests/acceptance/checkout/` suite.

## Fixed interface contracts (locked by the acceptance suite; do not change)

- `services/ids.ts`: `nextId(prefix: string, tx?): string`. It throws on a missing or empty prefix, or when the sequence cannot be created or the store is unreachable, and issues nothing in those cases.
- `services/documents/purchase-order.ts`: `toXml(po): string` and `fromXml(xml): PurchaseOrder`. The PurchaseOrder shape is exactly `tests/acceptance/checkout/harness.ts#purchaseOrder`. The errors are "PurchaseOrder element expected." and "CreditCard element expected.".
- `services/orders/receive.ts`: `createPurchaseOrder(db | tx, po)` is atomic and refuses a duplicate id. Also exports `getPurchaseOrder(orderId)`.
- `POST /api/orders` takes `{ billing, shipping }` and returns 200 `{ orderId }`. Failures are 401 `SignOnRequired`, 422 `EmptyCartOrder`, or 500 `AppFailure` with `{ message, trace }`. `GET /api/checkout` returns `{ billing, shipping }`.
- Tables: `id_sequences(prefix, next_value)`; `op_purchase_orders` (billing columns named given_name/family_name/street/city/state/zip/country/phone/email); `op_po_contacts` (the same shipping columns); `op_po_cards(card_number NOT NULL, …)`; `op_po_line_items(order_id, line_number, item_id, quantity, unit_price, quantity_shipped)`; `messages(channel, payload, status 'pending'…)`; `op_order_workflow(order_id, status)`.

## File / module ownership

New: `services/ids.ts`, `services/documents/purchase-order.ts`, `services/orders/receive.ts`, `services/messages/*`, `plugins/order-worker.ts`, `routes/api/checkout/index.get.ts`, `routes/api/orders/index.post.ts`, `src/pages/petstore/checkout.tsx`, `src/pages/petstore/order-placed.tsx`, new `drizzle/0005_*.sql` and its meta, `src/locales/{en_US,ja_JP,zh_CN}/` checkout screen entries, and colocated `*.test.ts(x)`.
Modified: `db/schema.ts`, `db/client.ts` (seed only, SD4), `src/pages/petstore/error/server.tsx`, `src/pages/petstore/error/empty-cart.tsx` (to match the mockup if it differs), `src/locales/registry.ts`, `package.json` and `bun.lock` (fast-xml-parser).
Never touched: `tests/acceptance/**` (locked), `openspec/**`.

## Design reference

Approved mockups in `artifacts/SWHR2-S-0026/design/` (index `MANIFEST.md`), all at viewport 1440:

- `mockup-billing-and-shipping-information.html`: `/petstore/checkout`, pre-filled default state.
- `mockup-order-placed.html`: `/petstore/order-placed`, after a successful submit.
- `mockup-empty-cart-order-error.html`: `/petstore/error/empty-cart`, after submitting an empty cart.
- `mockup-server-error.html`: `/petstore/error/server`, after an unexpected placement failure.

## Definition of Done

AC-1 to AC-16 on the ticket. Each is 1:1 with a scenario, and each is proven by locked cases SWHR2-C-0212 to SWHR2-C-0227. The existing locked shopping-cart, sign-on and customer-account suites stay green.
