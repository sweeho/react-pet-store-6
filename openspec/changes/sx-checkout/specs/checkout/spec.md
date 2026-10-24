## ADDED Requirements

### Requirement: Billing and shipping information screen pre-filled at checkout

ID: SWHR2-R-0005
Recovered from: CHECKOUT-REQ-0001
The system SHALL present the billing and shipping information form at checkout pre-filled with information already known for the signed-on customer, so that the customer MAY confirm it without re-entering it.

#### Scenario: Signed-on customer reaches the checkout form

- **GIVEN** a signed-on customer whose account holds a name, address, telephone and e-mail
- **WHEN** the customer proceeds to checkout
- **THEN** the billing and shipping information form is displayed with those known details already filled in

#### Scenario: Customer confirms the pre-filled form

- **GIVEN** the checkout form displayed with the customer's known details filled in
- **WHEN** the customer submits it without changing any field
- **THEN** the order proceeds using the pre-filled billing and shipping details

### Requirement: Order id from the 1001 sequence

ID: SWHR2-R-0006
Recovered from: CHECKOUT-RULE-0004
The system SHALL assign each newly placed order an order id drawn from the sequence with prefix "1001", so that order ids are issued as "10011", "10012", "10013" and so on.

#### Scenario: First orders placed

- **GIVEN** no order id has yet been issued from the "1001" sequence
- **WHEN** three orders are placed one after another
- **THEN** they receive the order ids "10011", "10012" and "10013"

### Requirement: Identifier request requires a prefix

ID: SWHR2-R-0007
Recovered from: CHECKOUT-RULE-0005
The system SHALL require a non-null prefix when an identifier is requested.

#### Scenario: Identifier requested without a prefix

- **GIVEN** a request for a new identifier
- **WHEN** no prefix is supplied
- **THEN** the request is refused and no identifier is issued

### Requirement: Unique order id from a shared counter

ID: SWHR2-R-0008
Recovered from: CHK-BR-0006
The system SHALL give every order a unique order id from a shared counter, requested with the starting value "1001".

#### Scenario: Two orders placed

- **GIVEN** an order has already been placed and received an order id
- **WHEN** a second order is placed
- **THEN** the second order receives a different order id issued from the same "1001" counter

### Requirement: Server Error page on unexpected failure

ID: SWHR2-R-0003
Recovered from: CHK-REQ-0010
WHEN an unexpected failure occurs while handling a storefront request THEN the system SHALL show a "Server Error" page with the error message and the technical error trace, asking the user to notify the administrator.

#### Scenario: Unexpected failure during order placement

- **GIVEN** order placement raises an unexpected failure
- **WHEN** the response is shown to the shopper
- **THEN** a "Server Error" page is displayed carrying the error message and the technical error trace, and asks the user to notify the administrator

### Requirement: Atomic purchase order creation

ID: SWHR2-R-0004
Recovered from: CHK-WF-0001
WHEN a purchase order is created THEN the system SHALL, in one transaction, store the order header fields, create and attach a contact record from the order's shipping information, create and attach a credit-card record from the order's card details, and create and attach one line item per order line with a shipped quantity of zero; IF any of those dependent records cannot be created THEN the order creation SHALL fail.

#### Scenario: Order created with its dependents

- **GIVEN** a purchase order with two order lines, shipping information and card details
- **WHEN** it is created
- **THEN** the order header, one contact record built from the shipping information, one credit-card record and two line items each with shipped quantity 0 are stored together

#### Scenario: Dependent record cannot be created

- **GIVEN** a purchase order whose credit-card record cannot be created
- **WHEN** it is created
- **THEN** the order creation fails and no part of the order is kept
