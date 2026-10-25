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

Pass files are under `legacy-analysis/ir/_passes/legacy-source/petstore1.3.2/`. Record keys collide across modules (F1), so each key is qualified by the pass file whose text matches the current-run IR record the requirement key was minted for. `spec.md` carries exactly the 28 approved records; every other record of this capability is pending and Not specified, and has a recommendation in `legacy-analysis/ir/_recommendations/order-fulfillment.yaml`.

| Requirement (spec.md)                                     | ID           | Record (pass file)                       |
| --------------------------------------------------------- | ------------ | ---------------------------------------- |
| Asynchronous hand-off from storefront to order processing | SWHR2-R-0098 | ORDER-FULFILLMENT-INT-0002 (docs/c)      |
| Staged order processing                                   | SWHR2-R-0100 | ORDER-FULFILLMENT-WF-0002 (docs/b)       |
| Fulfilment message channels                               | SWHR2-R-0109 | order-fulfillment-INT-0001 (setup.xml/a) |
| One workflow record per order                             | SWHR2-R-0142 | ORDFUL-ENT-0001 (processmanager/a)       |
| Starting an order workflow                                | SWHR2-R-0107 | ORDFUL-REQ-0001 (processmanager/a)       |
| Reading an order status                                   | SWHR2-R-0108 | ORDFUL-REQ-0003 (processmanager/a)       |
| Order lifecycle                                           | SWHR2-R-0024 | ORDFUL-WF-0001 (processmanager/a)        |
| Order status tracking                                     | SWHR2-R-0096 | OFUL-ENT-0003 (opc/a)                    |
| Configurable stage hand-off                               | SWHR2-R-0106 | ORDFUL-INT-0001 (processmanager/a)       |
| Order message processed as one unit                       | SWHR2-R-0140 | OFUL-REQ-0004 (opc/a)                    |
| Order line record                                         | SWHR2-R-0090 | FUL-ENTITY-0001 (purchaseorder/b)        |
| Dependent records removed with a purchase order           | SWHR2-R-0091 | FUL-RULE-0003 (purchaseorder/b)          |
| Supplier order identity                                   | SWHR2-R-0101 | ORDF-BR-0001 (supplierpo/a)              |
| New supplier order is pending                             | SWHR2-R-0102 | ORDF-BR-0002 (supplierpo/a)              |
| Supplier order status vocabulary                          | SWHR2-R-0023 | ORDF-BR-0003 (supplierpo/a)              |
| Supplier order lines start unshipped                      | SWHR2-R-0103 | ORDF-BR-0004 (supplierpo/a)              |
| Supplier order contact and lines belong to the order      | SWHR2-R-0104 | ORDF-BR-0005 (supplierpo/a)              |
| Listing supplier orders by status                         | SWHR2-R-0141 | ORDF-REQ-0001 (supplierpo/a)             |
| Atomic supplier order creation                            | SWHR2-R-0105 | ORDF-REQ-0002 (supplierpo/a)             |
| Supplier order document content                           | SWHR2-R-0138 | FUL-ENT-0001 (xmldocuments/a)            |
| Supplier document mandatory fields                        | SWHR2-R-0094 | OF-BR-0004 (xmldocuments/b)              |
| Supplier document dates                                   | SWHR2-R-0137 | FUL-BR-0006 (xmldocuments/a)             |
| Supplier document format identification and resolution    | SWHR2-R-0139 | FUL-INT-0007 (xmldocuments/a)            |
| Published document format catalog                         | SWHR2-R-0093 | FULF-INT-0004 (opc/b)                    |
| Supplier receives purchase orders by message              | SWHR2-R-0097 | OFUL-INT-0001 (supplier/a)               |
| Purchase order receipt as one unit of work                | SWHR2-R-0095 | OFUL-BR-0006 (supplier/b)                |
| Re-fulfilment after an inventory change                   | SWHR2-R-0099 | ORDER-FULFILLMENT-WF-0001 (docs/c)       |
| Supplier invoice accepted by order processing             | SWHR2-R-0092 | FULF-INT-0002 (opc/b)                    |

Legacy rules not yet approved, and so absent from `spec.md` even though the implementation notes above describe them: whole-line fulfilment from supplier stock, supplier order completion, item with no stock record, shipment invoice content, invoice publication, applying an invoice to the customer order and customer order completion (supplier/a, supplier/b, purchaseorder/a, purchaseorder/b); status update, internal-only access and atomic status operations (processmanager); line immutability and line snapshot (lineitem); contact element order (contactinfo/b); schema-mode ranges, item uniqueness, invoice document and inbound type check (xmldocuments). These are Not specified until an SME approves them.

### Synthesis choices

