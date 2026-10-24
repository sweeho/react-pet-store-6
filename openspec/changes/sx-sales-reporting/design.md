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
- **D6 Two screens.** The non-pending orders list (SALE-SCR-0001, SALES-REQ-0001 admin/a, SALES-SCR-0002, SALES-REPORTING-SCREEN-0001) and the Orders/Sales window with chart tabs (SALE-SCR-0008). SALES-SCR-0002 also describes the pending list's columns; that list's behaviour belongs to `order-approval`, so only the non-pending side is specified here.

## Requirement-to-record traceability

| Requirement                           | Records                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Orders within a date range            | SALES-RULE-0001 (purchaseorder/b), SALES-REQ-0001 (purchaseorder/a)                                   |
| Orders by current status              | SALES-REQ-0001 (processmanager/a)                                                                     |
| Order list data                       | SALES-INT-0003                                                                                        |
| Revenue by category report            | SALE-REQ-0002, SALES-REQ-0004                                                                         |
| Sales count by category report        | SALE-REQ-0003, SALES-REQ-0005                                                                         |
| Chart date entry validation           | SALE-BR-0004, SALES-BR-0006                                                                           |
| Default chart date range              | SALE-BR-0005, SALES-BR-0007                                                                           |
| Per-item breakdown within a category  | SALE-BR-0006, SALES-BR-0008                                                                           |
| Chart totals and invalid entries      | SALE-BR-0007, SALES-BR-0009                                                                           |
| Report data load on start and refresh | SALES-WF-0010                                                                                         |
| Non-pending orders screen (screen)    | SALE-SCR-0001, SALES-REQ-0001 (admin/a), SALES-SCR-0002, SALES-REPORTING-SCREEN-0001 (docs/a, docs/b) |
| Sales charts screen (screen)          | SALE-SCR-0008, SALES-WF-0010 (view switching)                                                         |

## Risks / gaps

- Revenue is carried and summed in single-precision floats on server and client, so totals can be off by cents; amounts are printed with float formatting, not as currency.
- The admin data endpoint checks only that a session exists, not the administrator role (finding under `sign-on`); every report here is exposed through it.
- Back-end failures surface as an unparseable reply and a client crash, not an error message.
- Lenient date parsing rolls invalid dates (13/45/2001) into other real dates instead of rejecting them.
- The facade loads every purchase order and line item in the range into memory per chart request; there is no paging or pre-aggregation.
