## Context

This document records how the LEGACY Java Pet Store 1.3.2 implements order approval. It does not propose a target design; the Architect drafts that once the Product Requirement is approved. See `proposal.md` for motivation and `specs/order-approval/spec.md` for the behaviour.

Order approval spans four legacy modules:

| Concern               | Legacy location                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automatic approval    | `src/apps/opc/.../opc/ejb/PurchaseOrderMDB.java` (`doWork`, `canIApprove`, lines 150-191)                                                                                                |
| Administrator UI      | Swing rich client in `src/apps/admin/src/client/...` (`PetStoreAdminClient`, `OrdersApprovePanel`, `OrdersViewPanel`, `DataSource`), launched with Java Web Start from the admin web app |
| Admin server endpoint | `src/apps/admin/src/admin/.../web/ApplRequestProcessor.java` (servlet) and `AdminRequestBD.java` (business delegate)                                                                     |
| Order lookup          | `src/components/processmanager` (`ProcessManagerEJB.getOrdersByStatus`, EJB-QL finder in `ejb-jar.xml` lines 70-79), reached through the remote `OPCAdminFacade` EJB                     |
| Decision delivery     | `src/components/asyncsender` (`AsyncSenderEJB`), queue `jms/opc/OrderApprovalQueue` created by `setup.xml` lines 95-101 and bound in `apps/admin/src/sun-j2ee-ri.xml` lines 95-98        |
| Decision document     | `src/components/xmldocuments` (`OrderApproval`, `ChangedOrder`, `rsrc/schemas/OrderApproval.dtd`)                                                                                        |

## Legacy implementation notes

**Automatic approval.** `PurchaseOrderMDB.doWork` persists the purchase order, creates a process-manager entry with status PENDING, then calls `canIApprove`. When that returns true it builds a one-entry `OrderApproval` (status APPROVED) and sends it through the transition delegate to the same order-approval queue the admin tool uses. So auto-approved and administrator-approved orders take one path from that point on. `canIApprove` is a locale switch with bare literals (`Locale.US` `< 500`, `Locale.JAPAN` `< 50000`, otherwise false). Its comment calls it "just a stub for converting currency" for demo purposes. The total is compared as a raw number with no currency conversion.

**Screens.** Both panels are tabs of one Swing frame titled "Pet Store Administration". Tab titles, button labels, column headers, dialog texts and status-bar texts come from `client/resources/petstore.properties` (lines 26-60). Each panel is a `JTable` over a `TableSorter` (click a header to sort) over a table model in `DataSource`:

- `OrdersApproveTableModel` filters to `statusList = {PENDING}` and makes only column 4 (Status) editable, through a combo-box editor holding PENDING, APPROVED and DENIED (`OrdersApprovePanel` lines 80-171).
- `OrdersViewTableModel` filters to `{APPROVED, COMPLETED, DENIED}` and `isCellEditable` returns false (`DataSource` lines 295-408).
- The colour coding is a custom cell renderer on the Status column of the approve panel only. Colour is the cell background. The non-pending panel has no renderer.
- The user guide (`docs/using.html` lines 219-265) says the non-pending pane is loaded by clicking Refresh. In code it is also populated at start-up, because the client constructor runs the refresh action.

**Marking and commit.** The Approve and Deny buttons loop over `getSelectedRows()` and call `setValueAt` on the sorter. `OrdersApproveTableModel.setValueAt` replaces only the cached `Order` object, so nothing is persisted. `commit()` (`DataSource` lines 422-476) collects APPROVED and DENIED rows and returns early when both are empty. Otherwise it queues a `ServerAction` that calls `server.updateStatus` once for the approved array and once for the denied array, as two separate `UPDATESTATUS` HTTP POSTs, then calls `getServerOrderData()`. The approvals-before-denials order is implicit in statement sequence only.

**Refresh warning.** `RefreshAction.actionPerformed` scans column 4 of the approve model for any non-PENDING value and shows an OK/CANCEL dialog (`RefreshWarningDialog.*`) before running.

