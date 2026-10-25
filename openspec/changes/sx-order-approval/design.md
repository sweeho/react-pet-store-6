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
