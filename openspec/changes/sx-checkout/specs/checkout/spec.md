## ADDED Requirements

### Requirement: Checkout flow for a signed-on customer

The system SHALL let a signed-on customer with a non-empty cart proceed to checkout, SHALL present the order information entry screen pre-filled from the customer's account, and SHALL place the order when the customer submits that screen. Order placement SHALL hand the order to order processing asynchronously, so that order approval happens after the customer's request has completed.

#### Scenario: Customer checks out a cart

- **GIVEN** a signed-on customer whose cart holds one Bulldog item
- **WHEN** the customer chooses Check Out
- **THEN** the order information entry screen is shown with billing and shipping details already filled in from the customer's account

#### Scenario: Customer submits the order

- **GIVEN** the order information entry screen with every required field filled in
- **WHEN** the customer submits it
- **THEN** the order is placed, handed to order processing without waiting for approval, and the order complete screen is shown

### Requirement: Order information entry screen

The order information entry screen SHALL display a Billing Information section and a Shipping Information section. Each section MUST accept first name, last name, street address line 1, street address line 2, city, state or province, postal code, country, telephone and e-mail, and each field MUST be pre-filled from the signed-on customer's account contact details. The state or province field SHALL offer only California, New York and Texas in the English store and only Tokyo, Osaka and Nagano in the Japanese store. The billing country field SHALL offer United States, Canada, Japan and China; the shipping country field SHALL offer United States, Canada and Japan. The screen SHALL NOT display or accept any payment card field. The screen SHALL offer a single Submit control that places the order. The screen SHOULD alert the customer, before submitting, to any empty required field or empty e-mail.

#### Scenario: Screen displayed for a customer with stored contact details

- **GIVEN** a signed-on customer whose account holds given name "Ann", family name "Lee", city "Palo Alto" and e-mail "ann@example.com"
- **WHEN** the order information entry screen is displayed
- **THEN** both the Billing Information and the Shipping Information sections show "Ann" as first name, "Lee" as last name, "Palo Alto" as city and "ann@example.com" as e-mail, and no card number, card type or expiry field is shown

#### Scenario: Country choices differ between billing and shipping

- **GIVEN** the order information entry screen in the English store
- **WHEN** the customer opens the billing country and the shipping country choices
- **THEN** billing offers United States, Canada, Japan and China, and shipping offers United States, Canada and Japan only

#### Scenario: Empty required field caught before submission

- **GIVEN** the order information entry screen with the billing city cleared
- **WHEN** the customer chooses Submit
- **THEN** the customer is alerted that the field is empty and the order is not submitted

### Requirement: Billing and shipping contact validation

The system SHALL trim surrounding spaces from every submitted billing and shipping value before use. For both the billing contact and the shipping contact the system MUST require a non-empty last name, first name, street address line 1, city, state or province, postal code and telephone. Street address line 2 and e-mail SHALL be optional on the server, and country SHALL NOT be checked. The billing contact SHALL become the order's bill-to contact and the shipping contact its ship-to contact.

#### Scenario: Optional values left empty

- **GIVEN** a submitted order whose billing and shipping sections have every required field filled and street address line 2 left empty
- **WHEN** the order is submitted
- **THEN** both contacts are accepted with an empty second address line

#### Scenario: Required value missing on the server

- **GIVEN** a submitted order whose shipping telephone is " "
- **WHEN** the server checks the shipping contact
- **THEN** the shipping telephone is treated as missing and the shipping contact is rejected

### Requirement: Empty cart order refusal

The system MUST refuse to place an order when the customer's cart holds no items, MUST NOT hand anything to order processing in that case, and SHALL display an Order Error screen stating that the cart is empty and the order could not be placed, and that a customer who re-submitted an order has already had the original order placed.

#### Scenario: Order re-submitted after success

- **GIVEN** a customer whose order was just placed, so the cart has been emptied
- **WHEN** the customer re-submits the same order information
- **THEN** no order is created or sent, and the Order Error screen explains that the cart is empty and that the original order has already been placed

### Requirement: Order total computation

The system SHALL compute the order total as the sum over all cart lines of the item's unit price multiplied by its quantity, using the unit price in the customer's current catalog locale. The total SHALL include no tax, shipping charge or discount, and the legacy system applies no explicit rounding step.

#### Scenario: Two cart lines

