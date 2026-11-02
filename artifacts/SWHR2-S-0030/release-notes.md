---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0030
capability_brief: SWHR2-I-0011
branch: vortex/sprint/swhr2-s-0030-1957f09b
upstream: [artifacts/SWHR2-S-0030/qa-test-report.md]
---

# Release notes — SWHR2-S-0030

## Added

- **Orders now move forward after approval.** An approved order is sent to the supplier, shipped from stock and invoiced in the background; the customer still gets their order id straight away. (SWHR2-T-0308)
- **Shipping in parts.** A line in stock ships whole; a line out of stock waits. An order shows Part shipped after a partial shipment and Completed once every line has shipped. Each shipment is invoiced once. (SWHR2-T-0308)
- **Restock releases waiting orders.** When the supplier saves an inventory change, waiting orders are checked again; any the new stock covers ship and complete, the rest keep waiting. (SWHR2-T-0308)
- **One current status per order.** Every order has a single status record (Pending, Approved, Denied, Part shipped, Completed). Denied and Completed are final. (SWHR2-T-0308)
- **Published document formats.** The supplier order, invoice and line item formats are served under `/schemas/` and listed in `/schemas/catalog.xml`. (SWHR2-T-0308)

## Changed

- **Approving an order dispatches it.** Auto-approval and administrator approval now send the order to the supplier in the same step; if sending fails, the approval is not kept and is retried. Pending and denied orders are never sent. (SWHR2-T-0308)
- **Stock is drawn down on shipment.** Inventory quantities shown to the supplier now drop as orders ship. (SWHR2-T-0308)

## Upgrade notes

- Database migration `drizzle/0008_*` adds `sup_orders`, `sup_order_contacts`, `sup_order_lines`, a CHECK on order workflow status, and `messages.subscriber` / `messages.attempts`. Run it before starting the new build.
- `supplier.inventory-changed` messages left pending by the previous release are now consumed by re-fulfilment on first worker run.
- Optional `DOC_CATALOG_PATH` points at a deployment-supplied document catalog that takes precedence over the built-in one.
- No new dependencies.

## Not included

- Shipment and completion e-mails to customers, and the second invoice subscriber that drives them: these arrive with customer notifications (SWHR2-I-0012).
- Fulfilment has no screen, by specification.

## Verification

Verified at integration QA — see `artifacts/SWHR2-S-0030/qa-test-report.md` (Proceed; 44/44 scenarios pass).

## Compliance / Control Evidence

| Control                              | Evidence                              | Location                                   | Status    | Exception |
| ------------------------------------ | ------------------------------------- | ------------------------------------------ | --------- | --------- |
| Release contents recorded            | this file                             | `artifacts/SWHR2-S-0030/release-notes.md`  | Satisfied | —         |
| Release verified before land         | QA Proceed verdict                    | `artifacts/SWHR2-S-0030/qa-test-report.md` | Satisfied | —         |
| Schema change shipped with migration | `drizzle/0008_wide_blazing_skull.sql` | commit 257e675                             | Satisfied | —         |
