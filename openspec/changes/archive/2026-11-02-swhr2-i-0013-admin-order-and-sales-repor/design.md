## Context

This document records how the legacy Java Pet Store 1.3.2 implements administrator order and sales reporting. It is input for the Architect, who drafts the target design once the Product Requirement is approved; it describes the legacy system only.

The capability spans four modules: the Swing administration client and its admin web module (`src/apps/admin`), the order processing centre admin facade (`src/apps/opc/.../opc/admin/ejb`), the process manager (`src/components/processmanager`) and the purchase order entity (`src/components/purchaseorder`). The visible contract of both screens is in `specs/sales-reporting/spec.md`; this file carries only the implementation behind it.

## Legacy structure

### Request path

The administration client is a Java Web Start Swing application (`PetStoreAdminClient`). It talks to the admin web module by HTTP POST of small XML documents to `ApplRequestProcessor` (`HttpPostPetStoreProxy.doHttpPost`), with the session id appended to the URL. The servlet calls `AdminRequestBD`, a business delegate, which calls the remote `OPCAdminFacadeEJB` (JNDI `ejb/opc/opc/OPCAdminFacadeEJBRemote`, `sun-j2ee-ri.xml:60-63`).

Three request types serve this capability:

| Type                                               | Servlet method                             | Facade method                                   | Data source                                                                                     |
| -------------------------------------------------- | ------------------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GETORDERS` with `<Status>`                        | `ApplRequestProcessor.getOrders` (166-197) | `getOrdersByStatus` (OPCAdminFacadeEJB 131-157) | `ManagerLocalHome.findOrdersByStatus`, then `PurchaseOrderLocalHome.findByPrimaryKey` per order |
| `REVENUE` with `<Start>`, `<End>`, `<ReqCategory>` | `getChartInfo` (249-297)                   | `getChartInfo` (169-256)                        | `PurchaseOrderLocalHome.findPOBetweenDates` and each order's line items                         |
| `ORDERS` (same fields)                             | `getChartInfo`                             | `getChartInfo`                                  | same                                                                                            |

### Order lists

- `DataSource.getServerOrderData` (131-144) issues four `GETORDERS` requests, PENDING, APPROVED, DENIED, COMPLETED, and concatenates the results.
- `ProcessManagerEJB.getOrdersByStatus` (86-91) delegates to the CMP finder `findOrdersByStatus`, EJB-QL `SELECT DISTINCT OBJECT(a) FROM Manager a WHERE a.status = ?1` (`processmanager/src/ejb-jar.xml:70-79`). Exact string equality, no ordering, no paging.
- The facade formats the order date as `month/day/year` without zero padding from `poDate` (epoch millis) and builds `OrderDetails(poId, poUserId, date, poValue, status)`. The servlet writes `<TotalCount>` and one `<Order>` element per order.
- `DataSource.OrdersViewTableModel` (291-407) filters the combined list to APPROVED, COMPLETED, DENIED; `isCellEditable` always returns false. `getValueAt` (337-362) parses the id with `new Integer()` and falls back to -1. Columns come from `petstore.properties` `OrdersTable.*` (57-61). `OrdersViewPanel.createTable` (69-76) attaches `TableSorter` to the header and disables column reordering.
- The user guide (`docs/using.html:219-232`) calls COMPLETED "committed (fulfilled)" and says the list is loaded by Refresh.

### Charts

- Aggregation is done in `OPCAdminFacadeEJB.getChartInfo`, not in the servlet. It loads all purchase orders with `findPOBetweenDates(start.getTime(), end.getTime())` (EJB-QL `... WHERE a.poDate BETWEEN ?1 AND ?2`, `purchaseorder/src/ejb-jar.xml:117-127`) and iterates every line item:
  - `REVENUE`: accumulates `quantity * unitPrice` as a `Float` keyed by category id (or by item id when a category is given and matches).
  - `ORDERS`: accumulates `quantity` as an `Integer` keyed the same way. The figure is units sold, not a number of orders.
  - No status filter is applied: pending, denied and completed orders all contribute.
- The servlet (265-297) writes one `<Category name="...">` or `<Item name="...">` element per map entry and a `<TotalSales>` element holding the float or integer sum. The element name is chosen by `category == null`.
- `HttpPostPetStoreProxy.getRevenue/getOrders` (369-399) parse the elements, keep an entry only if it has a name and a value >= 0 (`getFloat`/`getInt` return -1 on parse failure), and never read `<TotalSales>`. `Chart.calculateTotals` (73-86) recomputes totals client-side.
- `PieChartPanel` (204-210) computes `revenue / totalRevenue * 100`; the tooltip (254-258) uses a `DecimalFormat` with at most two fraction digits (70-73). `BarChartPanel` scales bars to the maximum value, draws `BarChart.numTics=5` y-axis ticks (`petstore.properties:74`) and tooltips `"<n> orders"` (314-318).
- Description strings: `PieChart.description` and `BarChart.description` (`petstore.properties:65-67`); `SubmitButton.text=Get Data` (70); date labels (47-48).

### Dates

- Both chart panels' `updateModelDates` (Pie 111-133, Bar 102-124) parse with `SimpleDateFormat("MM/dd/yyyy")`, which is lenient by default, show `DateFormatErrorDialog` on `ParseException`, and on success call `ChartModel.setDates`, which triggers a refresh of that chart.
- The client sends dates formatted with the same pattern. The servlet's `getProperDate` (319-326) splits on `/` as month, day, year and builds a `Date` at 00:00 local time. The end bound is therefore the start of the end day.
- `DataSource.ChartModel` (523-528) initialises `startDate = new Date("1/1/2001")` and `endDate = new Date("12/31/2002")`; the comments say "1/12/2001 for the demo" and "the present day".
- `ChartModel.viewMode` (530-531) is initialised to null and has no setter, so `<ReqCategory>` is always empty.

### Window and refresh

- `PetStoreAdminClient.createUI` (111-134) builds `ordersTabbedPane` (View Non-Pending Orders, Process Pending Orders) and `salesTabbedPane` (Pie Chart, Bar Chart). `OrdersAction`/`SalesAction` swap the centre panel; the orders toggle button is selected by default.
- The constructor (92-96) calls `refreshAction.actionPerformed(null)` after showing the frame. `RefreshAction.request` (`DataSource` 254-259) fetches orders, pie data and bar data in one background request.

### Error paths

- When the facade throws, `ApplRequestProcessor` logs and returns null, which the servlet writes as the text `null` (199-202, 301-304). Missing `Status`, `Start` or `End` elements fail with an unhandled exception (312-316).
- `HttpPostPetStoreProxy.doHttpPost` (129-133) swallows exceptions and returns null; callers then fail on the missing document and the client exits with a "Fatal Error!" dialog.
- A range with zero revenue or zero units divides by zero in the pie percentages and bar heights (Pie 207-210, Bar 187, 289-290).

## Decisions and disputes

- **D1 Sales count meaning.** The spec states the computed figure (sum of line-item quantities) because that is what the facade computes; the UI label "orders" and the servlet variable `totalQuantity` disagree. Conflict for Intent.
- **D2 Revenue scope.** Revenue and counts include orders of every status in the range. Stated as current behaviour; suspected defect for the Business Owner.
- **D3 End-date bound.** The finder is inclusive (`BETWEEN`), and the requirement says so, but the admin path passes midnight of the end date, so orders placed later on the end day are excluded. Suspected defect; the spec states the finder contract.
- **D4 Per-item drill-down** kept as a requirement with `MAY be unreachable` wording; both passes marked it `unresolved-reachability`.
- **D5 Default range** kept as stated in code; low confidence, demo literal.
- **D6 Two screens.** SALES-REPORTING-SCREEN-0001 (the non-pending orders list) and SALES-SCR-0002 (the columns, sorting and -1 fallback shared by both order lists). SALES-SCR-0002 is approved as written, so its pending-list half is specified here too; the pending list's approve/deny behaviour stays with `order-approval`.
- **D7 Approved records only.** spec.md carries only the 7 approved records. Revenue and sales-count reports (SALE-REQ-0002/0003, SALES-REQ-0004/0005, SREP-RULE-0002), date-entry validation (SALE-BR-0004, SALES-BR-0006), chart totals (SALE-BR-0007, SALES-BR-0009), the date-range finder (SALES-RULE-0001), the order-list protocol (SALES-INT-0003) and the chart window (SALE-SCR-0001/0008) are pending SME review and are Not specified. D1-D3 above describe legacy behaviour behind those pending records.
- **D8 `SALES-REQ-0001` collision.** Three pass files emit this key. The approved record is taken to be the processmanager/a variant (orders by exact status): the admin/a variant is a screen and the server counts only 2 screens for this capability, and processmanager/a was committed first. The purchaseorder/a variant (orders between dates) duplicates SALES-RULE-0001. If the server holds a different variant, the "Orders by current status" requirement must be rewritten from it.

## Requirement-to-record traceability

| Requirement                             | ID           | Record                                  |
| --------------------------------------- | ------------ | --------------------------------------- |
| Orders by current status                | SWHR2-R-0143 | SALES-REQ-0001 (processmanager/a)       |
| Order list details by status            | SWHR2-R-0113 | SREP-REQ-0001 (apps/opc/a)              |
| Default chart date range                | SWHR2-R-0026 | SALES-BR-0007                           |
| Per-item breakdown within a category    | SWHR2-R-0025 | SALES-BR-0008                           |
| Report data load on start and refresh   | SWHR2-R-0112 | SALES-WF-0010                           |
| Non-pending orders screen (screen)      | SWHR2-R-0110 | SALES-REPORTING-SCREEN-0001 (docs/a, b) |
| Order list columns and sorting (screen) | SWHR2-R-0111 | SALES-SCR-0002                          |

## Risks / gaps

- Revenue is carried and summed in single-precision floats on server and client, so totals can be off by cents; amounts are printed with float formatting, not as currency.
- The admin data endpoint checks only that a session exists, not the administrator role (finding under `sign-on`); every report here is exposed through it.
- Back-end failures surface as an unparseable reply and a client crash, not an error message.
- Lenient date parsing rolls invalid dates (13/45/2001) into other real dates instead of rejecting them.
- The facade loads every purchase order and line item in the range into memory per chart request; there is no paging or pre-aggregation.

## Target design

### Components

- **Report service** `services/reports/index.ts`:
  - `ordersByStatus(status)` returns every order whose workflow status exactly equals `status`, compared case-sensitively, so "approved" does not match APPROVED. Each order appears once, with no ordering and no paging (SWHR2-R-0143). Each row carries the order id, user id, order date as `M/D/YYYY`, amount and status (SWHR2-R-0113).
  - `revenue(start, end, category?)` and `orderCounts(start, end, category?)` aggregate order lines for orders whose order date falls in the inclusive range. Without a category they return figures per category; with one, per item of that category (SWHR2-R-0025). Revenue is the sum of quantity × unit price. The order count is the number of distinct orders containing the category or item.

    The aggregates filter on order date only, not status, so denied orders count, which is the specified behaviour noted in the PRD constraints. The administration tool sends no category, so the per-item breakdown is reachable only through the API (SWHR2-R-0025).

- **Administration tool views** in `src/pages/admin/tool.tsx` (shared with order-approval). The tool opens on the Orders view, with Non-pending and Pending tabs, and the administrator can switch to the Sales view, with Pie chart and Bar chart tabs (SWHR2-R-0112).
  - **Order lists** (`src/components/admin/OrderTable.tsx`): both lists show ID, User ID, Date, Amount and Status columns. Clicking a column header sorts by that column, client-side (SWHR2-R-0111). A non-numeric order id is displayed as -1.
  - **Non-pending list**: APPROVED, DENIED and COMPLETED orders, never PENDING, loaded by Refresh (SWHR2-R-0110).
  - **Charts** (`src/components/admin/SalesPieChart.tsx`, `SalesBarChart.tsx`) show revenue and order counts per category, each with start and end date inputs and a submit. The dates default to 01/01/2001 and 12/31/2002 until changed (SWHR2-R-0026).
  - **Loading**: on start and on Refresh, the tool loads all order lists and both charts (SWHR2-R-0112), under the busy-state rule owned by order-approval.
- **Unlisted status**: SHIPPED_PART orders are in neither list, because the lists cover PENDING, APPROVED, DENIED and COMPLETED only (order-approval SWHR2-R-0086).

### Data

No new table. The reports read `op_purchase_orders` (order id, user id, order date, total), `op_po_line_items` (category, item, quantity, unit price) and `op_order_workflow` (status), which are defined by checkout and order-fulfillment. Dates are compared and formatted in UTC. Amounts are converted from hundredths when the response is serialised.

### Interfaces

All routes need administrator authorisation (`requireAdmin`).

- `GET /api/admin/orders?status=<text>` → `[{ id, userId, date: "M/D/YYYY", amount, status }]`.
- `GET /api/admin/sales/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD&category=<id?>` → `[{ key, label, value }]`, where `key` is a category id, or an item id when `category` is given.
- `GET /api/admin/sales/order-counts?start&end&category` has the same shape, with `value` as the count.

### Stack choices

- Drizzle ORM aggregate queries (`sum`, `countDistinct`, `groupBy`) over SQLite, and Nitro (H3) routes under `routes/api/admin/`.
- `recharts` for the pie and bar charts in the React SPA. This dependency is assumed, because the pinned stack names no chart library. `@headlessui/react` `Tab` provides the view tabs.
- Tests: route integration tests for exact-case status match, M/D/YYYY dates, the category versus item breakdown and denied orders counted in revenue; UI tests for column sorting, the -1 id and the default dates.

## Sprint planning (SWHR2-S-0032)

Implemented end-to-end by FEATURE SWHR2-T-0317 (plan: `artifacts/SWHR2-S-0032/SWHR2-T-0317/PLAN.md`). Where this section and "Target design" differ, this section wins. The locked acceptance suites (`tests/acceptance/sales-reporting/` and the already-green `tests/acceptance/order-approval/`) fix the contracts below.

### Codebase findings

Order-approval (SWHR2-S-0027) already built most of the surface this change extends. The work is to modify it, not to create new modules:

- **`routes/api/admin/orders/index.get.ts`**:
  - accepts only PENDING/APPROVED/DENIED/COMPLETED (any other value → 400 `InvalidStatus`)
  - returns `{ items, orders }`, rows `{ id, orderId, userId, locale, date: ISO, amount, totalPrice, status }`, ordered by id
  - its unit test `routes/api/admin/orders/orders.test.ts` asserts that object shape and the 400
- **`services/orders/sales.ts#salesByCategory(kind, start, end)`**:
  - computes revenue (`sum(quantity × unit_price)/100`) or `count(distinct order)` per category over an inclusive day range, with no status filter
  - has no `category` parameter
  - is served by `routes/api/admin/sales/revenue.get.ts` and `routes/api/admin/sales/order-count.get.ts`
  - there is no `services/reports/` module