- **GIVEN** a cart holding 2 of an item with unit price 18.50 and 1 of an item with unit price 10.00
- **WHEN** the order is placed
- **THEN** the order total is 47.00 with no tax, shipping or discount added

### Requirement: Order lines from cart items

The system SHALL create one order line per cart item carrying its category, product, item, quantity and unit price, and SHALL number the lines sequentially from 0 in cart order.

#### Scenario: Three cart items

- **GIVEN** a cart holding three different items
- **WHEN** the order is placed
- **THEN** the order carries three lines numbered 0, 1 and 2 in cart order, each with its item's category, product, item, quantity and unit price

### Requirement: Order header composition

The system SHALL create each order with a newly issued order id, the signed-on customer's user id, the billing contact's e-mail as the order e-mail, the current date and time as the order date, the billing and shipping contacts, a payment card, and the customer's current locale.

#### Scenario: Order header populated from the session and the form

- **GIVEN** customer "j2ee" in the en_US locale submits billing e-mail "ann@example.com"
- **WHEN** the order is placed
- **THEN** the order carries user id "j2ee", e-mail "ann@example.com", locale en_US, the submission date and time, and a new order id

### Requirement: Fixed payment card on every order

Checkout SHALL NOT collect payment card details. The legacy system SHALL attach to every order the fixed card number "1234-2334", card type "Duke Express" and expiry "10/2001", whatever card is stored on the customer's account.

#### Scenario: Customer with a stored card places an order

- **GIVEN** a customer whose account holds a different payment card
- **WHEN** the customer places an order
- **THEN** the order carries card number "1234-2334", type "Duke Express" and expiry "10/2001"

### Requirement: Order id issue

The system SHALL issue every new order an id from the order sequence whose prefix is "1001". An id SHALL be the prefix immediately followed, with no separator and no padding, by the sequence's next value in decimal. Each issue MUST advance the sequence by exactly 1 and persist the new value inside the requesting unit of work, so the same value is not issued twice. A sequence that does not yet exist SHALL be created starting at 0, so its first id is the prefix followed by 1.

#### Scenario: First orders after the sequence is created

- **GIVEN** no order sequence exists yet
- **WHEN** three orders are placed one after another
- **THEN** they receive ids "10011", "10012" and "10013"

#### Scenario: Order placement rolled back

- **GIVEN** the order sequence's last issued value is 5
- **WHEN** an order id is issued and the enclosing unit of work then rolls back
- **THEN** the sequence's stored value stays 5

### Requirement: Id sequence failure

The system MUST fail an id request with an error, and issue no id, when the sequence for the prefix cannot be created or the sequence store cannot be reached. A caller MUST supply a non-null prefix.

#### Scenario: Sequence store unavailable

- **GIVEN** the sequence store cannot be reached
- **WHEN** an id is requested
- **THEN** the request fails with an error and no id is returned

### Requirement: Id sequence storage and access

The system SHALL store one sequence per prefix, keyed uniquely by the prefix text of up to 255 characters and holding a mandatory integer last-issued value. Any internal caller MAY request ids and create or advance sequences without a role check.

#### Scenario: Two prefixes kept apart

- **GIVEN** sequences exist for prefixes "1001" and "2001"
- **WHEN** an id is requested for "2001"
- **THEN** only the "2001" sequence advances

### Requirement: Asynchronous order hand-off

WHEN an order is placed the system SHALL build a purchase order document from the order and SHALL place it, as a single text message, on the order processing queue, so the customer's request does not wait for order processing. The message SHALL be sent inside the calling unit of work, joining it or starting one, and SHALL be delivered only if that unit of work commits. After the hand-off the system SHALL empty the customer's cart and return the order id and order e-mail for confirmation. A failure of the send itself MUST be reported to the caller as an error.

#### Scenario: Order handed off

- **GIVEN** a customer submits a valid order for a cart of two items
- **WHEN** the order is placed
- **THEN** one purchase order document is queued for order processing, the cart is emptied, and the order id and e-mail are returned for the confirmation

#### Scenario: Queue send fails

- **GIVEN** the order processing queue rejects the message
- **WHEN** the order is handed off
- **THEN** the failure is reported to the caller as an error and the unit of work is rolled back

#### Scenario: Order document cannot be built in the legacy system

- **GIVEN** the purchase order document cannot be built or the hand-off service cannot be located
- **WHEN** the order is placed
- **THEN** the legacy system only logs the failure, still empties the cart and still returns an order id for confirmation