- **Duplicate record keys resolved against the platform IR.** Where one key appears in several pass files (FUL-ENT-0001, OF-BR-0004, OFUL-INT-0001, ORDFUL-ENT-0001, ORDER-FULFILLMENT-WF-0001, ORDER-FULFILLMENT-WF-0002, order-fulfillment-INT-0001), the requirement is written from the variant whose text matches the current-run approved IR record; the other variants are separate records awaiting review.
- **Lifecycle vs. status store.** The lifecycle (PENDING -> APPROVED -> SHIPPED_PART -> COMPLETED | DENIED) exists only in the `OrderStatusNames` javadoc; `ProcessManagerEJB.updateStatus` writes any string without a transition or value check. The only guard in code is `OrderApprovalMDB` skipping orders that are not PENDING (`OrderApprovalMDB.java:201-207`), which the "Order status tracking" scenarios state. Whether the rebuild enforces the whole lifecycle is a defect-register decision.
- **Atomic supplier order creation.** `CreateException` is an application exception, so in the legacy code the rollback of partial rows depends on the caller marking the transaction; the approved requirement states the all-or-nothing outcome.
- **Restock notification.** The approved record (ORDER-FULFILLMENT-WF-0001, docs/c) follows the documentation, which says order processing is notified of inventory changes; see conflict C2.

## Risks / Trade-offs

### Cross-source conflicts

- **C1: Two status vocabularies.** OPC workflow uses 5 statuses; the supplier order uses 4 (no SHIPPED_PART), and the supplier's documented PENDING -> APPROVED -> COMPLETED path is never followed in code (PENDING -> COMPLETED directly). Goes to Intent: which vocabulary a supplier order should carry.
- **C2: Docs vs. code on restock.** `docs/using.html:290-293` says the supplier "notifies the OPC about the changes to the inventory". The code re-runs pending supplier orders inside the supplier and publishes invoices; no inventory-change message to OPC was found. The approved requirement (SWHR2-R-0099) states the documented notification; the code behaviour is in the pending records OFUL-WF-0002 (supplier/b). Goes to Intent for the Business Owner: whether order processing must be notified of inventory changes.
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

## Target design

### Components

- **Message channels** `services/messaging/` replace the legacy broker with a persisted outbox in the same SQLite database (PRD constraints).
  - `enqueue(tx, channel, payload)` inserts into `messages` inside the caller's transaction, so a step's outbound messages commit or roll back with its state changes (SWHR2-R-0140).
  - A channel is point-to-point, with one row consumed by one handler, or publish/subscribe. For a publish/subscribe channel, `enqueue` writes one row per registered subscriber (SWHR2-R-0109).
  - The channels are `order.new`, `order.approval`, `supplier.purchase-order` and `supplier.inventory-changed`, which are point-to-point, and `supplier.invoice`, which is publish/subscribe. The invoice subscribers are `order-processing.invoice` and `notify.shipment` (customer-notifications).
  - Channels are registered in code, so they exist as soon as the migrations have run (SWHR2-R-0109.01). The module has no HTTP route (sign-on SWHR2-R-0121).
- **Worker** `plugins/message-worker.ts`, a Nitro plugin that starts with the server. For each channel and subscriber, it polls `messages` for rows that are due and runs each one in a single transaction: run the handler, then mark the row delivered. If the handler throws, the transaction rolls back, `attempts` is incremented and `available_at` is pushed back with backoff, so the message is retried (SWHR2-R-0140, SWHR2-R-0095). Rows survive a restart because they are in SQLite (SWHR2-R-0109.03).
- **Stage transitions** `services/orders/transitions.ts` (SWHR2-R-0106). A configuration map (`ORDER_TRANSITIONS`, defaulting to the outbox transitions) names, per step, the transition that receives the step's outbound message, its batch of messages, or both, and hands them to the next channel. Requesting a name that is not registered or cannot be constructed throws `TransitionError` with the underlying `cause`.
- **Order processing**:
  - **Receipt** (checkout) starts the workflow record with the caller-supplied initial status, PENDING. A second start for the same order id fails and leaves the record unchanged (SWHR2-R-0107).
  - **Approval** (order-approval) moves PENDING to APPROVED or DENIED only. An APPROVED order is turned into a `TPA-SupplierOrder` document and enqueued on `supplier.purchase-order`. A PENDING or DENIED order is never sent (SWHR2-R-0100.02).
  - **Invoice handling** (`order-processing.invoice` subscriber) accepts only an `Invoice` root, rejecting any other document such as a supplier order (SWHR2-R-0092). It adds each `(itemId, quantityShipped)` to the order's line items. The workflow becomes SHIPPED_PART while lines remain unshipped and COMPLETED when every line is fully shipped (SWHR2-R-0024, SWHR2-R-0096). At COMPLETED it enqueues `notify.completed` (customer-notifications).
  - `getOrderStatus(orderId)` returns the status, or fails with `NotFound` (SWHR2-R-0108).
  - The statuses run PENDING → APPROVED → SHIPPED_PART → COMPLETED, or PENDING → DENIED, with DENIED and COMPLETED as end states (SWHR2-R-0024).
