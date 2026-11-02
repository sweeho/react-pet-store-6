## ADDED Requirements

### Requirement: Asynchronous hand-off from storefront to order processing

ID: SWHR2-R-0098
Recovered from: ORDER-FULFILLMENT-INT-0002
The system SHALL hand a submitted storefront order to order processing asynchronously, and order processing SHALL fulfil approved orders through the supplier, which invoices order processing.

#### Scenario: Placing an order does not wait for processing
ID: SWHR2-R-0098.01

- **GIVEN** a customer submits an order in the storefront
- **WHEN** the storefront accepts the order
- **THEN** the order is passed to order processing in the background and the customer does not wait for approval or fulfilment

#### Scenario: An approved order is fulfilled and invoiced
ID: SWHR2-R-0098.02

- **GIVEN** an order that order processing has approved
- **WHEN** the supplier ships the order
- **THEN** the supplier sends an invoice for the shipment to order processing

### Requirement: Staged order processing

ID: SWHR2-R-0100
Recovered from: ORDER-FULFILLMENT-WF-0002
The system SHALL process an order in stages: the storefront SHALL hand the order to order processing asynchronously, order processing SHALL approve or hold it, the supplier SHALL fulfil approved orders from inventory, possibly in more than one part, and SHALL invoice order processing for what it ships, and the order SHALL be complete only when fully fulfilled.

#### Scenario: An order fulfilled in two shipments
ID: SWHR2-R-0100.01

- **GIVEN** an approved order with two lines, only one of which the supplier has in stock
- **WHEN** the supplier ships the in-stock line and later ships the second line after a restock
- **THEN** the supplier invoices order processing once per shipment and the order is complete only after the second shipment

#### Scenario: An order not yet approved is not fulfilled
ID: SWHR2-R-0100.02

- **GIVEN** an order that order processing has held for approval
- **WHEN** no approval has been given
- **THEN** the order is not sent to the supplier for fulfilment

### Requirement: Fulfilment message channels

ID: SWHR2-R-0109
Recovered from: order-fulfillment-INT-0001
The system SHALL provide asynchronous, durable message channels for (a) new orders handed from the storefront to order processing, (b) purchase orders sent from order processing to the supplier, and (c) invoices published back from the supplier, with invoices delivered as a publish/subscribe broadcast rather than a point-to-point queue.

#### Scenario: Channels exist after installation
ID: SWHR2-R-0109.01

- **GIVEN** a fresh installation
- **WHEN** installation completes
- **THEN** a new-order channel, a supplier purchase-order channel and an invoice channel exist and accept messages

#### Scenario: An invoice reaches every subscriber
ID: SWHR2-R-0109.02

- **GIVEN** two subscribers registered on the invoice channel
- **WHEN** the supplier publishes one invoice
- **THEN** both subscribers receive that invoice

#### Scenario: A queued order survives a restart
ID: SWHR2-R-0109.03

- **GIVEN** a new order message waiting on the new-order channel
- **WHEN** the messaging system restarts before the order is consumed
- **THEN** the order message is still delivered to order processing

### Requirement: One workflow record per order

ID: SWHR2-R-0142
Recovered from: ORDFUL-ENT-0001
The system SHALL keep one order-workflow record per order, identified uniquely by the order id and carrying the order's current status.

#### Scenario: A workflow record holds the current status
ID: SWHR2-R-0142.01

- **GIVEN** an order with id 10011 whose workflow record holds status APPROVED
- **WHEN** the workflow record for order 10011 is read
- **THEN** exactly one record is found and it carries status APPROVED

### Requirement: Starting an order workflow

ID: SWHR2-R-0107
Recovered from: ORDFUL-REQ-0001
The system SHALL start a workflow record for each newly received purchase order, storing the order id and a caller-supplied initial status. GIVEN a workflow record already exists for an order id WHEN another is started for the same id THEN creation SHALL fail.

#### Scenario: Workflow started for a new order
ID: SWHR2-R-0107.01

- **GIVEN** no workflow record exists for order 10011
- **WHEN** a workflow is started for order 10011 with initial status PENDING
- **THEN** a workflow record for order 10011 with status PENDING is stored