- **`src/pages/admin/tool.tsx`** (`/admin/tool`, headed "Order approval"):
  - one TabGroup with Pending and Non-pending tabs, and both `ChartPanel`s (pie and bar, one shared Start/End date pair defaulting to `01/01/2001`/`12/31/2002`, Submit) always shown below it
  - loads the four statuses and both charts on start and on Refresh
  - reads `body.orders ?? body.items`
- **`src/components/admin/OrderTable.tsx`**:
  - a named export `OrderTable({ rows })`, with the five columns but no sorting and no -1 fallback
  - `format.ts#formatDate` re-parses the date and prints `03/05/2002` (zero-padded)
  - `PendingTable.tsx` uses the same `formatDate` and is not sortable
- **Navigation**: `src/components/shell/areas.ts` has "Order approval" → `/admin` and "Sales reporting" → `/admin`. The mockups label the entry "Orders and sales". The unit test `src/components/shell/GlobalNav.test.tsx` pins the current labels.
- **Locked contracts** (`tests/acceptance/sales-reporting/`):
  - `GET /api/admin/orders?status=` returns a bare JSON array `{ id, userId, date: "M/D/YYYY", amount, status }[]` and returns 200 + `[]` for `approved` (C-0012…C-0015)
  - `GET /api/admin/sales/revenue?start&end&category=FISH` returns `[{ key: itemId, value }]` for that category's items only (C-0001/0002)
  - `src/components/admin/OrderTable` has a **default** export taking `orders`
  - the header cells are role `columnheader` with exact texts `ID`, `User ID`, `Date`, `Amount`, `Status`; clicking one sorts; amount renders `120.50`; a non-numeric id renders `-1` (C-0006…0008)
  - the e2e opens `/admin/tool`, requests `/api/admin/sales/order-counts` (plural, C-0010) and fakes the orders reply as `{ items, orders }`
  - tabs (or buttons) are named Orders, Sales, Non-pending, Pending, Pie and Bar; there are `.recharts-pie-sector` / `.recharts-bar-rectangle`; Start/End inputs are labelled on each chart tab (C-0003)
  - after switching to Sales, no order row is visible (C-0011)