**Busy state and errors.** All server calls run serially on one `WorkQueue` thread. `DataSource` fires `DISABLE_ACTIONS` before each `ServerAction` and `ENABLE_ACTIONS` in `response()`. Listeners in `PetStoreAdminClient`, `OrdersApprovePanel` and the chart panels toggle their actions, and the status bar shows `Status.retrieve` or `Status.update`. Every `ServerAction.handleException` routes to `DataSource.fatalServerError`, which shows a "Fatal Error!" `JOptionPane` and calls `System.exit(1)`. The refresh also fetches revenue and order-count chart data. That overlaps `sales-reporting`; the approved records keep it here (see D3).

**Wire protocol.** The client posts custom XML to the admin servlet (`/AdminRequestProcessor`, protected by the `administrator` role in `web.xml`): `<Type>GETORDERS</Type><Status>..</Status>` for a list, and `UPDATESTATUS` carrying `<Order><OrderId/><OrderStatus/></Order>` entries for decisions. `ApplRequestProcessor.updateOrders` (lines 205-237) maps each complete entry to a `ChangedOrder`, skipping entries with a null id or status. Its comment reads "Assumes values of OrderStatus are the same for both schemas". `AdminRequestBD.updateOrders` sends `OrderApproval.toXML()` through `AsyncSenderEJB.sendAMessage`. The reply is `<Type>UPDATEORDERS</Type><Status>SUCCESS</Status>` or an `<Error>`. The client parser (`HttpPostPetStoreProxy.parseOrderStatus`, lines 266-282) maps any status other than the four known values to null.

**Decision document.** `OrderApproval.dtd` declares `OrderApproval (Order+)` and `Order (OrderId, OrderStatus)`, where `OrderStatus` is `#PCDATA` with a "FIXME should be attribute" comment. `OrderApproval.fromDOM` and `ChangedOrder.fromDOM` re-check the root tag, the element order and non-empty content (`optional=false`) independently of DTD validation. The one-or-more rule is enforced by the DTD and by `fromDOM` requiring a first `Order` child. `OrderApproval.VALIDATING = true` is the default for the one-argument `fromXML`, but production consumers (`OrderApprovalMDB`, `MailOrderApprovalMDB`) pass a deployment flag (`XML_VALIDATION_ORDER_APPROVAL`) whose value is set outside these modules.

## Goals / Non-Goals

**Goals:** record the legacy behaviour faithfully enough for the SME to decide each draft requirement.

**Non-Goals:** the target design, the order-fulfilment steps after approval (supplier forwarding, shipping, mail), sign-on, and the sales charts.

## Decisions

- D1. The spec carries only the 12 SME-approved records, one requirement each, with its minted key. Of the screen records, `OAPP-SCR-0009` and `ORDER-APPROVAL-SCR-0004` are approved and written as requirements. The pending-orders screen records `OAPP-REQ-0001` and `ORDA-SCR-0003` are still pending review, so the field list, edit restriction and Approve/Deny/Commit controls of that screen are not yet specified.
- D2. Some approved records overlap: `ORDER-APPROVAL-BR-0001` (US threshold) and `OAPP-RULE-0001` (US and Japan thresholds), and `ORDER-APPROVAL-INTEGRATION-0001` and `order-approval-INT-0001` (decision delivery). Each is written as its own requirement because each carries its own key.
- D3. `ORDA-BR-0007` and `OAPP-BR-0007` are written as approved, so they still include chart-data loading and the chart-submit action, which overlap `sales-reporting`.
- D4. The exactly-500 boundary is written as the code behaves (pending). The document conflict goes to Intent.

## Risks / Trade-offs

Suspected legacy defects and conflicts. The Business Owner decides each one in the defect register or Intent:

