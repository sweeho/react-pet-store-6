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

## Planning (SWHR2-S-0029)

Ticket: SWHR2-T-0304 (FEATURE) owns every task group. The locked acceptance suite `tests/acceptance/order-fulfillment/` (harness `harness.ts`) fixes module paths, function names, table and column names and input shapes that the Target design above does not state. Where the two differ, the locked suite wins, and each difference is listed under Spec discrepancies. Case SWHR2-C-0136 is deferred to customer-notifications (SD4).

### Codebase findings

- F1. **Order-processing tables exist** (`db/schema.ts`, from checkout and order approval):
  - `op_purchase_orders` holds the header and billing address. It cascades to `op_po_contacts` (shipping), `op_po_cards` and `op_po_line_items`.
  - `op_po_line_items` already carries category, product, item, line number, quantity, unit price (hundredths) and `quantity_shipped` default 0.
  - `op_order_workflow (order_id PK, status)` has **no** status CHECK.
  - The schema is a single `db/schema.ts`. The latest migration is `0007_nebulous_boomerang.sql`, so this change adds `0008`.
- F2. **Outbox:**
  - The `messages` table has `id, channel, payload, status (pending|delivered|failed), error, created_at, available_at`, and no `subscriber` or `attempts` column.
  - `services/messaging/index.ts#enqueue(exec, channel, payload)` writes one row.
  - `services/messaging/worker.ts` holds the handler table (`order.new`, `order.approval`) and `processDue()`. It runs handler plus `delivered` in one transaction; on failure it records `error` and pushes `available_at` 30 s out. It skips channels with no handler.
  - `plugins/order-worker.ts` starts it outside Vitest.
- F3. **Receipt and decision:**
  - `services/orders/receive.ts#receivePurchaseOrder(tx, po)` inserts the order, inserts the workflow PENDING directly, then auto-approves through `services/orders/decide.ts#applyDecision(tx, orderId, status)`.
  - `applyDecision` changes PENDING to APPROVED/DENIED only and enqueues nothing.
  - `createPurchaseOrder(exec, po)` and `getPurchaseOrder(orderId)` exist.
- F4. **Supplier side:** `services/supplier/inventory.ts` exports `reduceStock(exec, itemId, quantity): boolean`, `updateInventory` and `INVENTORY_CHANGED_CHANNEL`, and every stock update enqueues `supplier.inventory-changed` `{ itemIds }`. These are not consumed yet. No `sup_orders*` table exists.
- F5. **Documents:** `services/documents/purchase-order.ts` (`toXml`/`fromXml`, `fast-xml-parser`) is the only document module. No `public/schemas/` or `routes/schemas/` exist.
- F6. **Locked contracts** (`harness.ts`, the four test files):
  - `services/orders/workflow`: `startWorkflow(exec, orderId, status)`, `getOrderStatus(orderId)`.
  - `services/orders/invoice`: `readInvoice(xml)` → `{ orderId, shipped | lines }`, `handleInvoice(xml)`.
  - `services/orders/transitions`: `ORDER_TRANSITIONS`, `registerTransition(name, { batch?, single? })`, `handOff(step, messages)`, `TransitionError` with `cause`.
  - `services/supplier/orders`: `createSupplierOrder(exec, input)`, `listSupplierOrders(status)`.
  - `services/supplier/fulfil`.
  - `services/documents/supplier-order`: `buildSupplierOrder(input)`, `validateSupplierOrder(xml)` → `{ valid }`.
  - `services/documents/invoice`: `buildInvoice({ orderId, userId, shippingDate, lines })`.
  - `services/documents/catalog#resolveFormat(id)`.
  - `routes/schemas/catalog.xml.get`.
  - `messages.subscriber` and `messages.attempts`.
  - Tables `sup_orders (order_id, status, order_date, user_id)`, `sup_order_contacts`, `sup_order_lines (… item_id, quantity, unit_price, quantity_shipped)`.
  - Invoice subscriber name `order-processing.invoice`.
  - The input shape is the harness's `supplierOrder()`: `orderDate` ISO date-time, `shipping` nine fields, `lines` with `unitPrice` in hundredths.
- F7. **Baseline:** in the locked suite 1 of 44 passes (C-0118, already met by checkout). The other 43 fail at harness import because the modules in F6 do not exist.

### Spec discrepancies

- SD1. **Schema files.** The Target design splits tables over `db/schema/order-processing.ts`, `supplier.ts` and `messaging.ts`, and describes `messages` without `error`. The repository has one `db/schema.ts` and an `error` column (F1, F2). Built: new tables and the two new `messages` columns go into `db/schema.ts`, and `error` stays.
- SD2. **Worker plugin.** The Target design names `plugins/message-worker.ts`; `plugins/order-worker.ts` already starts the worker. Built: the existing plugin is kept, and only its comment changes.
- SD3. **XML stack.** The Target design assumes `xslt-processor` (TPA → supplier order stylesheet) and `xmllint-wasm` (DTD/XSD validation). The locked cases need neither:
  - C-0140 needs a document with no line item to fail the format check.
  - C-0141 needs a `DOCTYPE … PUBLIC`.
  - C-0142 needs local catalog resolution.

  Built: no new dependency. The supplier order document is built and read with `fast-xml-parser`, as checkout's is. `validateSupplierOrder` is a structural check of the DTD's content model: required elements in order, and one or more `LineItem`. The DTD and XSD files are still published under `public/schemas/` for the catalog (R-0093).

