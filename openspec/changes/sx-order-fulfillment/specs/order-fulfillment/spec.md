## ADDED Requirements

### Requirement: Staged asynchronous order processing

The system SHALL process a customer order in stages: the storefront SHALL hand a submitted order to order processing asynchronously, order processing SHALL approve or deny it, the supplier SHALL fulfil approved orders from its inventory, possibly in more than one shipment, and SHALL invoice order processing for each shipment, and the order SHALL be complete only when every line has shipped.

#### Scenario: Placing an order does not wait for processing

- **GIVEN** a customer submits an order in the storefront
- **WHEN** the order is accepted by the storefront
- **THEN** the order is handed to order processing as a queued message and the customer does not wait for approval or fulfilment

#### Scenario: An approved order is fulfilled in two shipments

- **GIVEN** an approved order with two lines, only one of which the supplier has in stock
- **WHEN** the supplier fulfils the order and later receives stock for the second line
- **THEN** the supplier sends two invoices, one per shipment, and the order is complete only after the second shipment

### Requirement: Fulfilment message channels

The system SHALL provide durable asynchronous channels for new orders sent from the storefront to order processing and for purchase orders sent from order processing to the supplier, each delivered point-to-point to one consumer, and SHALL publish supplier invoices on a publish/subscribe channel so that more than one subscriber MAY receive each invoice.

#### Scenario: Channels exist after installation

- **GIVEN** a fresh installation
- **WHEN** installation completes
- **THEN** a new-order queue, a supplier purchase-order queue and an invoice topic exist and accept messages

#### Scenario: An invoice reaches every subscriber

- **GIVEN** two subscribers registered on the invoice channel
- **WHEN** the supplier publishes one invoice
- **THEN** both subscribers receive that invoice

### Requirement: One workflow status record per order

The system SHALL keep exactly one workflow record per customer order, identified by the order identifier and holding the order's current status.

#### Scenario: Status is looked up by order identifier

- **GIVEN** an order with identifier 1001 whose workflow record holds status APPROVED
- **WHEN** the workflow record for 1001 is read
- **THEN** exactly one record is found and it carries status APPROVED

### Requirement: Order status vocabulary

The system SHALL recognise exactly five customer-order statuses: PENDING (placed, not yet approved), APPROVED, DENIED, SHIPPED_PART (part of the order shipped) and COMPLETED (whole order shipped).

#### Scenario: A partly shipped order

- **GIVEN** an approved order of which some but not all lines have shipped
- **WHEN** its status is read
- **THEN** the status is SHIPPED_PART

### Requirement: Order lifecycle

The order lifecycle SHALL be PENDING to APPROVED to SHIPPED_PART to COMPLETED, or PENDING to DENIED; a newly placed order SHALL start in PENDING, and DENIED and COMPLETED SHALL be end states.

#### Scenario: A new order enters the workflow

- **GIVEN** a newly placed order
- **WHEN** its workflow is started
- **THEN** its status is PENDING

#### Scenario: A denied order goes no further

- **GIVEN** an order whose status is DENIED
- **WHEN** the order lifecycle is followed
- **THEN** the order never moves to APPROVED, SHIPPED_PART or COMPLETED

### Requirement: Starting an order workflow

The system SHALL start a workflow record when a new purchase order is received, storing the order identifier and the initial status supplied by the caller, and MUST refuse to start a second workflow for an order identifier that already has one.

#### Scenario: New order starts a workflow

- **GIVEN** no workflow record exists for order 1001
- **WHEN** a workflow is started for order 1001 with status PENDING
- **THEN** a workflow record for 1001 with status PENDING exists

#### Scenario: Duplicate start is refused

- **GIVEN** a workflow record already exists for order 1001
- **WHEN** another workflow is started for order 1001
- **THEN** the start fails and no second record is created

### Requirement: Updating an order status

The system SHALL record a new status for an existing order by replacing its previous status, keeping no status history, and MUST fail with a not-found error when no workflow record exists for the order identifier.

#### Scenario: Status replaced

- **GIVEN** order 1001 has status APPROVED
- **WHEN** its status is updated to SHIPPED_PART
- **THEN** reading order 1001 returns SHIPPED_PART and APPROVED is no longer recorded

#### Scenario: Unknown order

- **GIVEN** no workflow record exists for order 9999
- **WHEN** a status update is requested for order 9999
- **THEN** the update fails with a not-found error and nothing is stored

