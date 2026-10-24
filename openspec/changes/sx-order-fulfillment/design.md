## Context

This document records how the LEGACY Java Pet Store 1.3.2 implements order fulfilment. It describes no target design: the Architect drafts that once the Product Requirement is approved. Paths are relative to `legacy-source/petstore1.3.2/`.

### Applications and message flow

| Step                                 | Legacy component                                                                                        | Mechanism                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Storefront hands order to OPC        | petstore web tier, `jms/opc/OrderQueue`                                                                 | JMS queue (`setup.xml:102-163`)                                                                     |
| OPC starts workflow (status PENDING) | `apps/opc` `PurchaseOrderMDB` -> `ProcessManagerEJB.createManager`                                      | stateless session bean over CMP entity `ManagerEJB`                                                 |
| OPC approves/denies                  | `apps/opc` `OrderApprovalMDB` (capability `order-approval`)                                             | builds `TPASupplierOrderXDE` document for APPROVED orders (`OrderApprovalMDB.java:248-258`)         |
| OPC sends PO to supplier             | transition delegate -> `jms/supplier/PurchaseOrderQueue`                                                | `TransitionDelegateFactory` loads class by name (`Class.forName`)                                   |
| Supplier receives PO                 | `apps/supplier` `SupplierOrderMDB.onMessage` -> `OrderFulfillmentFacadeEJB.processPO`                   | MDB, CMT `Required` (`ejb-jar.xml:317-339`)                                                         |
| Supplier fulfils                     | `OrderFulfillmentFacadeEJB.processAnOrder` / `checkInventory`                                           | per-line loop; `InventoryLocal.reduceQuantity`                                                      |
| Supplier invoices                    | `createInvoice` -> `SupplierOrderTD` -> `TopicSender`                                                   | publishes TextMessage to `jms/opc/InvoiceTopic`                                                     |
| Restock retry                        | `inventory/web/RcvrRequestProcessor` (screen `updateinventory`) -> `processPendingPO` -> `sendInvoices` | servlet with bean-managed `UserTransaction`                                                         |
| OPC applies invoice                  | `apps/opc` `InvoiceMDB.doWork` -> `PurchaseOrderHelper.processInvoice`                                  | sets `COMPLETED` or `SHIPPED_PART` via `ProcessManagerEJB.updateStatus` (`InvoiceMDB.java:159-171`) |

### Data held by the legacy system

- `Manager` (CMP, `processmanager/src/ejb-jar.xml:52-65`): `orderId` (String PK), `status` (String, unconstrained).
- `SupplierOrder` (CMP, `supplierpo/src/ejb-jar.xml:59-69`): `poId` (String PK, the customer order id), `poDate` (long epoch millis, `NOT NULL` in `apps/supplier/src/sun-j2ee-ri.xml:189`), `poStatus` (String); 1:1 cascade-delete `ContactInfo` -> 1:1 cascade-delete `Address`; 1:N cascade-delete `LineItem`.
- `LineItem` (CMP, `lineitem/src/ejb-jar.xml:57-78`): `categoryId`, `productId`, `itemId`, `lineNumber` (String), `quantity`, `quantityShipped` (int, `NOT NULL`), `unitPrice` (float/REAL `NOT NULL`). Only `setQuantityShipped` is on the local interface.
- Two separate `OrderStatusNames` classes: `processmanager` (5 values incl. `SHIPPED_PART`) and `supplierpo` (4 values, no `SHIPPED_PART`). The supplier only ever assigns PENDING (on create) and COMPLETED.

### Documents

- Internal `SupplierOrder` XML (`supplierpo/.../SupplierOrder.dtd:38-44`, DTD 1.1, validating by default) with `ContactInfo` (`contactinfo/.../ContactInfo.dtd:38`) and `LineItem` (`lineitem/.../LineItem.dtd:38`) element sequences.
- Trading-partner documents in `xmldocuments`: `TPASupplierOrder` (DTD + XSD), `TPAInvoice` (DTD + XSD), `TPALineItem` (six required attributes). DTD mode is the builders' default; XSD mode is a constructor flag driven by deployment env-entries. Only the XSD carries value ranges (`positiveInteger` quantity, `nonNegativeInteger` line number, `positiveDecimal` = minInclusive 0.0 price) and `xsd:unique` on `itemId`.
- Supplier converts `TPASupplierOrder` to internal `SupplierOrder` with `rsrc/xsl/TPASupplierOrder.xsl`, selected from `SupplierOrderStyleSheetCatalog.properties`.
- `CustomEntityResolver` resolves public ids / namespaces from `rsrc/EntityCatalog.properties`, layered under an optional deployment catalog URL.
- `XMLDocumentUtils.checkDocumentType` returns true when the DOCTYPE is absent (workaround for identity transformer dropping DocType).