- SD4. **Second invoice subscriber.** R-0109.02 and C-0136 need the `notify.shipment` subscriber, and C-0136 builds its app with customer-notifications' harness (`services/notifications/*`), which change `swhr2-i-0012-customer-notifications` builds. C-0136 is deferred to SWHR2-I-0012.
  - The publish/subscribe mechanism is built here: a channel's subscriber list, one row per subscriber.
  - `supplier.invoice` lists only `order-processing.invoice` in this change, and customer-notifications appends `notify.shipment`.
  - The FEATURE's own worker test proves fan-out with a test subscriber.
- SD5. **Completion e-mail.** The Target design enqueues `notify.completed` at COMPLETED. That channel is customer-notifications'; this change enqueues nothing for it.
- SD6. **Supplier order vocabulary (C1).** The four values are enforced by CHECK (R-0023). As in the legacy code, a supplier order goes PENDING → COMPLETED when its last line ships. This change never sets APPROVED or DENIED.
- SD7. **Restock notification (C2).** R-0099 says order processing is notified of an inventory change. Built: the invoices that re-fulfilment publishes are that notification. There is no separate inventory message to order processing.
- SD8. **Lifecycle enforcement.** The legacy status store accepts any transition. Built, in `services/orders/workflow.ts`:
  - `op_order_workflow.status` gets a CHECK over the five values (a table rebuild in `0008`; stored values are already within them).
  - Every status write goes through one transition guard: PENDING → APPROVED | DENIED, APPROVED → SHIPPED_PART | COMPLETED, SHIPPED_PART → COMPLETED. Any other write is ignored.
  - An invoice for an order that is not APPROVED or SHIPPED_PART changes nothing and is consumed (C-0105). A document on the invoice channel that is not an `Invoice` throws, so its row stays pending with `attempts` raised (C-0109). There is no dead-letter state; see Risks.
- SD9. **Over-shipment and duplicate item lines** (legacy defect). An invoice's quantity for an item is applied to that item's lines in line-number order, and each line is capped at its ordered quantity. An order completes when every line's `quantity_shipped` equals its `quantity`.
- SD10. **Money in documents.** Stored unit prices are hundredths (C-0126: 1650). Documents carry the decimal (`16.50`), and readers convert back.

### Decisions

- P1. **Outbox** (`services/messaging/`, migration `0008`).
  - `messages` gains `subscriber text` (nullable) and `attempts integer not null default 0`.
  - `index.ts` keeps `enqueue(exec, channel, payload)`. It adds `SUBSCRIBERS: Record<string, string[]>` (`supplier.invoice` → `["order-processing.invoice"]`), and for a channel listed there it writes one row per subscriber; any other channel gets one row with `subscriber` null.
  - `worker.ts` resolves a row's handler by `channel` or by `channel` + `subscriber`. It registers `order.new`, `order.approval`, `supplier.purchase-order`, `supplier.inventory-changed` and `supplier.invoice`/`order-processing.invoice` in its own table, so a freshly imported worker can deliver (C-0137).
  - A failed delivery increments `attempts`, records `error`, and leaves the row `pending` 30 s later.
- P2. **Workflow** `services/orders/workflow.ts`:
  - `ORDER_STATUSES`.
  - `startWorkflow(exec, orderId, status)`: an insert, so a second start for the same id throws and changes nothing.
  - `getOrderStatus(orderId)`: throws a not-found error carrying `status: 404` for an unknown id.
  - `setStatus(exec, orderId, to): boolean`: the transition guard of SD8.

  `receivePurchaseOrder` uses `startWorkflow`; `applyDecision` and invoice handling use `setStatus`.

- P3. **Approval to supplier.** When `applyDecision` moves an order to APPROVED, it reads the stored purchase order, builds the supplier order document from the shipping contact and lines, and hands it off through `handOff("approval", [xml], tx)`. The default transition enqueues it on `supplier.purchase-order` in the same transaction, so a failed enqueue rolls back the approval and the batch is retried (R-0140, C-0143). This applies to auto-approval at receipt as well, and a PENDING or DENIED order is never sent (C-0123).
- P4. **Transitions** `services/orders/transitions.ts`:
  - `ORDER_TRANSITIONS` (step → transition name; the default `approval` maps to `outbox:supplier.purchase-order`).
  - `registerTransition(name, { single?, batch? })`.
  - `handOff(step, messages, exec?)` is synchronous. It calls `batch(messages)` when the transition has one, otherwise `single` per message.
  - An unknown or failing name throws `TransitionError` (`name` = "TransitionError", `message` naming the transition, `cause` the underlying error).
