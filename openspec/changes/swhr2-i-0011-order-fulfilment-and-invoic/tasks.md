## 1. Order workflow status

- [ ] 1.1 Define the order workflow record keyed uniquely by order id with a single current status
- [ ] 1.2 Implement starting a workflow with a caller-supplied initial status and duplicate refusal
- [ ] 1.3 Implement reading an order's status with a not-found error for unknown order ids
- [ ] 1.4 Define the five-value order status vocabulary and the PENDING -> APPROVED -> SHIPPED_PART -> COMPLETED | DENIED lifecycle
- [ ] 1.5 Apply approval decisions only to PENDING orders and set SHIPPED_PART or COMPLETED when shipments are recorded

## 2. Order lines and purchase orders

- [ ] 2.1 Define the order line record with category, product, item, line number, quantity, unit price and quantity shipped
- [ ] 2.2 Initialise every line's quantity shipped to zero when an order is first stored
- [ ] 2.3 Remove contact, address, credit card record and lines when a purchase order is deleted

## 3. Supplier orders

- [ ] 3.1 Enforce unique supplier order identifiers and reject duplicate creation
- [ ] 3.2 Set every new supplier order's status to PENDING
- [ ] 3.3 Define the four-value supplier order status vocabulary
- [ ] 3.4 Copy incoming line fields onto new supplier order lines with shipped quantity zero
- [ ] 3.5 Create a supplier order, its shipping contact and its lines in one transaction that fails as a whole
- [ ] 3.6 Remove shipping contact, its address and lines when a supplier order is deleted
- [ ] 3.7 Implement listing supplier orders by status, each matching order once

## 4. Supplier documents

- [ ] 4.1 Build the supplier order document with identifier, order date, nine-field shipping address and one or more lines
- [ ] 4.2 Refuse documents missing an order identifier, user identifier or date; write missing address fields as empty
- [ ] 4.3 Write order and shipping dates as year-month-day without time of day
- [ ] 4.4 Encode documents as UTF-8 and identify format by public identifier (default) or namespace
- [ ] 4.5 Resolve format definitions from the local catalog first, with a deployment catalog overriding the built-in one
- [ ] 4.6 Publish the document format catalog with absolute schema locations on the server's own address

## 5. Messaging and stage hand-off

- [ ] 5.1 Provision durable new-order and supplier purchase-order channels and the publish/subscribe invoice channel
- [ ] 5.2 Hand submitted storefront orders to order processing asynchronously
- [ ] 5.3 Implement the configurable stage hand-off for single and batch messages with cause-preserving load failure
- [ ] 5.4 Process each order, approval batch, invoice and notification message all-or-nothing with retry on failure

## 6. Supplier fulfilment

- [ ] 6.1 Consume purchase orders from the supplier channel and convert them into internal supplier orders
- [ ] 6.2 Treat receipt, recording, fulfilment and invoice publication of a purchase order as one unit with redelivery on failure
- [ ] 6.3 Fulfil approved orders in stages, possibly in several shipments, invoicing order processing per shipment
- [ ] 6.4 On an inventory change, notify order processing, re-examine waiting orders and complete those now fulfillable

## 7. Invoice receipt

- [ ] 7.1 Read supplier invoices into order id and per-item shipped quantities
- [ ] 7.2 Reject invoice-channel documents whose root is not an invoice
