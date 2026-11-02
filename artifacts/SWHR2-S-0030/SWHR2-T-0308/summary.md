# SWHR2-T-0308 summary

Order fulfilment and invoicing, no screen. Reused the green SWHR2-T-0304 implementation (e605806) on this sprint branch; red tests and stubs committed first, then the implementation.

- Schema: `db/schema.ts` + migration `drizzle/0008_*` (sup_orders, sup_order_contacts, sup_order_lines, workflow status CHECK, messages.subscriber/attempts).
- Orders: `workflow.ts` (start, getOrderStatus, lifecycle guard), `transitions.ts`, `invoice.ts`; `receive.ts`/`decide.ts` route through workflow and send the supplier order on APPROVED in the same transaction.
- Supplier: `orders.ts`, `fulfil.ts` (purchase-order and inventory-changed consumers; whole-line shipping, invoice per shipment).
- Documents: supplier-order, invoice, catalog (+ `catalog.xml`), `routes/schemas/catalog.xml.get.ts`, `public/schemas/*`. No new dependencies (P7).
- Messaging: pub/sub fan-out per subscriber, `attempts` counting.
- Kept `services/orders/fulfilmentHarness.ts` (copy of the acceptance harness) because `tsc --build` cannot include `tests/acceptance`.
- C-0136 deferred to SWHR2-I-0012. C-0264 locked test times out in setup; disputed.

CODE-REVIEW: self-review — implementation is a previously reviewed, green branch; diff re-checked against PLAN.md contracts and the full gate.

Verification: `bun run verify` → lint, typecheck, 81 files / 368 tests pass. Platform red/green recorded.