### Requirement: Reading an order status

The system SHALL return the current status of an order given its order identifier, and MUST fail with a not-found error when no workflow record exists for that identifier.

#### Scenario: Unknown order status requested

- **GIVEN** no workflow record exists for order 9999
- **WHEN** the status of order 9999 is requested
- **THEN** the request fails with a not-found error

### Requirement: Atomic workflow status operations

The system SHALL perform each workflow status operation (start, update, read, list by status) as a single atomic unit of work that joins the caller's unit of work when one exists, so that a status change commits or rolls back together with the processing that caused it.

#### Scenario: Status change rolls back with its cause

- **GIVEN** an invoice is being applied to order 1001 and the status is updated to SHIPPED_PART
- **WHEN** the invoice processing fails after the status update
- **THEN** the status of order 1001 is unchanged

### Requirement: Internal-only order status operations

Order workflow status operations SHALL be reachable only by order-processing components inside the application and MUST NOT be exposed to external clients.

#### Scenario: No external access

- **GIVEN** a client outside the application
- **WHEN** it attempts to change an order's workflow status directly
- **THEN** no interface exists through which it can do so

### Requirement: Configurable stage hand-off

The system SHALL pass an order from one processing stage to the next through a hand-off handler selected by configuration, which receives either a single XML message, a batch of XML messages, or both; WHEN the configured handler cannot be loaded or created THEN the system MUST raise a hand-off failure that carries the underlying cause.

#### Scenario: Missing handler

- **GIVEN** the configuration names a hand-off handler that does not exist
- **WHEN** a stage hands off an order
- **THEN** a hand-off failure is raised and the original cause is retrievable from it

### Requirement: Order line record

The system SHALL store each order line, on customer purchase orders and on supplier orders alike, with category identifier, product identifier, item identifier, line number, ordered quantity, unit price and quantity shipped; WHEN an order's lines are first stored THEN the system SHALL copy the six ordered values from the submitted line and SHALL set the quantity shipped to zero.

#### Scenario: New order starts with nothing shipped

- **GIVEN** a submitted order with a line for 3 units of item EST-4 at 18.50
- **WHEN** the order is stored
- **THEN** the stored line carries item EST-4, quantity 3, unit price 18.50 and quantity shipped 0

### Requirement: Order line immutability

Once an order line is created the system SHALL allow only its quantity shipped to change; category, product, item, line number, ordered quantity and unit price MUST remain unchanged for the life of the line.

#### Scenario: Only shipped quantity changes

- **GIVEN** a stored order line for 3 units at 18.50 with 0 shipped
- **WHEN** a shipment of 3 units is recorded against it
- **THEN** its quantity shipped becomes 3 and its item, quantity and unit price are unchanged

### Requirement: Order line snapshot

The system SHALL provide a read-only snapshot of a stored order line containing category, product, item, line number, ordered quantity and unit price; the snapshot SHALL NOT carry the quantity shipped, which is available only from the stored line itself.

#### Scenario: Snapshot of a partly shipped line

- **GIVEN** a stored line for 5 units with 2 shipped
- **WHEN** a snapshot of the line is requested
- **THEN** the snapshot carries quantity 5 and no shipped quantity

### Requirement: Supplier order record

The system SHALL store each supplier order with a unique order identifier, a mandatory order date, a status, exactly one shipping contact (family name, given name, e-mail, phone and postal address) and a collection of order lines.

#### Scenario: Supplier order stored with its parts

- **GIVEN** an incoming supplier order with identifier 1001, an order date, a shipping contact and two lines
- **WHEN** it is stored
- **THEN** the stored supplier order carries identifier 1001, the order date, a status, the one shipping contact and both lines

### Requirement: Supplier order identity

The system SHALL identify each supplier order by the order identifier carried in the incoming order, MUST reject creation of a second supplier order with an identifier already stored, and SHALL allow a supplier order to be retrieved by its identifier.

#### Scenario: Duplicate supplier order refused

- **GIVEN** a supplier order 1001 is already stored
- **WHEN** another supplier order with identifier 1001 is received
- **THEN** its creation is rejected

#### Scenario: Retrieval by identifier

- **GIVEN** a supplier order 1001 is stored
- **WHEN** supplier order 1001 is requested
- **THEN** that order is returned

### Requirement: Initial supplier order state

WHEN a supplier order is recorded the system SHALL set its status to PENDING, store the order date and shipping contact from the incoming order, and store every incoming line with a quantity shipped of zero.