### Transactions

- `SupplierOrderMDB.onMessage`, `processPO` and the inventory methods are CMT `Required`; every checked exception becomes `EJBException`, so the container rolls back and redelivers.
- All `ProcessManagerEJB` / `ManagerEJB` methods are `Required` (`processmanager/src/ejb-jar.xml:357-390`), joining the calling MDB's transaction.
- The restock path runs the facade inside a servlet `UserTransaction`; invoice publication there uses a non-transacted `AUTO_ACKNOWLEDGE` topic session and errors are only printed.

## User interface

No screen records were extracted for this capability; its user interface is unspecified. The restock trigger is a supplier web request (`RcvrRequestProcessor`, screen `updateinventory`), but the screen itself belongs to the inventory capability's records and is not specified here.

## Goals / Non-Goals

**Goals:**

- State the fulfilment rules the legacy system enforces, with a trace back to the records that justify each.
- Make conflicts and suspected defects visible to the SME and the Business Owner.

**Non-Goals:**

- Target architecture, technology choices or data model for the rebuild.
- Order approval rules, checkout capture, customer e-mail and supplier inventory maintenance (other capabilities).

## Decisions

### Requirement-to-record trace

Pass files are under `legacy-analysis/ir/_passes/legacy-source/petstore1.3.2/`. Record keys collide across modules, so each key is qualified by its pass file.