- **Supplier**:
  - **Purchase order step**, the consumer of `supplier.purchase-order` (SWHR2-R-0097). It validates the document, then translates `TPA-SupplierOrder` into the internal supplier order (shipping address and lines) with the stylesheet `services/supplier/tpa-supplier-order.xsl`. In one transaction it creates the supplier order in PENDING with its contact and lines, each line copied from the incoming document with `quantity_shipped = 0` (SWHR2-R-0102, SWHR2-R-0103, SWHR2-R-0105). It then fulfils.
  - **Fulfil** ships every unshipped line whose item's stock covers the line quantity, decrements `sup_inventory`, and publishes one invoice for that shipment on `supplier.invoice`. The supplier order becomes COMPLETED when all its lines are shipped. Receipt, recording, fulfilment and invoice publication form one unit, so a failed publish records nothing, consumes no stock and redelivers the message (SWHR2-R-0095).
  - **Re-fulfilment**, the consumer of `supplier.inventory-changed` (SWHR2-R-0099), runs fulfil for every PENDING supplier order. The invoices it publishes are how order processing is notified and re-examines the waiting orders. An order still short of stock stays not completed.
  - `listSupplierOrders(status)` returns each matching order once (SWHR2-R-0141).
- **Documents** `services/documents/`:
  - The supplier order document carries, in order, the order id, the order date, the shipping address (first name, last name, street, city, state, country, zip, e-mail, phone) and one or more line items (SWHR2-R-0138).
  - The invoice carries the order id, the user id, the shipping date and the shipped lines.
  - The builders refuse to produce a document with a missing order id, user id or date. A missing address field is written as empty (SWHR2-R-0094).
  - Dates are written as `YYYY-MM-DD` (SWHR2-R-0137).
  - Documents are UTF-8. The format is identified by DTD public identifier by default, or by namespace when `DOC_FORMAT_MODE=xsd` (SWHR2-R-0139).
  - Format definitions resolve from the deployment catalog (`DOC_CATALOG_PATH`) first, then the built-in catalog `services/documents/catalog.xml`, and only then the network location (SWHR2-R-0139).
  - Validation rejects a supplier order with no line items (SWHR2-R-0138.02).
- **Published format catalog**: `routes/schemas/catalog.xml.get.ts` serves a catalog that maps the supplier order, invoice and line item type identifiers to absolute schema URLs built from the server's own address. The DTD and XSD files are served from `public/schemas/` (SWHR2-R-0093). This route needs no authorisation, because it publishes formats only.

### Data

These tables are in `db/schema/order-processing.ts`, `db/schema/supplier.ts` and `db/schema/messaging.ts`, and building them produces one new drizzle-kit migration in `drizzle/`.

- `op_order_workflow`: `order_id` text primary key (one record per order, SWHR2-R-0142) and `status` text not null, with `CHECK` over PENDING, APPROVED, DENIED, SHIPPED_PART and COMPLETED.
- The order line items are `op_po_line_items` (checkout), holding category, product, item, line number, quantity, unit price and `quantity_shipped` starting at 0 (SWHR2-R-0090). Deleting an `op_purchase_orders` row cascades to its contact, card and line items (SWHR2-R-0091).
- `sup_orders`: `order_id` text primary key, so a duplicate is rejected (SWHR2-R-0101).
  - `status` with `CHECK` over PENDING, APPROVED, DENIED and COMPLETED, default PENDING (SWHR2-R-0023, SWHR2-R-0102).
  - `order_date` and `user_id`.
- `sup_order_contacts`: `order_id` primary key, referencing `sup_orders` with `ON DELETE CASCADE`, holding the name and address fields, e-mail and phone. `sup_order_lines`: `(order_id, line_number)` primary key, cascade (SWHR2-R-0104).
- `messages`: `id`, `channel`, `subscriber` (nullable), `payload` text, `status` (pending or delivered), `attempts`, `available_at` and `created_at`, indexed on `(channel, subscriber, status, available_at)`.

### Interfaces

- No HTTP route except `GET /schemas/catalog.xml` and the static schema files. Every hand-off is in-process through `enqueue` and the worker.
- `order.new`: `PurchaseOrder` XML.
- `order.approval`: the approval document XML.
- `supplier.purchase-order`: `TPA-SupplierOrder` XML.
- `supplier.invoice`: `Invoice` XML.
- `supplier.inventory-changed`: JSON `{ itemIds }`.

### Stack choices

- A Nitro plugin (`plugins/`) for the in-process worker, and Drizzle ORM over SQLite for the outbox. Both follow the PRD assumption that durable, retried delivery is met by a persisted table inside the monolith instead of JMS. A single server process (`ecosystem.config.js`, `instances: 1`) means one worker.
- `fast-xml-parser` for building and parsing documents (checkout).
- `xslt-processor`, a pure JavaScript XSLT 1.0 engine, to run the TPA-to-supplier-order stylesheet.
- `xmllint-wasm`, libxml2 compiled to WebAssembly, for DTD and XSD validation with a local catalog resolver. No native module is needed under Bun.

  These three XML dependencies are assumed, because the pinned stack names none.

- Tests: unit tests for the document builders (mandatory fields, empty address fields, date format, DTD and XSD modes, catalog precedence); worker tests proving rollback and retry on a failed publish, and pub/sub delivery to both invoice subscribers; an end-to-end service test of a two-shipment order reaching COMPLETED after a restock.