#### Scenario: Newly recorded supplier order

- **GIVEN** an incoming supplier order carrying no status
- **WHEN** it is recorded
- **THEN** its status is PENDING and every line has quantity shipped 0

### Requirement: Supplier order status vocabulary

The system SHALL track a supplier order with the statuses PENDING, APPROVED, DENIED and COMPLETED, with intended progressions PENDING to APPROVED to COMPLETED or PENDING to DENIED; fulfilment SHALL move an order directly from PENDING to COMPLETED.

#### Scenario: Fulfilled supplier order

- **GIVEN** a supplier order in status PENDING
- **WHEN** every line ships
- **THEN** its status becomes COMPLETED

### Requirement: Listing supplier orders by status

The system SHALL list every supplier order currently in a given status, returning each matching order exactly once.

#### Scenario: Pending orders listed

- **GIVEN** three supplier orders, two PENDING and one COMPLETED
- **WHEN** supplier orders with status PENDING are listed
- **THEN** exactly the two PENDING orders are returned, each once

### Requirement: Atomic supplier order creation

The system SHALL record a supplier order, its shipping contact and all of its lines as one all-or-nothing unit, and MUST reject the order if any part cannot be stored.

#### Scenario: A line cannot be stored

- **GIVEN** an incoming supplier order whose second line cannot be stored
- **WHEN** the order is recorded
- **THEN** creation fails and neither the order, its contact nor its first line remains stored

### Requirement: Dependent records removed with their order

WHEN a supplier order is removed the system SHALL also remove its shipping contact, that contact's address and all of its lines; WHEN a customer purchase order is removed the system SHALL also remove its contact information and addresses, its payment card record and all of its lines.

#### Scenario: Supplier order removed

- **GIVEN** a stored supplier order with a shipping contact and two lines
- **WHEN** the supplier order is removed
- **THEN** its shipping contact, the contact's address and both lines no longer exist

#### Scenario: Purchase order removed

- **GIVEN** a stored purchase order with contact information, a payment card record and three lines
- **WHEN** the purchase order is removed
- **THEN** its contact information, addresses, payment card record and lines no longer exist

### Requirement: Supplier order read-only view

The system SHALL provide a read-only view of a stored supplier order containing its order identifier, order date and all of its lines; the view does not carry the order status, and its shipping contact is empty.

#### Scenario: Viewing a stored supplier order

- **GIVEN** a stored supplier order 1001 with a shipping contact and two lines
- **WHEN** its read-only view is requested
- **THEN** the view carries identifier 1001, the order date and both lines, no status, and an empty shipping contact

### Requirement: Internal supplier order document

The system SHALL exchange supplier orders internally as an XML document whose root contains, in order, an order identifier, an order date, a shipping section holding one contact, and one or more lines, and MUST reject an inbound document that does not follow that structure or whose root is not a supplier order.

#### Scenario: Document with no lines rejected

- **GIVEN** an inbound supplier order document with an identifier, date and shipping contact but no line
- **WHEN** it is read
- **THEN** the document is rejected

### Requirement: Supplier order date handling

The system SHALL exchange the supplier order date as a calendar date in the form yyyy-MM-dd; GIVEN an inbound supplier order whose date cannot be read in that form, the system SHALL use the current date as the order date and SHALL continue processing the order.

#### Scenario: Readable date

- **GIVEN** an inbound supplier order dated 2026-10-24
- **WHEN** it is read
- **THEN** its order date is 24 October 2026 with no time of day

#### Scenario: Unreadable date

- **GIVEN** an inbound supplier order whose date reads "24/10/2026"
- **WHEN** it is read
- **THEN** the order is accepted and its order date is the current date

### Requirement: Contact details in order documents

WHEN contact details are read from an order document the system SHALL require the elements family name, given name, address, e-mail and phone in that order, MUST reject the document if any is missing or out of order or if the family name, given name or phone is empty, and SHALL accept an empty e-mail; WHEN contact details are written the system SHALL emit all five elements in that order, writing a missing value as an empty element.

#### Scenario: Empty e-mail accepted

- **GIVEN** an order document whose contact has a family name, given name, address and phone and an empty e-mail
- **WHEN** it is read
- **THEN** the contact is accepted

#### Scenario: Empty phone rejected

- **GIVEN** an order document whose contact has an empty phone
- **WHEN** it is read
- **THEN** the document is rejected