- R1. **Exactly-500 boundary.** The English guide says both "under $500" is auto-approved and "greater than $500" is pending. The Chinese guide says "not exceeding $500" is auto-approved. The code (`< 500`) leaves 500.00 pending.
- R2. **Locales other than US and Japan are never auto-approved.** This includes zh_CN, which the storefront ships. The guides describe one dollar rule for all orders. The Japanese threshold is undocumented and has no currency conversion.
- R3. **No server-side validation of submitted statuses.** `PetStoreProxy.Order.checkStatus` is empty, and the servlet forwards any status for any order id. Only the client combo box restricts values. Nothing stops a decision on an order that is no longer PENDING, for example one decided by another administrator since the list loaded.
- R4. **Update outcome not checked.** After `updateStatus` the client compares the reply with SUCCESS but does nothing on a mismatch ("throw an exception" is only a comment, `HttpPostPetStoreProxy` lines 414-417). The two IR passes disagree on what follows: pass A says an error reply makes the comparison throw and the tool closes, and pass B says the failure is silent and the order reappears as pending. Either way, if the approvals batch succeeds and the denials batch fails, the approvals are already sent. "SUCCESS" means only that the message was queued.
- R5. **Back-end failures become a client crash.** The servlet logs back-end exceptions and returns null (reply body "null"). `doHttpPost` swallows exceptions and returns null. The caller then fails and the tool closes with an uninformative "Fatal Error!", losing uncommitted markings.
- R6. **Unreadable approval batch.** `ChangedOrder.toDOM` writes a null id or status as an empty element, which every reader then rejects.
- R7. **Pass disagreement on the queue's purpose.** `APPR-INT-0001` reads the queue as carrying orders to the approval step. The admin binding and `PurchaseOrderMDB` show that it carries decisions.

## Target design

### Components

- **Auto-approval rule** `services/orders/approval.ts`. `autoApproves(locale, total)` is true when the locale is en_US and the total is below 500.00 (stored total < 50000), or the locale is ja_JP and the total is below 50000 (stored total < 5000000). Every other order stays PENDING: zh_CN or any other locale, or a total at or above the threshold (SWHR2-R-0021, SWHR2-R-0022). The zh_CN and exact-500 boundaries are open Business Owner decisions (PRD open question 9), so the thresholds sit in this one function.
- **Receipt step** (SWHR2-R-0085). When order processing receives an `order.new` message, it stores the order (checkout), then starts the workflow record in PENDING (order-fulfillment), and only then evaluates `autoApproves`. When the rule approves, the step applies the same decision as an administrator APPROVED, all inside the one message transaction (order-fulfillment SWHR2-R-0140).
- **Decision step** `services/orders/decide.ts`, the consumer of the `order.approval` channel. The message is one approval document listing `(orderId, status)` entries, and the status is free text that the document format does not restrict (SWHR2-R-0082). For each entry whose workflow status is PENDING, APPROVED or DENIED becomes the new status. Any other current status, or any other value, leaves the order unchanged (order-fulfillment SWHR2-R-0096). An APPROVED result sends the supplier purchase order (order-fulfillment) and a `notify.approval` message (customer-notifications). A DENIED result sends only `notify.approval`. The whole batch is one transaction and is retried on failure (order-fulfillment SWHR2-R-0140).
- **Administration tool** `src/pages/admin/tool.tsx`, guarded by admin sign-in. It opens on the Orders view with two tabs (SWHR2-R-0087):
  - **Pending orders**: PENDING orders with an editable status per row, Approve and Deny controls for the selected rows, Commit and Refresh. Status text is yellow for PENDING, green for APPROVED and red for DENIED (SWHR2-R-0084).
  - **Non-pending orders**: APPROVED, DENIED and COMPLETED orders, loaded by Refresh. sales-reporting owns the columns and sorting.