#### Scenario: Duplicate workflow start rejected
ID: SWHR2-R-0107.02

- **GIVEN** a workflow record already exists for order 10011
- **WHEN** a workflow is started again for order 10011
- **THEN** creation fails and the existing record is unchanged

### Requirement: Reading an order status

ID: SWHR2-R-0108
Recovered from: ORDFUL-REQ-0003
The system SHALL return the current status of an order given its order id, and SHALL fail with a not-found error when no workflow record exists for that id.

#### Scenario: Status of a known order
ID: SWHR2-R-0108.01

- **GIVEN** a workflow record for order 10011 with status SHIPPED_PART
- **WHEN** the status of order 10011 is requested
- **THEN** SHIPPED_PART is returned

#### Scenario: Status of an unknown order
ID: SWHR2-R-0108.02

- **GIVEN** no workflow record exists for order 99999
- **WHEN** the status of order 99999 is requested
- **THEN** the request fails with a not-found error

### Requirement: Order lifecycle

ID: SWHR2-R-0024
Recovered from: ORDFUL-WF-0001
The order lifecycle SHALL be PENDING -> APPROVED -> SHIPPED_PART -> COMPLETED, or PENDING -> DENIED. GIVEN a newly placed order WHEN it enters the workflow THEN it starts in PENDING; DENIED and COMPLETED are end states.

#### Scenario: New order starts pending
ID: SWHR2-R-0024.01

- **GIVEN** a newly placed order
- **WHEN** it enters the workflow
- **THEN** its status is PENDING

#### Scenario: Approved order progresses to completion
ID: SWHR2-R-0024.02

- **GIVEN** an order in status APPROVED
- **WHEN** part of the order ships and later the remainder ships
- **THEN** the status becomes SHIPPED_PART and then COMPLETED

#### Scenario: Denied order stops
ID: SWHR2-R-0024.03

- **GIVEN** an order in status PENDING
- **WHEN** it is denied
- **THEN** its status is DENIED and it moves to no further status

### Requirement: Order status tracking

ID: SWHR2-R-0096
Recovered from: OFUL-ENT-0003
The system SHALL track each order through the statuses PENDING, APPROVED, DENIED, SHIPPED_PART and COMPLETED, where PENDING is the initial status, APPROVED or DENIED is set only from PENDING, and SHIPPED_PART or COMPLETED is set when supplier shipments are recorded.

#### Scenario: Approval decision applied to a pending order
ID: SWHR2-R-0096.01

- **GIVEN** an order in status PENDING
- **WHEN** an approval decision of APPROVED is received for it
- **THEN** the order status becomes APPROVED

#### Scenario: Approval decision ignored for an order no longer pending
ID: SWHR2-R-0096.02

- **GIVEN** an order in status APPROVED
- **WHEN** an approval decision of DENIED is received for it
- **THEN** the order status remains APPROVED

#### Scenario: Shipment recorded
ID: SWHR2-R-0096.03

- **GIVEN** an approved order
- **WHEN** a supplier shipment covering only part of the order is recorded
- **THEN** the order status becomes SHIPPED_PART

### Requirement: Configurable stage hand-off

ID: SWHR2-R-0106
Recovered from: ORDFUL-INT-0001
The system SHALL let each order-process step hand off to the next step through a pluggable transition, selected by configuration, that receives either a single XML message, a batch of XML messages, or both. GIVEN the configured transition cannot be loaded or instantiated WHEN it is requested THEN the system SHALL raise a transition error that carries the underlying cause.

#### Scenario: Batch hand-off
ID: SWHR2-R-0106.01

- **GIVEN** a step configured with a transition that accepts a batch of messages
- **WHEN** the step completes with three outbound messages
- **THEN** the configured transition receives all three messages in one hand-off

#### Scenario: Transition cannot be loaded
ID: SWHR2-R-0106.02

- **GIVEN** a step configured with a transition that does not exist
- **WHEN** the transition is requested
- **THEN** a transition error is raised that carries the reason the transition could not be loaded

### Requirement: Order message processed as one unit