#### Scenario: Missing value written as empty

- **GIVEN** a contact with no e-mail
- **WHEN** it is written into an order document
- **THEN** an empty e-mail element appears between the address and the phone

### Requirement: Order line exchange element

The system SHALL exchange an order line inside internal order documents as a line element whose children appear in exactly this order: category identifier, product identifier, item identifier, line number, quantity, unit price; the quantity shipped SHALL NOT be part of the exchanged line, and a line element whose children are missing or out of order MUST be rejected.

#### Scenario: Misordered line rejected

- **GIVEN** an inbound line element with the item identifier before the product identifier
- **WHEN** it is read
- **THEN** the line is rejected

### Requirement: Supplier purchase order document

The system SHALL send each approved order to the supplier as a trading-partner supplier order document containing, in order, the order identifier, the order date, one shipping address (first name, last name, street, city, state, country, zip code, e-mail and phone) and one or more lines.

#### Scenario: Approved order sent to supplier

- **GIVEN** an order is approved
- **WHEN** order processing sends it to the supplier
- **THEN** the supplier receives one document with the order identifier, order date, a nine-field shipping address and at least one line, in that order

### Requirement: Supplier invoice document

The system SHALL represent each supplier shipment as an invoice document containing, in order, the order identifier, a user identifier, the order date, the shipping date and one or more lines describing what shipped.

#### Scenario: Invoice structure

- **GIVEN** a shipment of one line for order 1001
- **WHEN** its invoice document is produced
- **THEN** the document carries order identifier 1001, a user identifier, the order date, the shipping date and that one line, in that order

### Requirement: Trading-partner line attributes

Every line on a trading-partner supplier order or invoice MUST carry a category identifier, product identifier, item identifier, line number, quantity and unit price; a line missing any of them SHALL NOT be produced.

#### Scenario: Complete line written

- **GIVEN** an order line with all six values
- **WHEN** it is written onto a supplier order or invoice
- **THEN** all six values appear on the line

### Requirement: Schema-mode line value ranges

WHERE trading-partner documents are validated in schema mode, a line's quantity MUST be a whole number of at least 1, its line number a whole number of at least 0, and its unit price a decimal of at least 0.

#### Scenario: Zero quantity in schema mode

- **GIVEN** schema-mode validation is enabled
- **WHEN** a supplier order line with quantity 0 is checked
- **THEN** the line fails validation

#### Scenario: Zero price in schema mode

- **GIVEN** schema-mode validation is enabled
- **WHEN** a supplier order line with unit price 0.00 is checked
- **THEN** the line passes validation

### Requirement: Schema-mode unique items per document

WHERE trading-partner documents are validated in schema mode, no two lines in the same supplier order or invoice SHALL share an item identifier.

#### Scenario: Duplicate item in schema mode

- **GIVEN** schema-mode validation is enabled
- **WHEN** a supplier order with two lines for item EST-4 is checked
- **THEN** the document fails validation

### Requirement: Trading-partner document dates

The system SHALL write order dates and shipping dates on trading-partner supplier orders and invoices as calendar dates in year-month-day form with no time of day.

#### Scenario: Date written

- **GIVEN** an order placed at 15:42 on 24 October 2026
- **WHEN** its supplier order document is produced
- **THEN** the order date reads 2026-10-24

### Requirement: Trading-partner document completeness

WHEN a trading-partner supplier order or invoice is built without an order identifier, a user identifier (invoice) or a required date, the system MUST NOT produce the document; WHEN a shipping-address field is missing, the system SHALL write that field as empty and SHALL still produce the document.

#### Scenario: Missing order identifier

- **GIVEN** an invoice being built with no order identifier
- **WHEN** the document is produced
- **THEN** production fails

#### Scenario: Missing address field

- **GIVEN** a supplier order being built whose shipping address has no state
- **WHEN** the document is produced
- **THEN** the document is produced with an empty state field

### Requirement: Document format identification and resolution

The system SHALL exchange supplier orders and invoices as UTF-8 XML documents that identify their format by document-type public identifier (the default mode) or by namespace (schema mode), and SHALL resolve each format definition from a copy bundled with the application before any network location, with a deployment-supplied catalog overriding or extending the bundled mappings.

#### Scenario: Offline validation

- **GIVEN** no network access
- **WHEN** a supplier order document is validated
- **THEN** its format definition is resolved from the bundled copy and validation proceeds

#### Scenario: Deployment catalog override