- **Uncommitted marks** live only in page state. Approving or denying a row changes nothing on the server until Commit, which posts every marked row in one request (SWHR2-R-0088). When Refresh is asked for while any row is marked other than PENDING, the tool shows the confirm dialog "Data is not committed. Are you sure you want to refresh?". It reloads and discards the marks only on confirm, and with no marks it reloads without asking (SWHR2-R-0135).
- **Load on start and refresh** (SWHR2-R-0086). On mount and on every confirmed Refresh, the tool loads orders in PENDING, APPROVED, DENIED and COMPLETED, plus the revenue and order-count chart data for the current date ranges (sales-reporting).
- **Busy state** (SWHR2-R-0083). While a request is in flight, the approve, deny, commit, chart-submit, refresh, about and exit controls are disabled, and a status line shows "Retrieving data from the server..." for loads or "Updating data on the server..." for commits. They are re-enabled once the reply has been applied. Exit signs the administrator out, and About shows an about dialog.

### Data

No new table. The tool reads the workflow status from `op_order_workflow` and the order fields from `op_purchase_orders` (checkout, order-fulfillment). Uncommitted marks are client state only. A committed batch is one row on the durable `order.approval` channel in the `messages` table (order-fulfillment), and it stays there until order processing consumes it (SWHR2-R-0089).

### Interfaces

- `GET /api/admin/orders?status=PENDING|APPROVED|DENIED|COMPLETED` (admin): the order list, as owned by sales-reporting.
- `POST /api/admin/orders/decisions` (admin): body `{ decisions: [{ orderId, status }] }`. It renders the approval document and enqueues it as one text message on `order.approval`, then returns 202 without waiting for order processing (SWHR2-R-0136).
- `order.approval` payload: the approval document as XML text, with one `(OrderId, OrderStatus)` entry per decision and the status written as free text.

### Stack choices

- Vite React SPA page under `src/pages/admin/`, with Tailwind and the shadcn/ui-style primitives. The tabs use `@headlessui/react` `Tab`, already a dependency. Status colours are Tailwind tokens defined in CSS (CSS-first Tailwind).
- `window.confirm` or a shadcn-style dialog for the refresh warning.
- Nitro (H3) admin routes behind `requireAdmin`. The approval document is built with `fast-xml-parser` (checkout). Durable delivery uses the outbox table, not a broker (PRD constraints).
- Tests: unit tests for `autoApproves` at 499.99, 500.00, 49999, 50000 and zh_CN; a decision-step test proving a non-PENDING order is not changed and that a failure rolls back the whole batch; UI tests for colours, the refresh warning and the busy state.

## Planning (SWHR2-S-0027)

Ticket: SWHR2-T-0295 (FEATURE) owns every task group. The locked acceptance suite for this capability (`tests/acceptance/order-approval/`) fixes several module names and shapes the Target design above does not state; where the two differ, the locked suite wins, and each difference is listed under Spec discrepancies.

### Codebase findings

- F1. Receipt exists. `services/orders/receive.ts#receiveOrder(messageId)` decodes an `order.new` message, stores the order, inserts `op_order_workflow` PENDING and marks the message `done`, in one transaction. No approval step runs.
- F2. The outbox is `services/messages/index.ts` (`enqueue(tx, channel, payload)`, `drain`, `startWorker`) with statuses `pending | done | failed` (check constraint in `db/schema.ts`) and no due-time column. `plugins/order-worker.ts` starts it for `order.new` only. Each handler marks its own message.
- F3. `op_order_workflow` is `(order_id, status)` only. `op_purchase_orders` holds `user_id`, `locale`, `order_date`, `total` (integer hundredths).
- F4. Admin sign-in, `admin_sid` session and `requireAdmin` exist (`services/session/guards.ts`). `src/pages/admin/index.tsx` already links to `/admin/tool`, which does not exist. No `routes/api/admin/orders/**` or `sales/**` routes exist.
- F5. `@headlessui/react` is a dependency. `recharts` is not.
- F6. The global navigation's "Order approval" and "Sales reporting" entries point at `/admin` (`src/components/shell/areas.ts`, asserted in `GlobalNav.test.tsx`).
- F7. Later capabilities' locked suites already use shared names this change must create: `services/messaging` (`enqueue(db, channel, payload)`), `services/messaging/worker` (`processDue()`), message status `delivered`, column `available_at`, `services/orders/decide#decideBatch(xml)` (order-fulfillment), `src/components/admin/OrderTable` with rows `{ id, userId, date, amount, status }` and headers ID / User ID / Date / Amount / Status (sales-reporting C-0006), and `routes/api/admin/sales/revenue.get` with `start`/`end` query (sales-reporting).