ID: SWHR2-R-0140
Recovered from: OFUL-REQ-0004
The system SHALL process each incoming order, approval batch, invoice and notification as a single all-or-nothing unit: GIVEN any failure while handling the message WHEN processing aborts THEN status changes and outbound messages produced by that step SHALL NOT be committed and the message SHALL be retried.

#### Scenario: Failure after a status change
ID: SWHR2-R-0140.01

- **GIVEN** an approval batch that sets order 10011 to APPROVED and sends its supplier purchase order
- **WHEN** sending the supplier purchase order fails
- **THEN** order 10011 remains PENDING, no supplier purchase order is sent, and the approval batch is retried

### Requirement: Order line record

ID: SWHR2-R-0090
Recovered from: FUL-ENTITY-0001
The system SHALL store each order line item with category, product and item identifiers, a line number, the ordered quantity, the unit price and the quantity shipped so far; WHEN an order is first stored THEN every line's quantity shipped SHALL be zero.

#### Scenario: New order lines start unshipped
ID: SWHR2-R-0090.01

- **GIVEN** a new order with two lines ordering 2 and 5 units
- **WHEN** the order is stored
- **THEN** each line records its category, product, item, line number, ordered quantity and unit price, and a quantity shipped of 0

### Requirement: Dependent records removed with a purchase order

ID: SWHR2-R-0091
Recovered from: FUL-RULE-0003
WHEN a purchase order is deleted THEN the system SHALL also delete its contact information (including its address), its credit card record and all of its line items.

#### Scenario: Purchase order deleted
ID: SWHR2-R-0091.01

- **GIVEN** a purchase order with a contact, an address, a credit card record and three line items
- **WHEN** the purchase order is deleted
- **THEN** its contact, address, credit card record and three line items no longer exist

### Requirement: Supplier order identity

ID: SWHR2-R-0101
Recovered from: ORDF-BR-0001
The system SHALL identify each supplier order by its order identifier, which SHALL be unique; GIVEN a supplier order with an identifier already stored WHEN another supplier order with the same identifier is created THEN the creation SHALL be rejected.

#### Scenario: Duplicate supplier order rejected
ID: SWHR2-R-0101.01

- **GIVEN** a stored supplier order with identifier 10011
- **WHEN** another supplier order with identifier 10011 is created
- **THEN** the creation is rejected and the stored order is unchanged

### Requirement: New supplier order is pending

ID: SWHR2-R-0102
Recovered from: ORDF-BR-0002
The system SHALL set the status of every newly created supplier order to PENDING.

#### Scenario: Supplier order created
ID: SWHR2-R-0102.01

- **GIVEN** an incoming supplier order
- **WHEN** it is created
- **THEN** its status is PENDING

### Requirement: Supplier order status vocabulary

ID: SWHR2-R-0023
Recovered from: ORDF-BR-0003
The system SHALL restrict supplier order status to the values PENDING (placed, not yet approved), APPROVED, DENIED and COMPLETED.

#### Scenario: Supplier order status values
ID: SWHR2-R-0023.01

- **GIVEN** any stored supplier order
- **WHEN** its status is read
- **THEN** the status is one of PENDING, APPROVED, DENIED or COMPLETED

### Requirement: Supplier order lines start unshipped

ID: SWHR2-R-0103
Recovered from: ORDF-BR-0004
The system SHALL record every line item of a newly created supplier order with a shipped quantity of zero, copying category, product, item, line number, ordered quantity and unit price from the incoming order.

#### Scenario: Supplier order lines copied
ID: SWHR2-R-0103.01

- **GIVEN** an incoming supplier order with a line for item EST-1, line number 1, quantity 3, unit price 16.50
- **WHEN** the supplier order is created
- **THEN** the stored line carries the same category, product, item EST-1, line number 1, quantity 3 and unit price 16.50, with shipped quantity 0

### Requirement: Supplier order contact and lines belong to the order

ID: SWHR2-R-0104
Recovered from: ORDF-BR-0005
The system SHALL store the shipping contact and line items of a supplier order as part of the order, such that GIVEN a supplier order is deleted WHEN the deletion completes THEN its shipping contact, that contact's address, and all its line items SHALL also be deleted.