- **Locked order-approval e2e** (`tests/acceptance/order-approval/e2e/tool.spec.ts`), already green, must stay green:
  - on opening `/admin/tool`, with no click, a `.recharts-wrapper` containing "Fish" and a pie sector or bar is visible (C-0240)
  - the first labelled Start/End inputs and the first Submit button can be filled immediately (C-0241)
  - the first tabpanel is the pending list (C-0242)
- `recharts` and `@headlessui/react` are already dependencies. No schema change.

### Decisions

- **P1 One route, one page.** The "Orders and sales" page is `/admin/tool`, extended in place, because both locked e2e suites open that route. The page heading becomes "Orders and sales" and the navigation entry "Orders and sales" points to `/admin/tool` (replacing "Sales reporting" → `/admin`). "Order approval" stays as it is.
- **P2 Orders view keeps compact charts.** The page has a top-level Orders | Sales view switch and opens on Orders. The Orders view holds the Pending (first) and Non-pending tabs **and keeps the existing pair of compact chart panels below them**, because locked order-approval C-0240/C-0241 require a chart and date inputs visible without any click. The Sales view holds Pie chart and Bar chart tabs, each with its own labelled Start/End inputs and Submit, and shows no order rows. Both views share one applied date range, so the default is `01/01/2001`–`12/31/2002` everywhere. The compact charts are a deliberate divergence from mockup `SWHR2-MCK-34` (see X2).
- **P3 Orders route returns a bare array.** `GET /api/admin/orders` returns the row array directly, with `date` as `M/D/YYYY` in UTC and `amount` in units. Rows keep `orderId`, `totalPrice` and `locale`, so existing readers keep working. Any status string is accepted and matched exactly and case-sensitively; an unmatched one returns `[]` with 200 (SWHR2-R-0143.02). A missing `status` is still a 400. The tool's reader accepts the array or `{ orders | items }`, because the locked e2e fakes the object form. The route's own unit test is updated to the new shape.
- **P4 Category breakdown.** `salesByCategory(kind, start, end, category?)` groups by `item_id` restricted to that category when a category is given, otherwise by category. Both sales routes pass `category`. The `order-count` route moves to `routes/api/admin/sales/order-counts.get.ts` (the locked e2e path), and the tool and unit tests follow. No UI control sends a category (SWHR2-R-0025, D4). The figure stays the distinct-order count already shipped (D1 left as is).
- **P5 Tables.** `OrderTable` becomes a default export `OrderTable({ orders })`, with the named export kept as an alias so `tool.tsx` changes minimally. It has client-side sorting on every header (header is a button inside `th`, `aria-sort` set), and a click on the active column reverses the order. It renders the id as `-1` when it is not all digits, and shows an "No orders in this status" empty state instead of an empty table (mockup `SWHR2-MCK-35`). `PendingTable` gets the same sorting and -1 rule (SWHR2-R-0111 covers both lists). `formatDate` passes `M/D/YYYY` through unchanged and formats ISO input as UTC `M/D/YYYY`.

