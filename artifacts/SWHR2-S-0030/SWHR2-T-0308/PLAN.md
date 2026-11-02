# PLAN — SWHR2-T-0308 Order fulfilment and invoicing

Change: `swhr2-i-0011-order-fulfilment-and-invoic` (capability brief SWHR2-I-0011). Read the change's `design.md` FIRST, especially its "Sprint planning (SWHR2-S-0030)" section: decisions P1–P8 and the "Spec discrepancies" list override "Target design" where they differ. Then the delta spec `specs/order-fulfillment/spec.md` and `test-cases.md`.

## Objective

Take an approved order from hand-off to COMPLETED: order workflow status store and lifecycle, supplier orders, supplier order and invoice documents, the published format catalog, publish/subscribe on the outbox, the approval → supplier hand-off, whole-line fulfilment with an invoice per shipment, re-fulfilment on restock, and invoice application. No screen.

## Design reference

The brief has no approved mockup; this capability has no user interface. Nothing to render.

## Prior work — start here

Sprint SWHR2-S-0029 built this change on ticket SWHR2-T-0304, branch `vortex/feat/SWHR2-T-0304-order-fulfilment-and-invoicing-796e1cc4` (commits `654bdbb`, `bf1ec76` = tests `[tdd:red]`, `e605806` = implementation `[tdd:green]`). It was never merged; its follow-up SWHR2-T-0305 was cancelled. Its own summary reports the full gate green and every order-fulfillment case passing except C-0136, and its design matches P1–P8. Fetch that branch and reuse it — bring the test commits over first for your red run, then the implementation for green — rather than rebuilding from nothing. Re-check it against this sprint branch (it forked from `6236386`, the same base) and against the locked suite; do not take its `artifacts/SWHR2-S-0029/**` or `openspec/**` files. Its `services/orders/fulfilmentHarness.ts` (a copy of the acceptance harness) and the `receive.ts` ↔ `decide.ts` import cycle are its own choices; keep or remove them on their merits.

## Steps

Work the `tasks.md` groups in order; tick nothing yourself (the platform ticks on merge).

1. **Migration + workflow** (§1; design.md P1, P4). Extend `db/schema.ts`, generate ONE migration in `drizzle/`. Add `services/orders/workflow.ts`; switch `receive.ts` to `startWorkflow`; route decision and invoice status moves through the lifecycle guard.
2. **Order lines** (§2). Already stored by checkout (`op_po_line_items`, cascade delete). Confirm SWHR2-C-0106/0107 pass; change nothing that already does.
3. **Supplier orders** (§3; P1, P6). `services/supplier/orders.ts`: `createSupplierOrder(exec, input)` in one transaction, `listSupplierOrders(status)`.
4. **Documents** (§4; P7, P8). `services/documents/supplier-order.ts` (`buildSupplierOrder`, `validateSupplierOrder`, a reader back to the input shape), `services/documents/invoice.ts` (`buildInvoice`, reader), `services/documents/catalog.ts` (`resolveFormat`) with built-in `services/documents/catalog.xml`; DTD/XSD files under `public/schemas/`; `routes/schemas/catalog.xml.get.ts`.
5. **Messaging + hand-off** (§5; P2, P3). Channel/subscriber registry and fan-out in `services/messaging/index.ts`; `(channel, subscriber)` dispatch and `attempts` in `worker.ts`; `services/orders/transitions.ts`; `applyDecision` sends the supplier order on APPROVED in the same transaction.
6. **Supplier fulfilment** (§6; P6). `services/supplier/fulfil.ts`: purchase-order consumer (one unit with invoice publication) and `supplier.inventory-changed` consumer; stock only through `inventory.reduceStock`.
7. **Invoice receipt** (§7; P5). `services/orders/invoice.ts`: `readInvoice`, `handleInvoice`, registered as subscriber `order-processing.invoice`.
8. **Test harness.** Unit tests beside each new module (copy the shape of `services/orders/decide.test.ts`; route test like `routes/api/hello.test.ts`). Do not edit `tests/acceptance/**`.
9. **CI.** No workflow change; the existing job must be green on this branch.

## Fixed interface contracts

Fixed by the locked suite `tests/acceptance/order-fulfillment/harness.ts` — do not rename:

