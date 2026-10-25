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