| Requirement                                       | Records (pass file)                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Staged asynchronous order processing              | ORDER-FULFILLMENT-WF-0002 (docs/a, docs/b), ORDER-FULFILLMENT-INT-0002 (docs/c)                      |
| Fulfilment message channels                       | order-fulfillment-INT-0001 (setup.xml/a), FUL-INT-0001 (setup.xml/b)                                 |
| One workflow status record per order              | ORDFUL-ENT-0001 (processmanager/a), FUL-ENT-0001 (processmanager/b)                                  |
| Order status vocabulary                           | ORDFUL-BR-0001 (processmanager/a), FUL-BR-0001 (processmanager/b)                                    |
| Order lifecycle                                   | ORDFUL-WF-0001 (processmanager/a), FUL-WF-0001 (processmanager/b)                                    |
| Starting an order workflow                        | ORDFUL-REQ-0001 (processmanager/a), FUL-REQ-0001 (processmanager/b)                                  |
| Updating an order status                          | ORDFUL-REQ-0002 (processmanager/a), FUL-BR-0003 (processmanager/b)                                   |
| Reading an order status                           | ORDFUL-REQ-0003 (processmanager/a), FUL-REQ-0002 (processmanager/b)                                  |
| Atomic workflow status operations                 | FUL-REQ-0003 (processmanager/b)                                                                      |
| Internal-only order status operations             | FUL-BR-0004 (processmanager/b)                                                                       |
| Configurable stage hand-off                       | ORDFUL-INT-0001 (processmanager/a), FUL-INT-0001 (processmanager/b)                                  |
| Order line record                                 | order-fulfillment-BR-0001 (lineitem/a), OFUL-BR-0002 (lineitem/b), FUL-ENTITY-0001 (purchaseorder/b) |
| Order line immutability                           | order-fulfillment-BR-0002 (lineitem/a), OFUL-BR-0001 (lineitem/b)                                    |
| Order line snapshot                               | order-fulfillment-REQ-0001 (lineitem/a)                                                              |
| Supplier order record                             | ORDF-ENT-0001 (supplierpo/a), OF-ENT-0001 (supplierpo/b), OFUL-ENT-0001 (supplier/b)                 |
| Supplier order identity                           | ORDF-BR-0001 (supplierpo/a), OF-BR-0001 (supplierpo/b)                                               |
| Initial supplier order state                      | ORDF-BR-0002, ORDF-BR-0004 (supplierpo/a), OF-BR-0002 (supplierpo/b)                                 |
| Supplier order status vocabulary                  | ORDF-BR-0003 (supplierpo/a), OF-WF-0001 (supplierpo/b)                                               |
| Listing supplier orders by status                 | ORDF-REQ-0001 (supplierpo/a), OF-REQ-0001 (supplierpo/b)                                             |
| Atomic supplier order creation                    | ORDF-REQ-0002 (supplierpo/a), OF-BR-0004 (supplierpo/b)                                              |
| Dependent records removed with their order        | ORDF-BR-0005 (supplierpo/a), OF-BR-0003 (supplierpo/b), FUL-RULE-0003 (purchaseorder/b)              |
| Supplier order read-only view                     | OF-REQ-0002 (supplierpo/b)                                                                           |
| Internal supplier order document                  | ORDF-INT-0001 (supplierpo/a), OF-INT-0001 (supplierpo/b)                                             |
| Supplier order date handling                      | ORDF-BR-0006 (supplierpo/a), OF-BR-0005 (supplierpo/b)                                               |
| Contact details in order documents                | FUL-BR-0001, FUL-BR-0002 (contactinfo/b)                                                             |
| Order line exchange element                       | OFUL-INT-0001 (lineitem/b)                                                                           |
| Supplier purchase order document                  | FUL-ENT-0001 (xmldocuments/a), OF-ENT-0001 (xmldocuments/b)                                          |
| Supplier invoice document                         | FUL-ENT-0002 (xmldocuments/a), OF-ENT-0002 (xmldocuments/b)                                          |
| Trading-partner line attributes                   | FUL-BR-0003 (xmldocuments/a), OF-ENT-0003 (xmldocuments/b)                                           |
| Schema-mode line value ranges                     | FUL-BR-0004 (xmldocuments/a), OF-BR-0001 (xmldocuments/b)                                            |
| Schema-mode unique items per document             | FUL-BR-0005 (xmldocuments/a), OF-BR-0002 (xmldocuments/b)                                            |
| Trading-partner document dates                    | FUL-BR-0006 (xmldocuments/a), OF-BR-0003 (xmldocuments/b)                                            |
| Trading-partner document completeness             | OF-BR-0004 (xmldocuments/b)                                                                          |
| Document format identification and resolution     | FUL-INT-0007 (xmldocuments/a), OF-INT-0002 (xmldocuments/b)                                          |
| Inbound document type check                       | FUL-BR-0008 (xmldocuments/a), OF-INT-0001 (xmldocuments/b)                                           |
| Inbound supplier purchase order conversion        | OFUL-INT-0001 (supplier/a), OFUL-INT-0002 (supplier/b)                                               |
| Supplier purchase order receipt                   | OFUL-WF-0001 (supplier/a, supplier/b)                                                                |
| Whole-line fulfilment                             | OFUL-BR-0001 (supplier/a, supplier/b), OFUL-BR-0002 (supplier/b)                                     |
| Supplier order completion                         | OFUL-BR-0002 (supplier/a), OFUL-BR-0003 (supplier/b)                                                 |
| Item with no supplier stock record                | OFUL-BR-0004 (supplier/a), OFUL-BR-0005 (supplier/b)                                                 |
| Shipment invoice content                          | OFUL-BR-0003 (supplier/a), OFUL-BR-0004 (supplier/b)                                                 |
| Re-fulfilment after a stock update                | OFUL-WF-0002 (supplier/b), ORDER-FULFILLMENT-WF-0001 (docs/a, docs/b, docs/c)                        |
| Invoice publication                               | OFUL-INT-0002 (supplier/a), OFUL-INT-0001 (supplier/b)                                               |
| Purchase order receipt as one unit of work        | OFUL-BR-0006 (supplier/b)                                                                            |
| Applying a supplier invoice to the customer order | ORDFUL-BR-0001 (purchaseorder/a), FUL-RULE-0001 (purchaseorder/b)                                    |
| Customer order completion                         | ORDFUL-BR-0001 (purchaseorder/a), FUL-RULE-0002 (purchaseorder/b)                                    |

One record has no requirement of its own: OFUL-BR-0003 (lineitem/b, "no range checks on line quantities or price") states an absence of validation. It is recorded under Risks below and recommended for rejection as a requirement.

### Synthesis choices