- `services/messaging`: `enqueue(tx, channel, payload)`; `services/messaging/worker`: `processDue(): Promise<number>`.
- `services/orders/workflow`: `startWorkflow(exec, orderId, status)`, `getOrderStatus(orderId)` (unknown → error whose name/message says not found, status 404).
- `services/orders/invoice`: `readInvoice(xml)` → `{ orderId, lines: { itemId, quantityShipped }[] }` (shape may carry more), `handleInvoice(xml, exec?)`.
- `services/orders/transitions`: `ORDER_TRANSITIONS` (mutable step → name map), `registerTransition(name, { single?, batch? })`, `handOff(step, messages)` (synchronous), `TransitionError` (`name === "TransitionError"`, `cause` set).
- `services/supplier/orders`: `createSupplierOrder(exec, input)`, `listSupplierOrders(status)` → rows with `orderId`.
- `services/documents/supplier-order`: `buildSupplierOrder(input): string`, `validateSupplierOrder(xml)`; input `{ orderId, userId, orderDate, shipping: { firstName, lastName, street, city, state, country, zip, email, phone }, lines: { lineNumber, categoryId, productId, itemId, quantity, unitPrice /* hundredths */ }[] }`.
- `services/documents/invoice`: `buildInvoice({ orderId, userId, shippingDate, lines: { lineNumber, itemId, quantity }[] })`.
- `services/documents/catalog`: `resolveFormat(id)`; env `DOC_CATALOG_PATH`, `DOC_FORMAT_MODE`.
- `routes/schemas/catalog.xml.get.ts` default export handler.
- Tables/columns: `op_order_workflow`, `sup_orders (order_id, status, order_date, user_id)`, `sup_order_contacts`, `sup_order_lines (order_id, line_number, item_id, quantity, quantity_shipped, …)`, `messages.subscriber`, `messages.attempts`. Channel names: `order.new`, `order.approval`, `supplier.purchase-order`, `supplier.invoice`, `supplier.inventory-changed`; subscriber `order-processing.invoice`.

## File/module ownership

Create: `services/orders/workflow.ts`, `services/orders/invoice.ts`, `services/orders/transitions.ts`, `services/supplier/orders.ts`, `services/supplier/fulfil.ts`, `services/documents/supplier-order.ts`, `services/documents/invoice.ts`, `services/documents/catalog.ts`, `services/documents/catalog.xml`, `routes/schemas/catalog.xml.get.ts`, `public/schemas/*` (supplier order, invoice, line item DTD/XSD), one `drizzle/0008_*.sql` + `drizzle/meta/*`, and a `*.test.ts` beside each new module.
Modify: `db/schema.ts`, `services/messaging/index.ts`, `services/messaging/worker.ts`, `plugins/order-worker.ts` (comment only, if needed), `services/orders/receive.ts`, `services/orders/decide.ts`, `services/errors.ts` (a not-found kind, if needed), `package.json`/`bun.lock` only if P7's exception applies.

## Deferred sign-on cases (linked here)

SWHR2-C-0263, SWHR2-C-0264 and SWHR2-C-0268 (`tests/acceptance/sign-on/internal.test.ts`) were deferred to this brief by SWHR2-S-0029 because they load this change's `fulfilment()` harness:

- C-0263: `messaging.enqueue` takes a message from a caller with no session or role, and must not throw.
- C-0264: no route under `routes/api/` may get the outbox to store a message of the caller's making. The only new route here is `routes/schemas/catalog.xml.get.ts`, which is outside `routes/api/` and never enqueues. Do not add an `/api` route that enqueues.
- C-0268: `handleInvoice` updates `op_po_line_items.quantity_shipped` with no session.

Known conflict on C-0264. Its locked test also asserts that every message the probe produces is `order.new`. Two approved routes already enqueue other channels from caller input: `POST /api/admin/orders/decisions` enqueues `order.approval` (order-approval), and `POST /api/supplier/inventory` enqueues `supplier.inventory-changed` (supplier-inventory). SWHR2-T-0304 recorded C-0264 as disputed for this reason. If it fails on that assertion alone, do not change those routes. File `a2a_dispute_test_case(target="test", path="tests/acceptance/sign-on/internal.test.ts", case_keys=["SWHR2-C-0264"], ...)` with the run as evidence; a test dispute does not block hand-off.

## Out of scope

Any screen; `notify.shipment` subscriber, `notify.completed` and every e-mail (SWHR2-I-0012); checkout capture, approval rules and the inventory page (earlier capabilities); order lists and sales charts. Test case SWHR2-C-0136 is deferred to SWHR2-I-0012: build the fan-out (design.md P2) but do not build `services/notifications/*`.

## Definition of Done

- AC-1 … AC-44 of the ticket hold; each is checked by the locked case citing its scenario in `tests/acceptance/order-fulfillment/` (AC-6's case SWHR2-C-0136 is owed by SWHR2-I-0012).
- The checkout, order-approval and supplier-inventory acceptance suites stay green after the migration.
- Unit tests for every new module are committed and green.
