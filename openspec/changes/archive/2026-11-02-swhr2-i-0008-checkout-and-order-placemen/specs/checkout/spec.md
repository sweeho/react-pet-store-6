## ADDED Requirements

### Requirement: Billing and shipping information screen pre-filled at checkout

ID: SWHR2-R-0005
Recovered from: CHECKOUT-REQ-0001
The system SHALL present the billing and shipping information form at checkout pre-filled with information already known for the signed-on customer, so that the customer MAY confirm it without re-entering it.

#### Scenario: Signed-on customer reaches the checkout form
ID: SWHR2-R-0005.01

- **GIVEN** a signed-on customer whose account holds a name, address, telephone and e-mail
- **WHEN** the customer proceeds to checkout
- **THEN** the billing and shipping information form is displayed with those known details already filled in

#### Scenario: Customer confirms the pre-filled form
ID: SWHR2-R-0005.02

- **GIVEN** the checkout form displayed with the customer's known details filled in
- **WHEN** the customer submits it without changing any field
- **THEN** the order proceeds using the pre-filled billing and shipping details

### Requirement: Order id from the 1001 sequence

ID: SWHR2-R-0006
Recovered from: CHECKOUT-RULE-0004
The system SHALL assign each newly placed order an order id drawn from the sequence with prefix "1001", so that order ids are issued as "10011", "10012", "10013" and so on.

#### Scenario: First orders placed
ID: SWHR2-R-0006.01

- **GIVEN** no order id has yet been issued from the "1001" sequence
- **WHEN** three orders are placed one after another
- **THEN** they receive the order ids "10011", "10012" and "10013"

### Requirement: Identifier request requires a prefix

ID: SWHR2-R-0007
Recovered from: CHECKOUT-RULE-0005
The system SHALL require a non-null prefix when an identifier is requested.

#### Scenario: Identifier requested without a prefix
ID: SWHR2-R-0007.01

- **GIVEN** a request for a new identifier
- **WHEN** no prefix is supplied
- **THEN** the request is refused and no identifier is issued

### Requirement: Unique order id from a shared counter

ID: SWHR2-R-0008
Recovered from: CHK-BR-0006
The system SHALL give every order a unique order id from a shared counter, requested with the starting value "1001".

#### Scenario: Two orders placed
ID: SWHR2-R-0008.01

- **GIVEN** an order has already been placed and received an order id
- **WHEN** a second order is placed
- **THEN** the second order receives a different order id issued from the same "1001" counter

### Requirement: Server Error page on unexpected failure

ID: SWHR2-R-0003
Recovered from: CHK-REQ-0010
WHEN an unexpected failure occurs while handling a storefront request THEN the system SHALL show a "Server Error" page with the error message and the technical error trace, asking the user to notify the administrator.

#### Scenario: Unexpected failure during order placement
ID: SWHR2-R-0003.01

- **GIVEN** order placement raises an unexpected failure
- **WHEN** the response is shown to the shopper
- **THEN** a "Server Error" page is displayed carrying the error message and the technical error trace, and asks the user to notify the administrator

### Requirement: Atomic purchase order creation

ID: SWHR2-R-0004
Recovered from: CHK-WF-0001
WHEN a purchase order is created THEN the system SHALL, in one transaction, store the order header fields, create and attach a contact record from the order's shipping information, create and attach a credit-card record from the order's card details, and create and attach one line item per order line with a shipped quantity of zero; IF any of those dependent records cannot be created THEN the order creation SHALL fail.

#### Scenario: Order created with its dependents
ID: SWHR2-R-0004.01

- **GIVEN** a purchase order with two order lines, shipping information and card details
- **WHEN** it is created
- **THEN** the order header, one contact record built from the shipping information, one credit-card record and two line items each with shipped quantity 0 are stored together

#### Scenario: Dependent record cannot be created
ID: SWHR2-R-0004.02