- **GIVEN** a deployment catalog maps the invoice format to a different definition
- **WHEN** an invoice is validated
- **THEN** the deployment's definition is used

### Requirement: Inbound document type check

WHEN an inbound business document is read with validation switched on, the system MUST reject a document that is not well formed or that declares a document type different from the one expected, and SHALL accept a document that declares no document type without a type check; whether validation is on SHALL be a deployment setting per document type.

#### Scenario: Wrong document type

- **GIVEN** validation is on for supplier orders
- **WHEN** a document declaring the invoice document type is read as a supplier order
- **THEN** the document is rejected

#### Scenario: No declared document type

- **GIVEN** validation is on for supplier orders
- **WHEN** a supplier order document with no document-type declaration is read
- **THEN** the document is accepted without a type check

### Requirement: Inbound supplier purchase order conversion

The supplier SHALL accept purchase orders as trading-partner XML documents delivered on a point-to-point queue from order processing, SHALL convert each into its internal supplier order, mapping the shipping address and each line's category, product, item, line number, quantity and unit price, and MUST reject a purchase order whose document cannot be parsed or converted.

#### Scenario: Purchase order converted

- **GIVEN** a trading-partner purchase order with two lines arrives on the supplier queue
- **WHEN** the supplier reads it
- **THEN** an internal supplier order with the same shipping address and two lines carrying the same six values is produced

#### Scenario: Unconvertible document

- **GIVEN** a purchase order message that is not well formed XML
- **WHEN** the supplier reads it
- **THEN** the purchase order is rejected

### Requirement: Supplier purchase order receipt

WHEN the supplier receives a purchase order the system SHALL first record the order, then attempt to fulfil it from stock, and SHALL send an invoice to order processing only if at least one line shipped; GIVEN no line could ship, the system SHALL send nothing and SHALL keep the order for fulfilment when stock arrives.

#### Scenario: Partial stock on receipt

- **GIVEN** stock for one of two ordered lines
- **WHEN** the purchase order is received
- **THEN** the order is recorded, one line ships and one invoice for that line is sent

#### Scenario: No stock on receipt

- **GIVEN** no stock for any ordered line
- **WHEN** the purchase order is received
- **THEN** the order is recorded as PENDING and no invoice is sent

### Requirement: Whole-line fulfilment

The supplier SHALL ship an order line only when stock for its item is at least the line's full ordered quantity, SHALL then reduce stock by that quantity and record the whole line quantity as shipped, and MUST NOT ship part of a line; lines SHALL be evaluated independently, so an order MAY ship line by line across several attempts, and a line whose shipped quantity already equals its ordered quantity SHALL be skipped on later attempts.

#### Scenario: Insufficient stock for a line

- **GIVEN** stock of 3 for item EST-4 and an unshipped line for 5 units of EST-4
- **WHEN** fulfilment is attempted
- **THEN** the line is not shipped and stock stays at 3

#### Scenario: Sufficient stock for a line

- **GIVEN** stock of 8 for item EST-4 and an unshipped line for 5 units of EST-4
- **WHEN** fulfilment is attempted
- **THEN** the line is recorded as 5 shipped and stock becomes 3

#### Scenario: Already shipped line

- **GIVEN** a line for 5 units already recorded as 5 shipped
- **WHEN** fulfilment is attempted again for the order
- **THEN** the line is neither shipped nor invoiced again and stock is not reduced

### Requirement: Supplier order completion

The supplier SHALL mark a supplier order COMPLETED only when, on a fulfilment attempt, every line not already fully shipped could be shipped; otherwise the order status SHALL be left unchanged.

#### Scenario: Last outstanding line ships

- **GIVEN** a PENDING supplier order whose only unshipped line now has enough stock
- **WHEN** fulfilment is attempted
- **THEN** the order status becomes COMPLETED

#### Scenario: A line is still short

- **GIVEN** a PENDING supplier order with two unshipped lines, one of which lacks stock
- **WHEN** fulfilment is attempted
- **THEN** the order status stays PENDING

### Requirement: Item with no supplier stock record

GIVEN an ordered item has no supplier stock record, WHEN fulfilment is attempted, the supplier SHALL treat that line as unavailable, leave it unshipped and the order not completed, and MUST NOT fail the order or raise an error.

#### Scenario: Unknown item

- **GIVEN** a supplier order line for an item the supplier has never stocked
- **WHEN** fulfilment is attempted
- **THEN** the line stays unshipped, the order stays PENDING and no error is raised