#### Scenario: Supplier order deleted
ID: SWHR2-R-0104.01

- **GIVEN** a supplier order with a shipping contact, its address and two line items
- **WHEN** the supplier order is deleted
- **THEN** the shipping contact, the address and both line items no longer exist

### Requirement: Listing supplier orders by status

ID: SWHR2-R-0141
Recovered from: ORDF-REQ-0001
The system SHALL be able to list all supplier orders that currently have a given status, returning each matching order once.

#### Scenario: Pending supplier orders listed
ID: SWHR2-R-0141.01

- **GIVEN** three supplier orders in status PENDING and two in status COMPLETED
- **WHEN** the supplier orders with status PENDING are listed
- **THEN** exactly the three pending orders are returned, each once

### Requirement: Atomic supplier order creation

ID: SWHR2-R-0105
Recovered from: ORDF-REQ-0002
The system SHALL create a supplier order together with its shipping contact and all of its line items within a single transaction, and SHALL fail the creation if the shipping contact or line item records cannot be created.

#### Scenario: Line item cannot be stored
ID: SWHR2-R-0105.01

- **GIVEN** an incoming supplier order with three lines, the third of which cannot be stored
- **WHEN** the supplier order is created
- **THEN** the creation fails and no part of the order, its contact or its lines is stored

### Requirement: Supplier order document content

ID: SWHR2-R-0138
Recovered from: FUL-ENT-0001
The system SHALL send each supplier order to the supplier as a document containing, in order: the order identifier, the order date, a shipping address of first name, last name, street, city, state, country, zip code, e-mail and phone, and one or more line items.

#### Scenario: Supplier order document built
ID: SWHR2-R-0138.01

- **GIVEN** an approved order with id 10011, a shipping address and two lines
- **WHEN** its supplier order document is produced
- **THEN** the document carries, in order, the order identifier 10011, the order date, the shipping address fields first name, last name, street, city, state, country, zip code, e-mail and phone, and the two line items

#### Scenario: Supplier order without lines
ID: SWHR2-R-0138.02

- **GIVEN** a supplier order document with no line items
- **WHEN** the document is checked against its format
- **THEN** the document is rejected as not conforming

### Requirement: Supplier document mandatory fields

ID: SWHR2-R-0094
Recovered from: OF-BR-0004
GIVEN a supplier order or invoice is being built, WHEN the order identifier, user identifier or a date is missing, THEN the document SHALL NOT be produced; WHEN a shipping-address field (name, street, city, state, country, zip, e-mail or phone) is missing, THEN that field SHALL be written as empty and the document SHALL still be produced.

#### Scenario: Missing order identifier
ID: SWHR2-R-0094.01

- **GIVEN** a supplier order being built with no order identifier
- **WHEN** the document is produced
- **THEN** production fails and no document is produced

#### Scenario: Missing shipping phone
ID: SWHR2-R-0094.02

- **GIVEN** a supplier order being built whose shipping address has no phone
- **WHEN** the document is produced
- **THEN** the document is produced with an empty phone field

### Requirement: Supplier document dates

ID: SWHR2-R-0137
Recovered from: FUL-BR-0006
The system SHALL record the order date and shipping date on supplier orders and invoices as calendar dates (year-month-day) without a time of day.

#### Scenario: Order date written as a date
ID: SWHR2-R-0137.01

- **GIVEN** an order placed on 2003-04-15 at 14:32
- **WHEN** its supplier order document is produced
- **THEN** the order date is written as 2003-04-15 with no time of day

### Requirement: Supplier document format identification and resolution

ID: SWHR2-R-0139
Recovered from: FUL-INT-0007
The system SHALL exchange supplier orders and invoices as UTF-8 XML documents that identify their format either by a document-type public identifier (DTD mode, the default) or by namespace (XML Schema mode), and SHALL resolve each format definition from a local catalog before trying its network location, with a deployment-supplied catalog taking precedence over the built-in one.

#### Scenario: Default format identification
ID: SWHR2-R-0139.01

- **GIVEN** no format mode has been configured
- **WHEN** a supplier order document is produced
- **THEN** the document is UTF-8 encoded and identifies its format by the document-type public identifier

