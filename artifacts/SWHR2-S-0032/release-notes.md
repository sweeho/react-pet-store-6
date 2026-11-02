---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0032
capability_brief: SWHR2-I-0013
branch: vortex/sprint/swhr2-s-0032-f7be8d82
upstream: [artifacts/SWHR2-S-0032/qa-test-report.md]
---

# Release notes — SWHR2-S-0032

## Added

- **Orders and sales page.** Administrators open **Orders and sales** from the Administration navigation. It has an Orders view, with Pending and Non-pending tabs, and a Sales view, with Pie chart (revenue per category) and Bar chart (order count per category) tabs. It opens on Orders. (SWHR2-T-0317)
- **Non-pending orders.** Every approved, denied and completed order is listed once; pending orders never appear there. When a status has no orders, the list says so. (SWHR2-T-0317)
- **Sortable order lists.** Click any column heading (ID, User ID, Date, Amount, Status) to sort by it, and click it again to reverse the order. (SWHR2-T-0317)
- **Per-item sales figures.** The revenue and order-count reports can break a single category down by item when the request names the category. The screen has no control for this. (SWHR2-T-0317)

## Changed

- **Dates and ids in order lists.** Dates show as `3/5/2002`. An order id that is not a number shows as `-1`. (SWHR2-T-0317)
- **Order lookup by status is exact.** A status with no matching orders, including the wrong letter case such as `approved`, returns an empty list instead of an error. (SWHR2-T-0317)
- **Navigation.** The "Sales reporting" entry is now "Orders and sales" and opens the administration tool directly. (SWHR2-T-0317)

## Upgrade notes

- **API change for integrators.**
  - `GET /api/admin/orders` now returns a plain JSON array, not `{ items, orders }`, with dates as `M/D/YYYY`.
  - `GET /api/admin/sales/order-count` is renamed `GET /api/admin/sales/order-counts`.
  - Both sales routes accept an optional `category`.
- No database migration and no new dependency.