### Spec discrepancies

- SD1. **`receiveOrder` signature.** design.md and F1 have `receiveOrder(messageId)`; the locked harness calls `receiveOrder({ orderId, locale, totalPrice, lines })` with `totalPrice` in display units (499.99) and no billing, shipping, card or user. Planning: `receiveOrder(doc)` takes an order document; display-unit `totalPrice` is converted to hundredths (`Math.round(x * 100)`); missing parties, card and user default to empty values. The `order.new` channel handler decodes the XML and calls the same receipt body.
- SD2. **Messaging module and statuses.** F2 has `services/messages` and status `done`; locked cases C-0246 (this change) and order-fulfillment's suite need `services/messaging/worker#processDue()`, status `delivered` and an `available_at` column. Planning P1 moves the outbox.
- SD3. **Refresh warning.** The Target design allows a shadcn dialog, and mockup SWHR2-MCK-29 draws an in-page dialog "Refresh and discard 3 decisions?". Locked e2e C-0247/C-0248 accept or dismiss a native browser dialog, so the warning is `window.confirm("Data is not committed. Are you sure you want to refresh?")`, the spec text.
- SD4. **Controls the mockups do not draw.** Locked cases C-0235 to C-0237 and C-0240/C-0241 require About, Exit and chart Submit buttons, Start/End date fields and recharts charts on the tool; the mockups show none of them and label sign-out "Log out". The tool keeps the mockup layout and adds a chart section below the tabs plus About and Exit (Exit signs out).
- SD5. **Status text case.** Mockups show "Approved", "Pending"; locked C-0238/C-0243/C-0248 match the exact text `APPROVED`, `PENDING`, `DENIED`. Statuses are shown as the stored upper-case value; the mockup's "Not committed" note sits in a separate element.
- SD6. **Status colour classes.** C-0238 matches the status element's class name against `/yellow/`, `/green/`, `/red/`, so the colours are Tailwind palette utilities, not new CSS tokens (DESIGN.md § Status colours).
- SD7. **List reply shape.** The tool's locked tests answer `GET /api/admin/orders` with `{ items, orders }` rows `{ orderId, status, locale, totalPrice }`, while sales-reporting's OrderTable takes `{ id, userId, date, amount, status }`. The route returns `{ items, orders }` (the same array) whose rows carry both sets of fields, and the tool reads `orderId ?? id`, `totalPrice ?? amount`.
- SD8. **Session check.** The e2e fake answers `/api/admin/session` with `{ signedOn: true }`, not the real `{ userId }`, and the UI test's fetch stub answers every GET with the order list. The tool does not gate rendering on a session call; a 401 `SignOnRequired` from any tool request sends the administrator to `/admin` (existing failure routing).
- SD9. **Chart data is sales-reporting's.** R-0086 makes the tool load chart data, which change `swhr2-i-0013-admin-order-and-sales-repor` specifies. This change builds the chart panels and minimal routes (P5); that change owns their rules and may rewrite both routes.
- SD10. **Pending table header.** Mockup: "Order ID"; sales-reporting's OrderTable (non-pending view) is locked to "ID". Pending keeps "Order ID", non-pending uses OrderTable as locked.

### Decisions