- **GIVEN** a purchase order whose credit-card record cannot be created
- **WHEN** it is created
- **THEN** the order creation fails and no part of the order is kept

### Requirement: Checkout hands the submitted order to order processing asynchronously

ID: SWHR2-R-0049
Recovered from: CHECKOUT-WF-0001
WHEN a signed-on customer checks out a cart THEN the system SHALL present the billing and shipping form already filled in for that customer, and WHEN the customer submits it THEN the system SHALL pass the order to order processing asynchronously, so that order approval MAY happen after the customer's request has completed.

#### Scenario: Customer submits the checkout form
ID: SWHR2-R-0049.01

- **GIVEN** a signed-on customer with one item in the cart who has proceeded to checkout
- **WHEN** the customer submits the pre-filled billing and shipping form
- **THEN** the customer's request completes and the order is handed to order processing to be approved afterwards

### Requirement: Purchase order exchanged as a structured order document

ID: SWHR2-R-0050
Recovered from: CHK-INT-0001
The system SHALL exchange a purchase order between the storefront and order processing as an XML document whose root element is "PurchaseOrder", and SHALL carry its payment card as a "CreditCard" element containing, in this order, "CardNumber", "CardType" and "ExpiryDate", each holding text. The system MUST reject a document whose root element is not "PurchaseOrder" with the error "PurchaseOrder element expected.", and MUST reject a card element that is not "CreditCard" with the error "CreditCard element expected.". The system SHALL be able to render a purchase order back to the same document form.

#### Scenario: Valid order document round-trips
ID: SWHR2-R-0050.01

- **GIVEN** a purchase order with card number, card type and expiry date
- **WHEN** it is rendered to an order document and read back
- **THEN** the document's root element is "PurchaseOrder", its card appears as "CreditCard" with "CardNumber", "CardType" and "ExpiryDate" in that order, and the order read back equals the original

#### Scenario: Document is not a purchase order
ID: SWHR2-R-0050.02

- **GIVEN** an XML document whose root element is "Invoice"
- **WHEN** it is submitted as a purchase order
- **THEN** it is rejected with the error "PurchaseOrder element expected." and no order is created

#### Scenario: Card element is not a credit card
ID: SWHR2-R-0050.03

- **GIVEN** an order document whose card position holds an element other than "CreditCard"
- **WHEN** the card is read
- **THEN** it is rejected with the error "CreditCard element expected."

### Requirement: Identifier request fails when its sequence is unavailable

ID: SWHR2-R-0051
Recovered from: CHK-REQ-0007
WHEN an identifier is requested and the sequence for its prefix cannot be created, or the sequence store cannot be located, THEN the system SHALL fail the request with an error and MUST NOT issue an identifier.

#### Scenario: Sequence cannot be created for a new prefix
ID: SWHR2-R-0051.01

- **GIVEN** a prefix for which no sequence exists and creating one fails
- **WHEN** an identifier is requested for that prefix
- **THEN** the request fails with an error and no identifier is issued

#### Scenario: Sequence store cannot be located
ID: SWHR2-R-0051.02

- **GIVEN** the sequence store is unavailable
- **WHEN** an identifier is requested
- **THEN** the request fails with an error and no identifier is issued

### Requirement: Purchase order identified and retrieved by its order id

ID: SWHR2-R-0052
Recovered from: CHK-RULE-0001
The system SHALL identify each purchase order uniquely by its order id, and SHALL retrieve a purchase order by that id.

#### Scenario: Order looked up by its id
ID: SWHR2-R-0052.01

- **GIVEN** a stored purchase order with order id "10011"
- **WHEN** a purchase order is requested by id "10011"
- **THEN** that purchase order is returned

#### Scenario: Second order with an existing id
ID: SWHR2-R-0052.02

- **GIVEN** a stored purchase order with order id "10011"
- **WHEN** another purchase order with order id "10011" is created
- **THEN** the creation is refused and the stored order is unchanged