### Requirement: Shipment invoice content

WHEN a fulfilment attempt ships at least one line, the supplier SHALL produce one invoice carrying the order identifier, the original order date, the current date as shipping date, the fixed text "Dear PetStore Customer" as the user identifier, and one line per order line shipped in that attempt with its category, product, item, line number, ordered quantity and unit price; lines shipped in earlier attempts or not shipped in this attempt MUST NOT appear on it.

#### Scenario: Second shipment invoice

- **GIVEN** a supplier order whose line 1 shipped yesterday and whose line 2 ships today
- **WHEN** today's invoice is produced
- **THEN** it lists only line 2, carries today's date as shipping date and the original order date, and its user identifier is "Dear PetStore Customer"

### Requirement: Re-fulfilment after a stock update

WHENEVER the supplier saves an inventory update the system SHALL re-attempt fulfilment of every supplier order in status PENDING and SHALL publish one invoice for each order from which at least one line shipped, marking COMPLETED every order that is now fully shipped.

#### Scenario: Restock releases a waiting order

- **GIVEN** a PENDING supplier order waiting for 5 units of EST-4 and stock of 0
- **WHEN** the supplier saves an inventory update raising EST-4 stock to 10
- **THEN** the line ships, one invoice is published for the order and the order becomes COMPLETED

#### Scenario: Restock does not cover the order

- **GIVEN** a PENDING supplier order waiting for 5 units of EST-4
- **WHEN** the supplier saves an inventory update raising EST-4 stock to 2
- **THEN** no invoice is published for the order and it stays PENDING

### Requirement: Invoice publication

The supplier SHALL publish every invoice as an XML text message on the order-processing invoice channel, both for shipments made on receipt of a purchase order and for shipments made after a stock update; a publication failure on the purchase-order receipt path MUST fail the processing of that purchase order.

#### Scenario: Invoice after receipt

- **GIVEN** a purchase order whose lines are all in stock
- **WHEN** the supplier processes it
- **THEN** one invoice message is published on the invoice channel

#### Scenario: Publication fails on receipt

- **GIVEN** the invoice channel is unavailable
- **WHEN** the supplier processes a purchase order that ships a line
- **THEN** processing of that purchase order fails

### Requirement: Purchase order receipt as one unit of work

The supplier SHALL treat reading, converting, recording, fulfilling and invoicing a received purchase order as one unit of work; GIVEN any failure to read, convert, record or publish, the whole unit SHALL be abandoned and the purchase order message SHALL be left for redelivery.

#### Scenario: Publication failure rolls back receipt

- **GIVEN** a purchase order whose lines are in stock and an invoice channel that rejects the publish
- **WHEN** the supplier processes the purchase order
- **THEN** no supplier order is recorded, stock is not reduced and the message is redelivered later

### Requirement: Applying a supplier invoice to the customer order

WHEN order processing receives a supplier invoice for an order, the system SHALL add the shipped quantity reported for each item to the quantity shipped of every order line for that item, matching by item identifier, and SHALL ignore invoice items that match no order line.

#### Scenario: Invoice applied

- **GIVEN** an order line for 3 units of EST-4 with 0 shipped
- **WHEN** an invoice reporting 3 units of EST-4 is received
- **THEN** the line's quantity shipped becomes 3

#### Scenario: Unmatched invoice item

- **GIVEN** an order with no line for item EST-9
- **WHEN** an invoice reporting 2 units of EST-9 is received
- **THEN** no order line changes for EST-9 and the invoice is otherwise applied

### Requirement: Customer order completion

After applying a supplier invoice, the system SHALL set the order status to COMPLETED only when every order line's quantity shipped exactly equals its ordered quantity, and SHALL otherwise set the order status to SHIPPED_PART.

#### Scenario: All lines shipped

- **GIVEN** an order with two lines, one already fully shipped
- **WHEN** an invoice for the full quantity of the second line is applied
- **THEN** the order status becomes COMPLETED

#### Scenario: Lines outstanding

- **GIVEN** an order with two unshipped lines
- **WHEN** an invoice for only the first line is applied
- **THEN** the order status becomes SHIPPED_PART

#### Scenario: Over-shipment

- **GIVEN** an order line for 3 units whose quantity shipped becomes 6 after an invoice is applied
- **WHEN** completion is evaluated
- **THEN** the order is not COMPLETED and its status is SHIPPED_PART