- P1. **Outbox becomes `services/messaging/`.** `index.ts#enqueue(exec, channel, payload)` (same signature, sets `available_at = now`); `worker.ts#processDue(): Promise<number>` handles every `pending` row with `available_at <= now`, oldest first, running the channel's handler and setting `delivered` in one transaction, and returns how many it delivered; `startWorker` moves to `worker.ts`. The handler table lives in `worker.ts` (`order.new` → receipt, `order.approval` → `decideBatch`), so a freshly imported worker can deliver without registration (C-0246). A throwing handler rolls back, records `error`, and leaves the row `pending` with `available_at` pushed 30 s later. Status check becomes `pending | delivered | failed`; migration `0006`. Modules on the worker's import path import only `db` from `db/client` (C-0246 mocks the module as `{ db }`). `services/messages/` is deleted and its two importers updated.
- P2. **Receipt then rule, one transaction.** `receiveOrder(doc)` (SD1): insert order, insert workflow PENDING, then `autoApproves(locale, totalHundredths)` from `services/orders/approval.ts`; when true, `applyDecision(tx, orderId, "APPROVED")`. Rule: en_US and total < 50000, or ja_JP and total < 5000000; everything else false (R-0021, R-0022).
- P3. **Decisions.** `services/orders/decide.ts`: `toApprovalXml(entries)`, `readApprovalBatch(xml)` (root `OrderApproval`, one or more `Order` with `OrderId`, `OrderStatus` as free text, `fast-xml-parser`), `applyDecision(tx, orderId, status)` (changes a PENDING workflow to APPROVED or DENIED, leaves anything else), `decideBatch(xml, exec?)` (reads and applies every entry in one transaction). Supplier purchase orders and `notify.approval` are order-fulfillment's and customer-notifications' additions to `applyDecision`; this change sends neither.
- P4. **Admin routes**, each `requireAdmin`: `GET /api/admin/orders?status=` (SD7, ordered by order id); `POST /api/admin/orders/decisions` body `{ decisions: [{ orderId, status }] }` → one `order.approval` message, `202 {}`; an empty or malformed body is 400 and enqueues nothing (R-0136).
- P5. **Charts (SD9).** Add `recharts`. `GET /api/admin/sales/revenue?start&end` and `GET /api/admin/sales/order-count?start&end` (ISO dates) return `[{ key, label, value }]` per category over orders dated in the range. The tool draws revenue as a pie and order count as a bar chart, each with its own Start date / End date text fields (MM/DD/YYYY, default 01/01/2001 to 12/31/2002, sent as ISO) and Submit. A chart reply that is not an array draws an empty chart.
- P6. **Tool page** `src/pages/admin/tool.tsx` (route `/admin/tool`), split into `src/components/admin/` parts. One request-state value `{ busy: "retrieve" | "update" | null }` disables Approve, Deny, Commit, both Submits, Refresh, About and Exit, and shows the matching status line (R-0083). Load on mount and on Refresh: four `GET /api/admin/orders?status=` calls plus both charts (R-0086). Marks are page state keyed by order id; Approve/Deny apply to the ticked rows; Commit posts every mark in one request, then reloads (R-0088). Exactly one button each matches Approve, Deny, Refresh, Commit (the locked tests use strict role queries). Tabs use `@headlessui/react` `Tab`.

### Phases

1. Messaging move and migration (P1), with project unit tests updated from `done` to `delivered`.
2. Approval rule and receipt (P2), decision document and step (P3).
3. Admin routes (P4, P5).
4. Tool page (P6) against the mockups and SD3 to SD5.
5. **Test harness.** Colocated unit/integration tests per the AGENTS.md table: `services/orders/approval.test.ts`, `services/orders/decide.test.ts`, `services/messaging/worker.test.ts`, route tests under `routes/api/admin/orders/` and `routes/api/admin/sales/`, `src/pages/admin/tool.test.tsx`. The locked suite under `tests/acceptance/order-approval/` is not edited.
6. **E2E.** `e2e/order-approval.spec.ts` (task 6.1): an en_US order above 500 stays pending, the administrator approves and commits it, and after Refresh it is in the non-pending view as APPROVED. It runs against the real worker in the Playwright server.
7. **CI.** No workflow change: the existing CI runs lint, typecheck, unit, Playwright and the locked acceptance tiers on `vortex/**` pushes and pull requests, and picks up the new specs and tests by path.