#### Scenario: Deployment catalog overrides the built-in one
ID: SWHR2-R-0139.02

- **GIVEN** a deployment-supplied catalog that maps the invoice format to a different location than the built-in catalog
- **WHEN** an invoice document's format definition is resolved
- **THEN** the location from the deployment-supplied catalog is used, without first trying the network location

### Requirement: Published document format catalog

ID: SWHR2-R-0093
Recovered from: FULF-INT-0004
The system SHALL publish a catalog mapping each exchanged document type identifier (supplier order, invoice, line item) to the location of its schema, resolved against the server's own address, so that inbound and outbound documents can be validated.

#### Scenario: Catalog requested
ID: SWHR2-R-0093.01

- **GIVEN** order processing running at its configured server address
- **WHEN** the document format catalog is requested
- **THEN** it lists the supplier order, invoice and line item type identifiers, each mapped to an absolute schema location on that server

### Requirement: Supplier receives purchase orders by message

ID: SWHR2-R-0097
Recovered from: OFUL-INT-0001
The system SHALL accept supplier purchase orders as XML documents delivered asynchronously on a point-to-point message queue from the order processing centre, and SHALL translate the TPA-SupplierOrder format into the internal supplier order (shipping address and line items) using a stylesheet.

#### Scenario: Purchase order received
ID: SWHR2-R-0097.01

- **GIVEN** order processing sends a purchase order document for order 10011 with a shipping address and two lines
- **WHEN** the supplier consumes the message
- **THEN** exactly one supplier consumer receives it and an internal supplier order for 10011 is produced carrying that shipping address and both lines

### Requirement: Purchase order receipt as one unit of work

ID: SWHR2-R-0095
Recovered from: OFUL-BR-0006
The system SHALL treat the receipt, recording, fulfilment and invoice publication of a purchase order as one unit of work: GIVEN any failure to read, convert, record or publish WHEN a purchase order message is processed THEN the whole unit SHALL be abandoned and the message left for redelivery by the messaging system.

#### Scenario: Invoice publication fails
ID: SWHR2-R-0095.01

- **GIVEN** a purchase order message whose order can be fully shipped
- **WHEN** publishing the resulting invoice fails
- **THEN** the supplier order is not recorded, no stock is consumed, and the purchase order message is redelivered

### Requirement: Re-fulfilment after an inventory change

ID: SWHR2-R-0099
Recovered from: ORDER-FULFILLMENT-WF-0001
WHEN the supplier saves an inventory change, the system SHALL notify order processing of the change, re-examine orders it previously could not fulfil, and mark as completed any order it can now fulfil.

#### Scenario: Restock completes a waiting order
ID: SWHR2-R-0099.01

- **GIVEN** an order waiting because item EST-1 was out of stock
- **WHEN** the supplier saves an inventory change adding stock of EST-1
- **THEN** order processing is notified, the waiting order is re-examined, and it is marked completed

#### Scenario: Restock that does not cover a waiting order
ID: SWHR2-R-0099.02

- **GIVEN** an order waiting for 5 units of item EST-1
- **WHEN** the supplier saves an inventory change leaving 2 units of EST-1 in stock
- **THEN** the order is re-examined and remains not completed

### Requirement: Supplier invoice accepted by order processing

ID: SWHR2-R-0092
Recovered from: FULF-INT-0002
The system SHALL accept a supplier invoice identifying one order and listing, per shipped item, the item id and the quantity shipped; an invoice whose root is not an Invoice document SHALL be rejected.

#### Scenario: Invoice read
ID: SWHR2-R-0092.01

- **GIVEN** an invoice for order 10011 listing item EST-1 with quantity 3 and item EST-2 with quantity 1
- **WHEN** order processing receives it
- **THEN** it reads order 10011 with shipped quantities EST-1: 3 and EST-2: 1

#### Scenario: Document that is not an invoice
ID: SWHR2-R-0092.02

- **GIVEN** a message on the invoice channel whose document is a supplier order rather than an invoice
- **WHEN** order processing receives it
- **THEN** the document is rejected