### Requirement: Order complete screen

WHEN an order has been placed the system SHALL display an order complete screen stating "Your Order is Complete", showing the order id, and stating that a confirmation e-mail will be sent to the order e-mail address, which is the billing e-mail. The screen SHALL thank the customer for shopping.

#### Scenario: Confirmation displayed

- **GIVEN** an order placed with order id "10012" and billing e-mail "ann@example.com"
- **WHEN** the order complete screen is displayed
- **THEN** it states that the order is complete, shows order id "10012", and states that a confirmation e-mail will arrive at "ann@example.com"

### Requirement: Unexpected failure page

WHEN an unexpected failure occurs while handling a storefront request the system SHALL display a Server Error page carrying the error message and asking the user to notify the administrator.

#### Scenario: General failure during order placement

- **GIVEN** order placement raises an unexpected failure
- **WHEN** the response is rendered
- **THEN** a Server Error page with the error message and a request to notify the administrator is shown

### Requirement: Order processing intake

The system SHALL receive placed orders from the storefront asynchronously as purchase order documents and MUST reject, and not record, a document that cannot be parsed or, when validation is enabled, fails schema validation.

#### Scenario: Malformed order document

- **GIVEN** a queued purchase order document that is not well-formed
- **WHEN** order processing receives it
- **THEN** no purchase order is recorded and the receipt is rolled back

### Requirement: Purchase order document structure

The system SHALL exchange a purchase order as a document whose root element is PurchaseOrder containing, in order, an order id, user id, e-mail id, order date, shipping information, billing information, total price, credit card and one or more line items. A document with no locale SHALL default to locale en_US. The system MUST reject a document whose root element is not PurchaseOrder with the message "PurchaseOrder element expected.", and SHALL be able to render a purchase order back to the same form.

#### Scenario: Document without a locale

- **GIVEN** a valid purchase order document with no locale attribute
- **WHEN** it is read
- **THEN** the order locale is en_US

#### Scenario: Document with no line items

- **GIVEN** a purchase order document with no LineItem element and validation enabled
- **WHEN** it is read
- **THEN** it is rejected

#### Scenario: Wrong root element

- **GIVEN** a document whose root element is SupplierOrder
- **WHEN** it is read as a purchase order
- **THEN** it is rejected with "PurchaseOrder element expected."

### Requirement: Order date in purchase order documents

The system SHALL write the order date in a purchase order document as a calendar date in the format yyyy-MM-dd with no time of day. WHEN an incoming document's order date is missing or cannot be parsed in that format the legacy system SHALL set the order date to the current date and time and continue processing the order.

#### Scenario: Unparseable order date

- **GIVEN** an incoming purchase order document whose order date is "24/10/2026"
- **WHEN** the document is read
- **THEN** the order date is set to the current date and time and the order is processed

### Requirement: Payment card document element

The system SHALL exchange a payment card as a CreditCard element containing, in this order, CardNumber, CardType and ExpiryDate, each holding text, and MUST reject a node that is not a CreditCard element with the message "CreditCard element expected.".

#### Scenario: Wrong element supplied as a card

- **GIVEN** a ContactInfo element supplied where a card is expected
- **WHEN** it is read as a card
- **THEN** it is rejected with "CreditCard element expected."

### Requirement: Line item document element

The system SHALL exchange an order line as a LineItem element containing, in this order and all required, CategoryId, ProductId, ItemId, LineNum, Quantity as an integer and UnitPrice as a decimal number. The element SHALL NOT carry the quantity shipped. The system MUST reject an element that is not a LineItem.

#### Scenario: Line item serialised

- **GIVEN** an order line for 2 units of item "EST-6" at unit price 18.50
- **WHEN** it is written to a purchase order document
- **THEN** the LineItem element carries CategoryId, ProductId, ItemId, LineNum, Quantity 2 and UnitPrice 18.5, and no shipped quantity

### Requirement: Contact document element

The system SHALL read contact details from a document as the elements family name, given name, address, e-mail and phone, in that order. It MUST reject the contact when the family name, given name or phone is empty, and SHALL accept an empty e-mail.

#### Scenario: Empty e-mail accepted

- **GIVEN** an incoming contact element whose Email is empty
- **WHEN** it is read
- **THEN** the contact is accepted with an empty e-mail

#### Scenario: Empty phone rejected