### Phases

1. **Order queries** (tasks §1): P3 in the orders route.
2. **Sales chart data** (§2): P4. Lines 2.1 and 2.4 ("confirm with the SME") cannot be done by the implementer; they are met by the stated default and the API-only breakdown (X3).
3. **Load and refresh** (§3): P1/P2 in `tool.tsx`, plus the nav entry.
4. **Non-pending screen** (§4): the non-pending tab as today, with the empty state.
5. **Order list columns** (§5): P5.
6. **Test harness.** Update the unit tests the change breaks: `routes/api/admin/orders/orders.test.ts` (shape, exact match, `order-counts`), `src/pages/admin/tool.test.tsx` and `src/components/shell/GlobalNav.test.tsx`. Add `src/components/admin/OrderTable.test.tsx` (sorting, -1, empty state) and a `services/orders/sales.test.ts` case for the category breakdown. Do not edit `tests/acceptance/**`.
7. **CI.** No workflow change. The existing CI job (lint, typecheck, unit, acceptance, E2E) on `vortex/**` pushes and PRs must be green, with both the sales-reporting and the order-approval locked suites passing.

## Spec discrepancies

Recorded, not edited into the delta spec or `tasks.md`.

- **X1 Orders route shape and status set.** Order-approval shipped `GET /api/admin/orders` as `{ items, orders }` with ISO dates and a 400 for any status outside the four lifecycle values. SWHR2-R-0143.02 and SWHR2-R-0113.01 require exact-match filtering of any string (empty result, not an error) and `M/D/YYYY` dates, and the locked server test reads a bare array. The locked e2e still fakes the object form. Resolved by P3.
- **X2 Charts on the Orders view.** The brief and mockups `SWHR2-MCK-34`/`35` show the Orders view with no charts, and put the charts only in the Sales view. The locked order-approval cases C-0240/C-0241 (shipped, green) require a chart and date inputs visible on opening `/admin/tool`. P2 keeps compact charts on the Orders view so both suites pass. A human should decide at UAT whether C-0240/C-0241 or the mockup changes.
- **X3 SME confirmations in tasks.** tasks 2.1 and 2.4 ask for SME confirmation of the default range and of per-item reachability. That is not implementation work; D4/D5 already record both as legacy-stated and low confidence.
- **X4 Route name.** "Target design" names `GET /api/admin/sales/order-counts`; the shipped route is `order-count`. The locked e2e uses `order-counts` (P4).
- **X5 Report service location.** "Target design" places queries in `services/reports/index.ts`. The shipped aggregation lives in `services/orders/sales.ts` and the orders query in the route. The plan extends those in place rather than moving them.
- **X6 Sales count meaning.** The legacy figure is units sold (D1), while the target design and the shipped code count distinct orders. No approved scenario asserts the count value. Unchanged.
- **X7 Navigation label.** The brief names the entry "Orders and sales" in the Administration group; the shipped nav says "Sales reporting" → `/admin`. P1 renames and repoints it.
