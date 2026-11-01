# SWHR2-T-0288 — Checkout and order placement

Change: `swhr2-i-0008-checkout-and-order-placemen` (proposal, design, `specs/checkout/spec.md`, `test-cases.md`, `tasks.md`). Read `design.md` FIRST, including its _Planning findings_, _Spec discrepancies_ (SD1–SD8), _Planning decisions_ (PD1–PD6) and _Phases_ sections.

## Objective

A signed-on customer presses Check Out, sees the billing and shipping form pre-filled from their account, submits it, and gets an order id from the "1001" sequence; the order document is queued on `order.new` in the same transaction, the cart is emptied, and the Order Placed screen shows the id. Order processing can decode that document and store the order atomically and look it up by id. Implements all 11 requirements of the delta spec (SWHR2-R-0003 … SWHR2-R-0052) and every line of `tasks.md`, in group order.

## Steps

1. **Data model** (tasks 1.1–1.6; design _Data_, SD1, SD2, SD8). Add to `db/schema.ts`: `id_sequences`, `op_purchase_orders` (billing fields on the header in columns named for the field, e.g. `bill_given_name`, `bill_street1`, `bill_phone`), `op_po_contacts` (shipping), `op_po_cards`, `op_po_line_items`, plus `messages` and `op_order_workflow` exactly as change `swhr2-i-0011-order-fulfilment-and-invoic` describes them. Generate one migration into `drizzle/` and commit it.
2. **Order ids** (tasks 2.1–2.5; design _Id sequences_). `services/ids.ts` `nextId(prefix, tx?)`.
3. **Document codec** (tasks 5.1–5.3, 6.2; design _Order document codec_, PD2, PD3, SD4). `services/documents/purchase-order.ts` with `fast-xml-parser`.
4. **Hand-off** (tasks 5.4–5.5; PD4, SD1). `services/messaging/enqueue.ts` `enqueue(tx, channel, payload)` inserting a `pending` row. No worker plugin.
5. **Placement routes** (tasks 4.1–4.6; design _Order placement_, PD1, PD4). `routes/api/checkout/index.get.ts` (pre-fill from `customerView`) and `routes/api/orders/index.post.ts` wrapped in `guardRoute`; reuse `requireCustomer`, `cartFor`/`lines`/`clearCart` and `EmptyCartOrder`.
6. **Receipt** (tasks 5.6–5.7, 6.1; design _Order receipt_, PD6). `services/orders/receive.ts` `createPurchaseOrder(db, po)` in one transaction, `getPurchaseOrder(orderId)`, and `receiveOrderDocument(xml)` = `fromXml` then create.
7. **Screens** (tasks 3.1–3.5, 4.7–4.8; PD5, SD3, SD5). `src/pages/petstore/checkout.tsx`, `src/pages/petstore/order-placed.tsx`, update `src/pages/petstore/error/server.tsx`; pass the `FailureReply` to the error page through router navigation state from `routeFailure`'s caller. Strings in the three locales.
8. **Tests** (tasks 7.1–7.4; design _Phases_ 7). Unit, route integration, UI, and an e2e journey spec. Run the locked suite in `tests/acceptance/checkout/` unchanged.

## Fixed interface contracts

Pinned by the locked acceptance suite; do not change.

- `services/ids.ts`: `nextId(prefix: string): string | Promise<string>` — throws for `undefined`/`""`; creates the row at 0 on first use; returns `prefix + n`; an insert failure or a closed database throws an `Error` and leaves `id_sequences` unchanged. Table `id_sequences(prefix text pk, next_value integer not null)`.
- `services/documents/purchase-order.ts`: `toXml(po: PurchaseOrder): string`, `fromXml(xml: string): PurchaseOrder`; `fromXml(toXml(po))` deep-equals `po`; errors `"PurchaseOrder element expected."` and `"CreditCard element expected."`.
- `PurchaseOrder` = `{ orderId, userId, email, locale, orderDate: number (epoch ms), total: number (hundredths), billing: Contact, shipping: Contact, card: { cardNumber, cardType, expiryDate }, lines: { lineNumber, categoryId, productId, itemId, quantity, unitPrice }[] }`; `Contact` = `{ givenName, familyName, street, city, state, country, zip, email, phone }`.
- `services/orders/receive.ts`: `createPurchaseOrder(db, po)` (throws on duplicate id or any failed insert, keeping nothing), `getPurchaseOrder(orderId)`.
- Tables `op_purchase_orders`, `op_po_contacts`, `op_po_cards` (`card_number` not null), `op_po_line_items` (`item_id`, `quantity`, `quantity_shipped` default 0), all keyed by `order_id`; `messages(channel, payload, status, …)`; `op_order_workflow(order_id, status)`.
- `GET /api/checkout` → `{ billing: Contact, shipping: Contact }`. `POST /api/orders` body `{ billing, shipping }` → 200 `{ orderId }`; 401 `SignOnRequired`; 422 `EmptyCartOrder`; 500 `{ kind: "AppFailure", kinds, message, trace }`.
- Routes: `/petstore/checkout`, `/petstore/order-placed`, `/petstore/error/empty-cart`, `/petstore/error/server`. Form fields are labelled so each of first name, last name, street, city, state, zip, country, phone, e-mail appears once in billing and once in shipping.

## File/module ownership

Create: `services/ids.ts`, `services/documents/purchase-order.ts`, `services/messaging/enqueue.ts`, `services/orders/receive.ts`, `routes/api/checkout/index.get.ts`, `routes/api/orders/index.post.ts`, `src/pages/petstore/checkout.tsx`, `src/pages/petstore/order-placed.tsx`, `src/locales/{en_US,ja_JP,zh_CN}/petstore-checkout.ts`, one new `drizzle/0005_*.sql` with its `drizzle/meta/` updates, `e2e/checkout.spec.ts`, and tests beside each new file.
Modify: `db/schema.ts`, `services/errors.ts` (only if a new failure kind is needed), `src/errors/routeFailure.ts` and its callers (to pass the reply), `src/pages/petstore/error/server.tsx`, `src/pages/petstore/error/empty-cart.tsx` (mockup alignment), `src/pages/petstore/error/pages.test.tsx`, locale index files that register screens, `package.json` / `bun.lock` (`fast-xml-parser`).
Never: `tests/acceptance/**`, `openspec/**`.

## Design reference

Approved mockups in `artifacts/SWHR2-S-0025/design/` (see `MANIFEST.md`), all at 1440 px:

- `mockup-billing-and-shipping-information.html` — `/petstore/checkout`, signed on, cart has items, pre-filled.
- `mockup-order-placed.html` — `/petstore/order-placed`, after a successful placement.
- `mockup-empty-cart-order-error.html` — `/petstore/error/empty-cart`, empty-cart refusal.
- `mockup-server-error.html` — `/petstore/error/server`, unexpected failure with message and trace.

## Definition of Done

AC-1 … AC-16 on the ticket, each met by its cited case (SWHR2-C-0212 … SWHR2-C-0227) in the locked suite. In addition: the existing suites stay green, including SWHR2-C-0086 (cart Check Out link) and SWHR2-C-0092 (server page says server error); the new migration applies to a fresh database; every `tasks.md` box is done.