- **GIVEN** an incoming contact element whose Phone is empty
- **WHEN** it is read
- **THEN** it is rejected with "Phone element: content expected."

### Requirement: Purchase order persistence

The system SHALL persist each accepted purchase order, identified uniquely by its order id and retrievable by it, carrying the user id, the e-mail address, the order date to the millisecond, the order locale and the order total. Each purchase order SHALL own exactly one contact record, exactly one payment card record and one or more line items, and deleting the order SHALL delete those owned records. The order header, its contact record, its card record and one line item per order line with a shipped quantity of zero MUST be created in one unit of work, and the whole creation MUST fail if any dependent record cannot be created.

#### Scenario: Order created with its dependents

- **GIVEN** an accepted purchase order with two lines
- **WHEN** it is persisted
- **THEN** the order, one contact record, one card record and two line items with shipped quantity 0 are stored together

#### Scenario: Dependent record fails

- **GIVEN** an accepted purchase order whose card record cannot be created
- **WHEN** it is persisted
- **THEN** no part of the order is stored

### Requirement: Single stored contact per purchase order

The legacy system SHALL store only one contact record per purchase order, taken from the shipping information, and WHEN a stored purchase order is read back SHALL report that stored contact as both the billing and the shipping information.

#### Scenario: Different billing and shipping contacts

- **GIVEN** an accepted purchase order with billing city "Boston" and shipping city "Austin"
- **WHEN** the stored order is read back
- **THEN** both its billing and its shipping information show city "Austin"

### Requirement: Order total stored as supplied

The system SHALL record the order total on the purchase order exactly as supplied by the incoming order and SHALL NOT recompute it from the line items.

#### Scenario: Supplied total differs from the lines

- **GIVEN** an incoming purchase order with total 50.00 whose lines sum to 47.00
- **WHEN** it is persisted
- **THEN** the stored order total is 50.00

### Requirement: Contact record creation

WHEN a contact record is created from supplied contact details the system SHALL copy the given name, family name, telephone and e-mail as supplied, without validation or transformation, and SHALL create and attach a new postal address from the supplied address details. IF the address cannot be created THEN the contact creation MUST fail.

#### Scenario: Contact created with its address

- **GIVEN** contact details with given name " Ann" and a street address
- **WHEN** a contact record is created
- **THEN** the given name is stored as " Ann" unchanged and a new address record is attached

### Requirement: Payment card record

The system SHALL record a payment card as three independently settable text values, card number, card type and expiry date, and SHALL accept them exactly as supplied with no format, check-digit, card-type or future-expiry check. WHEN an order is placed with a card THEN the system SHALL store a separate copy of the card's number, type and expiry with the order, so later changes to the card elsewhere do not alter the card on the order.

#### Scenario: Unchecked card accepted

- **GIVEN** a card number "abc", type "X" and expiry "13/1999"
- **WHEN** the card is recorded
- **THEN** the three values are stored exactly as supplied

#### Scenario: Account card changed after ordering

- **GIVEN** an order placed with a card, and the same card details later changed on the customer's account
- **WHEN** the order's card is read
- **THEN** it still shows the values recorded when the order was placed

### Requirement: Payment card expiry month and year

The system SHALL treat a card expiry date as text of the form "<month>/<year>", reading the month as the text before the first "/" and the year as all text after it. WHEN the stored expiry is empty or contains no "/" the legacy system SHALL report month "01" and year "2010" without signalling that the stored value was missing or malformed.

#### Scenario: Well-formed expiry

- **GIVEN** a stored card with expiry "10/2001"
- **WHEN** its expiry month and year are read
- **THEN** the month is "10" and the year is "2001"

#### Scenario: Malformed expiry

- **GIVEN** a stored card with expiry "Duke Express"
- **WHEN** its expiry month and year are read
- **THEN** the month is "01" and the year is "2010"

### Requirement: Line item record

The system SHALL store each order line with its category id, product id, item id, line number, ordered quantity, unit price and quantity shipped so far. Quantities MUST be whole numbers. The legacy system records the unit price as a single-precision binary floating-point number with no currency.

#### Scenario: Line stored

- **GIVEN** an order line for 3 units of item "EST-6" at unit price 18.50
- **WHEN** it is stored
- **THEN** the record holds its category, product and item ids, its line number, quantity 3, unit price 18.50 and quantity shipped 0
