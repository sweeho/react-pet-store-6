## 1. Order workflow status

- [ ] 1.1 Define the order workflow record keyed by order identifier with a single current status
- [ ] 1.2 Define the five-value customer order status vocabulary and the documented lifecycle
- [ ] 1.3 Implement starting a workflow with a caller-supplied initial status and duplicate refusal
- [ ] 1.4 Implement status update (replace, not-found error) and status read (not-found error)
- [ ] 1.5 Make status operations join the caller's unit of work and keep them internal-only

## 2. Order lines

- [ ] 2.1 Define the order line record with its seven fields shared by purchase and supplier orders
- [ ] 2.2 Initialise quantity shipped to zero on creation and make all other line fields immutable
- [ ] 2.3 Provide the read-only line snapshot without quantity shipped

## 3. Supplier orders

- [ ] 3.1 Define the supplier order record with identifier, order date, status, one shipping contact and lines
- [ ] 3.2 Enforce unique supplier order identifiers and retrieval by identifier
- [ ] 3.3 Create supplier orders atomically with status PENDING and zero-shipped lines
- [ ] 3.4 Define the four-value supplier order status vocabulary
- [ ] 3.5 Implement listing supplier orders by status without duplicates
- [ ] 3.6 Remove contact, address and lines with their supplier order; remove contact, payment card and lines with their purchase order
- [ ] 3.7 Provide the supplier order read-only view (identifier, date, lines)

## 4. Internal order documents

- [ ] 4.1 Implement the internal supplier order document structure and inbound rejection rules
- [ ] 4.2 Implement yyyy-MM-dd order date exchange with the current-date fallback on unreadable input
- [ ] 4.3 Implement contact details element order, required content and empty-element writing
- [ ] 4.4 Implement the order line exchange element order and misordered-line rejection

## 5. Trading-partner documents

- [ ] 5.1 Build the supplier purchase order document with the nine-field shipping address
- [ ] 5.2 Build the supplier invoice document
- [ ] 5.3 Enforce the six mandatory line attributes on both documents
- [ ] 5.4 Apply schema-mode value ranges and per-document item uniqueness
- [ ] 5.5 Write order and shipping dates as year-month-day without time
- [ ] 5.6 Refuse documents missing identifiers or dates and write missing address fields as empty
- [ ] 5.7 Identify document formats by public identifier or namespace and resolve definitions from the bundled catalog with deployment override
- [ ] 5.8 Implement the inbound document type check with per-document-type validation setting

## 6. Messaging and stage hand-off

- [ ] 6.1 Provision the new-order queue, supplier purchase-order queue and invoice topic
- [ ] 6.2 Implement the configurable stage hand-off with cause-preserving failure
- [ ] 6.3 Hand submitted storefront orders to order processing asynchronously

## 7. Supplier fulfilment

- [ ] 7.1 Accept and convert inbound trading-partner purchase orders into supplier orders
- [ ] 7.2 Record, fulfil and conditionally invoice a received purchase order as one unit of work with redelivery on failure
- [ ] 7.3 Implement whole-line fulfilment with stock reduction and skipping of shipped lines
- [ ] 7.4 Treat items with no stock record as unavailable without error
- [ ] 7.5 Mark supplier orders COMPLETED only when every outstanding line ships
- [ ] 7.6 Build per-shipment invoices listing only lines shipped in that attempt
- [ ] 7.7 Re-attempt all PENDING supplier orders on each inventory update and publish their invoices
- [ ] 7.8 Publish invoices on the invoice channel from both the receipt and restock paths

## 8. Customer order completion

- [ ] 8.1 Apply supplier invoices to customer order lines by item identifier, ignoring unmatched items
- [ ] 8.2 Set COMPLETED when every line's shipped quantity equals its ordered quantity, otherwise SHIPPED_PART
