# PLAN — SWHR2-T-0304 Order fulfilment and invoicing

Change: `swhr2-i-0011-order-fulfilment-and-invoic`. Read its `design.md` first: § Target design, then § Planning (SWHR2-S-0029) for findings F1–F7, spec discrepancies SD1–SD10, decisions P1–P8, risks and phases. Then read `specs/order-fulfillment/spec.md` and the locked suite `tests/acceptance/order-fulfillment/` (start with `harness.ts`), which fixes every module path and function name.

## Objective

An approved order travels to the supplier as a supplier order. The supplier ships whole lines from stock and invoices each shipment, and order processing applies each invoice until the order is COMPLETED. A restock re-fulfils waiting supplier orders. Every step is one transaction on the outbox and is retried on failure.

## Steps

1. Migration `0008`, with `messages.subscriber` and `messages.attempts`, the `op_order_workflow` status CHECK and the `sup_orders*` tables. Outbox fan-out and attempts (design.md P1, SD1). Tasks 1.1, 3.1–3.3, 5.1.
2. `services/orders/workflow.ts` (P2, SD8). Rewire `receive.ts` and `decide.ts` (P3), and add `services/orders/transitions.ts` (P4). Tasks 1.2–1.5, 2.x, 5.2–5.4.
3. Build the documents and the catalog route (P5, SD3, SD10). Tasks 4.x.
4. Build `services/supplier/orders.ts` and `services/supplier/fulfil.ts` (P6, P7, SD6, SD7), and `services/orders/invoice.ts` (P8, SD9). Register the handlers in `worker.ts`. Tasks 3.4–3.7, 6.x, 7.x.
5. Write the colocated tests and update existing ones (design.md Phases 5–6).

## File/module ownership

Create:

- `services/orders/workflow.ts`, `services/orders/transitions.ts`, `services/orders/invoice.ts`
- `services/supplier/orders.ts`, `services/supplier/fulfil.ts`
- `services/documents/supplier-order.ts`, `services/documents/invoice.ts`, `services/documents/catalog.ts`, `services/documents/catalog.xml`
- `routes/schemas/catalog.xml.get.ts`
- `public/schemas/**`
- `drizzle/0008_*.sql` and `drizzle/meta/**`
- colocated `*.test.ts` beside each of these

Modify:

- `db/schema.ts`
- `services/messaging/index.ts`, `services/messaging/worker.ts`
- `services/orders/receive.ts`, `services/orders/decide.ts`
- their existing tests (`receive.test.ts`, `decide.test.ts`, `approval.test.ts`, `services/supplier/inventory.test.ts` if affected)
- `plugins/order-worker.ts` (comment only)

Do not edit: `tests/acceptance/**`, `openspec/**`, `services/supplier/inventory.ts` (use its `reduceStock`).

## Design reference

None: the brief has no approved mockup, and fulfilment has no screen.

## Definition of Done

- AC-1 to AC-44 on the ticket, one per scenario.
- Linked cases SWHR2-C-0102 to SWHR2-C-0145, except C-0136 (deferred to SWHR2-I-0012, SD4), pass in the locked suite. AC-6 is met by the FEATURE's own fan-out test.
- The checkout, order-approval and supplier-inventory acceptance tests and `e2e/order-approval.spec.ts` keep passing.
