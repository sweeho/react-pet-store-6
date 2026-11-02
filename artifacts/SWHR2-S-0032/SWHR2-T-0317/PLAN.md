# PLAN — SWHR2-T-0317 Admin order and sales reporting

Change: `swhr2-i-0013-admin-order-and-sales-repor` (capability brief SWHR2-I-0013). Read the change's `design.md` FIRST, especially "Sprint planning (SWHR2-S-0032)". Decisions P1–P5 and spec discrepancies X1–X7 override "Target design" and `tasks.md` where they differ. Then read the delta spec `specs/sales-reporting/spec.md` and the locked suites `tests/acceptance/sales-reporting/` (`reports.test.ts`, `order-table.test.tsx`, `e2e/tool.spec.ts`). The already-green `tests/acceptance/order-approval/` (especially `e2e/tool.spec.ts` C-0240–C-0244) must stay green.

## Objective

Turn `/admin/tool` into the "Orders and sales" page:

- an Orders view (Pending and Non-pending tabs) and a Sales view (Pie chart and Bar chart tabs), opening on Orders
- both order lists sortable on every column, showing -1 for a non-numeric id, with an empty state
- the orders API filtering by exact status and returning `M/D/YYYY` dates
- the revenue and order-count APIs broken down per item when a category is named

## Design reference

Exported mockups are in `artifacts/SWHR2-S-0032/design/` (see `MANIFEST.md`). All are on route `/admin/tool` at 1440 px, signed in as administrator:

- `mockup-orders-and-sales-orders-view-non-pending.html`: Orders view, Non-pending tab, with orders of each decided status.
- `mockup-orders-and-sales-non-pending-tab-no-orde.html`: Non-pending tab with no orders (empty state).
- `mockup-orders-and-sales-sales-view-pie-chart-ta.html`: Sales view, Pie chart tab.
- `mockup-orders-and-sales-sales-view-bar-chart-ta.html`: Sales view, Bar chart tab.

Known, deliberate divergence: the Orders view keeps the compact chart pair below the tabs (design.md P2, X2).

## Steps

Work the `tasks.md` groups in order. Tick nothing yourself; the platform ticks the boxes on merge.

1. **Order queries** (§1; P3). `routes/api/admin/orders/index.get.ts`: exact-match any status (missing → 400), return the bare row array with `date` in UTC `M/D/YYYY`.
2. **Sales chart data** (§2; P4). `services/orders/sales.ts`: add an optional `category` and group by item within it. Pass `category` from `revenue.get.ts`. Move `order-count.get.ts` to `order-counts.get.ts`.
3. **Load and refresh** (§3; P1, P2). `src/pages/admin/tool.tsx`:
   - heading "Orders and sales"
   - top-level Orders/Sales tabs, opening on Orders
   - in the Orders view, Pending first, then Non-pending, and the compact charts kept
   - in the Sales view, Pie chart and Bar chart tabs, each a `ChartPanel` with labelled Start/End and Submit
   - one shared date range
   - the reader accepts an array or `{ orders | items }`, and chart requests go to `order-counts`

   Repoint the nav entry in `src/components/shell/areas.ts` to "Orders and sales" → `/admin/tool`.

4. **Non-pending screen** (§4). The tab as today, plus the empty state from `SWHR2-MCK-35`.
5. **Order list columns** (§5; P5). `OrderTable` (default export, `orders` prop, sortable headers, -1, empty state) and `PendingTable` (same sorting and -1). `format.ts#formatDate` passes `M/D/YYYY` through.
6. **Test harness.** Update `routes/api/admin/orders/orders.test.ts`, `src/pages/admin/tool.test.tsx` and `src/components/shell/GlobalNav.test.tsx`. Add `src/components/admin/OrderTable.test.tsx` and `services/orders/sales.test.ts`. Do not edit `tests/acceptance/**`.
7. **CI.** No workflow change. The existing job must be green on the ticket branch.

## Fixed interface contracts

These are fixed by the locked suites. Do not rename them.

- `GET /api/admin/orders?status=<text>` (`routes/api/admin/orders/index.get.ts`, `requireAdmin`) returns `200` with `[{ id, orderId, userId, locale, date: "M/D/YYYY", amount, totalPrice, status }]`. An unmatched status returns `[]`.
- `GET /api/admin/sales/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD&category=<id?>` and `GET /api/admin/sales/order-counts?…` (`routes/api/admin/sales/{revenue,order-counts}.get.ts`) return `[{ key, label, value }]`, where `key` is the category id, or the item id when `category` is given.
- `services/orders/sales.ts#salesByCategory(kind: "revenue" | "count", start?, end?, category?)`.
- `src/components/admin/OrderTable.tsx`: `export default function OrderTable({ orders }: { orders: OrderRow[] })`. Header cells are role `columnheader` with text exactly `ID`, `User ID`, `Date`, `Amount`, `Status`. Amount renders with two decimals (`120.50`).
- `/admin/tool`:
  - tabs named Orders, Sales, Pending, Non-pending, Pie chart, Bar chart, and a Refresh button
  - inputs labelled "Start date" / "End date" with a Submit button, the first set visible on open
  - recharts output (`.recharts-wrapper`, `.recharts-pie-sector`, `.recharts-bar-rectangle`)
  - the first tabpanel on open is the pending list

## File/module ownership

Modify:

- `routes/api/admin/orders/index.get.ts`, `routes/api/admin/orders/orders.test.ts`
- `routes/api/admin/sales/revenue.get.ts`, `routes/api/admin/sales/order-count.get.ts` (→ renamed `order-counts.get.ts`)
- `services/orders/sales.ts`
- `src/pages/admin/tool.tsx`, `src/pages/admin/tool.test.tsx`
- `src/components/admin/{OrderTable,PendingTable,ChartPanel,format,types}.tsx|ts`
- `src/components/shell/areas.ts`, `src/components/shell/GlobalNav.test.tsx`

Create: `src/components/admin/OrderTable.test.tsx`, `services/orders/sales.test.ts`.

## Definition of Done

AC-1 … AC-15 on the ticket, one per scenario, each proven by its locked case SWHR2-C-0001 … SWHR2-C-0015. The order-approval locked suite (unit and e2e) must stay green.