- P5. **Documents** `services/documents/`:
  - `supplier-order.ts`: `buildSupplierOrder(input)` writes a UTF-8 declaration and `<!DOCTYPE SupplierOrder PUBLIC "…" "…">`, or the namespace form when `DOC_FORMAT_MODE=xsd`. The elements are OrderId, OrderDate (`YYYY-MM-DD`), ShippingAddress (FirstName, LastName, Street, City, State, Country, ZipCode, Email, Phone; missing fields empty) and one `LineItem` per line. A missing order id, user id or date throws. It also exports `readSupplierOrder(xml)` and `validateSupplierOrder(xml)` → `{ valid, errors }` (SD3).
  - `invoice.ts`: `buildInvoice` and `readInvoiceDocument`, which rejects a non-`Invoice` root.
  - `catalog.ts`: `resolveFormat(id)` looks in `DOC_CATALOG_PATH` first, then the built-in `services/documents/catalog.xml`, and fetches only when neither has the id.
  - The route `routes/schemas/catalog.xml.get.ts` maps SupplierOrder, Invoice and LineItem to `<request origin>/schemas/<file>` and serves XML, with no guard. `public/schemas/` holds the DTD and XSD files.
- P6. **Supplier orders** (`services/supplier/orders.ts`, migration `0008`).
  - Tables:
    - `sup_orders (order_id PK, status CHECK 4 values default 'PENDING', order_date text YYYY-MM-DD, user_id)`.
    - `sup_order_contacts`, with `order_id` as PK and a cascading FK, plus the nine address fields.
    - `sup_order_lines`, with PK `(order_id, line_number)` and a cascading FK. `category_id`, `product_id`, `item_id`, `quantity` and `unit_price` are NOT NULL, and `quantity_shipped` defaults to 0.
  - `createSupplierOrder(exec, input)` writes all three in one transaction (C-0128).
  - `listSupplierOrders(status)` returns `{ orderId, … }` once per order.
- P7. **Fulfilment** `services/supplier/fulfil.ts`:
  - `receiveSupplierPurchaseOrder(tx, xml)` is the `supplier.purchase-order` handler. It reads the document, creates the supplier order and fulfils it in the delivery transaction.
  - `fulfilOrder(tx, orderId)` ships each unshipped line for which `reduceStock` succeeds, sets that line's `quantity_shipped`, and when any line shipped enqueues one invoice of the shipped lines on `supplier.invoice`. When every line is shipped, it sets the supplier order COMPLETED.
  - `refulfil(tx, payload)` is the `supplier.inventory-changed` handler and runs `fulfilOrder` for every PENDING supplier order.
  - A failed invoice enqueue rolls the whole delivery back (C-0113).
- P8. **Invoice receipt** `services/orders/invoice.ts`:
  - `readInvoice(xml)` returns `{ orderId, lines: [{ itemId, quantity }], shipped: { [itemId]: quantity } }` and throws on a non-invoice.
  - `handleInvoice(xml, exec?)` applies an invoice in one transaction per SD8/SD9: SHIPPED_PART while any line is short, COMPLETED when none is.
  - It is registered as the `order-processing.invoice` subscriber.

### Risks

- A malformed document on a channel is retried every 30 s for ever, because the outbox has no dead-letter state. This is acceptable for one process and an internal producer; a later change can add a `failed` cutoff using `attempts`.
- `notify.shipment` rows do not exist until customer-notifications registers the subscriber, so invoices published before that change ships never produce a shipment e-mail.

### Phases

1. Schema and migration `0008` (P1 columns, workflow CHECK rebuild, `sup_*` tables); the outbox subscriber fan-out and attempts (P1). Groups 1, 3, 5.1.
2. Workflow module and transition guard (P2); receipt and decision rewired (P3); transitions (P4). Groups 1, 2, 5.2–5.4.
3. Documents and catalog route (P5). Group 4.
4. Supplier orders, fulfilment and re-fulfilment (P6, P7); invoice receipt (P8). Groups 3, 6, 7.
5. **Test harness.** Colocated tests per the AGENTS.md table:
   - `services/orders/workflow.test.ts`, `services/orders/invoice.test.ts`, `services/orders/transitions.test.ts`.
   - `services/messaging/worker.test.ts`: fan-out to two subscribers, attempts and retry, restart.
   - `services/documents/supplier-order.test.ts`, `services/documents/invoice.test.ts`, `services/documents/catalog.test.ts`.
   - `services/supplier/orders.test.ts`, `services/supplier/fulfil.test.ts`: the two-shipment order completing after a restock.
   - `routes/schemas/catalog.xml.test.ts`.
   - Existing tests updated where `applyDecision` now enqueues: `services/orders/decide.test.ts`, `approval.test.ts`, `receive.test.ts`.
   - The locked suite under `tests/acceptance/**` is not edited.
6. **E2E.** There is no screen. `e2e/order-approval.spec.ts` keeps passing, now with fulfilment running behind it in the Playwright server's worker. No new Playwright spec, because the fulfilment flow is covered end to end by the service tests in phase 5.
7. **CI.** No workflow change. The existing CI runs lint, typecheck, unit, Playwright and the locked acceptance tiers on `vortex/**` pushes and pull requests, and picks up the new tests by path.
