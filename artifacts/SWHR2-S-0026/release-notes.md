---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0026
capability_brief: SWHR2-I-0008
branch: vortex/sprint/swhr2-s-0026-8875aed6
upstream: [artifacts/SWHR2-S-0026/qa-test-report.md]
---

# Release notes — SWHR2-S-0026

## Added

- **Checkout.** **Check Out** on the cart opens the Billing and shipping information screen; a visitor who is not signed on is sent to sign in first. The form is pre-filled with the name, address, telephone and e-mail on the customer's account, and **Place order** submits it. Available in English, Japanese and Chinese. (SWHR2-T-0290)
- **Order ids** from the store's shared "1001" counter: 10011, 10012, 10013 and so on. No two orders share an id, and an order can be looked up by its id. (SWHR2-T-0290)
- **Order placement** stores the order with its shipping contact, payment card and lines together, or not at all. The customer's request finishes once the order is handed to order processing; the order then starts PENDING, awaiting approval. The cart is emptied. (SWHR2-T-0290)
- **Order complete screen** showing the new order id. (SWHR2-T-0290)

## Changed

- **Empty cart** on submit shows the Empty-cart order error screen and creates no order. (SWHR2-T-0290)
- **Server Error** screen now shows the error message and technical trace, and asks the customer to tell the administrator. (SWHR2-T-0290)
- **Check Out** on the cart, which led nowhere in the previous release, now reaches checkout. (SWHR2-T-0290)

## Fixed

- None.

## Upgrade notes

- Database migration `drizzle/0005_high_hemingway.sql` adds `id_sequences`, `messages` and the `op_*` order tables. Run it before starting the new build.
- The file database now runs in WAL mode with a 5 s busy timeout; `sqlite.db-wal` and `sqlite.db-shm` appear beside `sqlite.db`.
- The server starts an in-process order worker on the `order.new` channel. Keep the server at one process (`instances: 1`).
- New API: `GET /api/checkout` (pre-fill) and `POST /api/orders`. Failures use the existing `{ kind, kinds, message, trace }` reply; an empty cart is 422 `EmptyCartOrder`.
- New dependency: `fast-xml-parser`, for the `PurchaseOrder` order document.

## Not included

- Order approval, fulfilment, invoicing, customer e-mails and sales reporting. Placed orders wait as PENDING until order approval (a later capability) ships.