- **Lifecycle vs. status store.** The lifecycle (PENDING -> APPROVED -> SHIPPED_PART -> COMPLETED | DENIED) exists only in the `OrderStatusNames` javadoc; `ProcessManagerEJB.updateStatus` writes any string without a transition or value check (FUL-BR-0003). The spec states the documented lifecycle and leaves the unguarded write out of the requirement text. Whether the rebuild enforces the lifecycle is a defect-register decision.
- **Access control.** FUL-BR-0004 says no role check exists (`<unchecked/>` method permissions, local interfaces only). The spec states only the observable property, that the operations are internal-only.
- **Observed defects kept as observed behaviour.** Order line snapshot without shipped quantity, supplier order view with empty contact and no status, accept-on-unreadable-date, and accept-on-absent-DOCTYPE are written as the legacy behaves. Each is also a suspected defect (below); the Business Owner decides whether the rebuild keeps them.
- **Invoice quantity.** The supplier invoices the line's full ordered quantity (it never ships part of a line), and OPC adds the invoiced quantity to `quantityShipped`. The two rules are consistent in the normal path.

## Risks / Trade-offs

### Cross-source conflicts

- **C1: Two status vocabularies.** OPC workflow uses 5 statuses; the supplier order uses 4 (no SHIPPED_PART), and the supplier's documented PENDING -> APPROVED -> COMPLETED path is never followed in code (PENDING -> COMPLETED directly). Goes to Intent: which vocabulary a supplier order should carry.
- **C2: Docs vs. code on restock.** `docs/using.html:290-293` says the supplier "notifies the OPC about the changes to the inventory". The code re-runs pending supplier orders inside the supplier and publishes invoices; no inventory-change message to OPC was found. The spec follows the code.
- **C3: XSD-only constraints.** Value ranges and item uniqueness exist only in the XSDs; the default DTD mode enforces none of them, and the production validation flag values are redacted in this tree. Production behaviour depends on a deployment setting nobody has read.

### Suspected legacy defects touching this capability (from the pass files)

- Stock is reduced and lines marked shipped even when invoice building fails; the shipment is kept but its invoice is lost (`supplier/a`, `supplier/b`; `OrderFulfillmentFacadeEJB.java:199-207`).
- Invoice publish failures on the restock path are swallowed and the inventory update commits (`supplier/a`, `supplier/b`).
- Invoice user id is a fixed salutation "Dear PetStore Customer" (`supplier/a`).
- Status store accepts any status and any transition; no access control on status changes (`processmanager/a`, `processmanager/b`; `supplierpo/b` for supplier order status).
- Transition handler errors can lose their message (`processmanager/b`).
- Over-shipment or duplicate item lines prevent an order from ever completing (exact-equality completion, item-id matching adds the invoiced quantity to every line for that item) (`purchaseorder/a`, `purchaseorder/b`).
- No bounds on quantity, unit price or quantity shipped; shipped can exceed ordered (`lineitem/a`, `lineitem/b`).
- Line snapshot drops shipped quantity; supplier order view drops shipping contact (`lineitem/a`, `lineitem/b`, `supplierpo/a`, `supplierpo/b`).
- Unreadable supplier order date silently replaced with today ("FIX ME!") (`supplierpo/a`, `supplierpo/b`).
- Full supplier order documents, including customer contact details, written to the console/error log (`supplierpo/a`, `supplierpo/b`).
- Schema validation errors are logged, not rejected; documents with no DOCTYPE skip the type check (`xmldocuments/a`, `xmldocuments/b`).
- Unit price carried as single-precision float and written with `Float.toString`; "positiveDecimal" allows zero (`xmldocuments/a`, `xmldocuments/b`).
- E-mail optional on read by a commented-out edit; writing contact details with no address fails with a null error (`contactinfo/b`).
- A supplier order with zero lines would be marked COMPLETED on its first fulfilment attempt (`allItemsAvailable` stays true); entity creation does not require a line (OF-ENT-0001 basis). Only the XML form requires one or more lines.

### Extraction findings

- **F1: Colliding record keys.** 93 records under `order-fulfillment` use 67 distinct keys; e.g. `OFUL-BR-0001` names three different rules (supplier/a, supplier/b, lineitem/b), `FUL-ENT-0001` names a workflow record (processmanager/b) and a document (xmldocuments/a). The server reported 53 ingested records, so some records were likely overwritten at ingest. The recommendations file qualifies each key with its pass file.
- **F2: Redacted configuration.** XML validation env-entry values and the supplier transition delegate class name are redacted in this tree, so validation mode in production cannot be established.
