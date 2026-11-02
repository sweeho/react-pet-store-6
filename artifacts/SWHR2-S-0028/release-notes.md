---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0028
capability_brief: SWHR2-I-0010
branch: vortex/sprint/swhr2-s-0028-1d7ea54c
upstream: [artifacts/SWHR2-S-0028/qa-test-report.md]
---

# Release notes — SWHR2-S-0028

## Added

- **Supplier inventory.** A signed-in supplier chooses **Display Inventory** on the supplier home, or Supplier inventory in the navigation, and sees one row per item. Each row shows the item, its quantity on hand, an empty **New quantity** box and an unticked **Update** box. (SWHR2-T-0299)
- **Batch stock update.** The supplier types new counts, ticks the rows to change and presses **Submit** once. All ticked rows are saved together; a number typed on an unticked row is ignored. A confirmation shows the updated list. (SWHR2-T-0299)
- **One whole-number count per item.** A second stock record for an item, or one without a quantity, is refused. A negative, fractional or non-numeric quantity on a ticked row is rejected with a message, and nothing from that submission is saved. (SWHR2-T-0299)

## Changed

- **Supplier home** now offers Display Inventory and Logout in place of the "will appear here once it ships" placeholder. (SWHR2-T-0299)

## Fixed

- None.

## Upgrade notes

- Database migration `drizzle/0007_*` adds `sup_inventory`. Run it before starting the new build.
- A fresh development or e2e database is seeded with stock of 10000 for each demo catalog item.
- New API, supplier only: `GET /api/supplier/inventory` and `POST /api/supplier/inventory` (`{ rows: [{ itemId, quantity, marked }] }`); invalid quantities answer 400 `InvalidQuantity`.
- Every stock update enqueues a `supplier.inventory-changed` message. No consumer exists yet, so these messages stay pending until order fulfilment ships.

## Not included

- Releasing waiting orders after a restock, stock draw-down on shipment, and invoices: these arrive with order fulfilment.
- Seeding the full sample inventory (EST-1 to EST-29): this arrives with sample data population.
