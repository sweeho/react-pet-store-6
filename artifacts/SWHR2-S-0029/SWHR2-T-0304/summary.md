# SWHR2-T-0304 Order fulfilment and invoicing

CODE-REVIEW: self-review — no sub-agent run; checked the diff against the spec for transaction scope, lifecycle guard and cycle risk; fixed the order-completion condition in `fulfilOrder` and made the user-id check null-only so approval does not fail for orders stored with an empty user id.

## What changed

- Migration `0008`: `messages.subscriber`/`attempts`, status CHECK on `op_order_workflow`, `sup_orders`, `sup_order_contacts`, `sup_order_lines` (cascade).
- Outbox: `SUBSCRIBERS` fan-out (one row per subscriber), worker handlers for `supplier.purchase-order`, `supplier.inventory-changed`, `supplier.invoice/order-processing.invoice`, `attempts` on failure.
- `services/orders`: `workflow.ts` (start, read, guarded `setStatus`), `transitions.ts` (`handOff`, `TransitionError`), `invoice.ts` (`readInvoice`, `handleInvoice`); `receive.ts`/`decide.ts` rewired so approval enqueues the supplier order in the same transaction.
- `services/supplier`: `orders.ts`, `fulfil.ts` (whole-line shipment, one invoice per shipment, re-fulfilment on restock).
- `services/documents`: supplier order and invoice builders/readers, structural validator, catalog resolution; `routes/schemas/catalog.xml.get.ts`; DTD/XSD files in `public/schemas/`.

## Deviations from PLAN

- No new XML dependency (SD3). `userId` is a root attribute of the supplier order; only a null user id is refused, an empty one is accepted so orders stored without a user id still approve.
- `readPurchaseOrder` added to `receive.ts` (sync read inside a transaction); `receive.ts` and `decide.ts` import each other, used only at call time.
- Test harness copied to `services/orders/fulfilmentHarness.ts` because `tsc` does not include `tests/acceptance`.

## Verification

- `bun run verify:full`: pass (lint, typecheck, 368 unit tests, 20 e2e).
- Acceptance suites for order-fulfillment, sign-on, checkout, order-approval, supplier-inventory: pass except C-0136 (deferred) and C-0264 (disputed).
