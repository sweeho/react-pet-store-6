## ADDED Requirements

### Requirement: One cart per browsing session

ID: SWHR2-R-0114
Recovered from: CART-RULE-0005
The system SHALL keep exactly one shopping cart per browsing session, created empty on first use, and SHALL discard that cart when the shopper signs out, so that the shopper continues with a new, empty cart.

#### Scenario: First use of the cart in a session
ID: SWHR2-R-0114.01

- **GIVEN** a new browsing session that has not used the cart
- **WHEN** the shopper opens the cart
- **THEN** an empty cart is created for that session

#### Scenario: Two sessions have separate carts
ID: SWHR2-R-0114.02

- **GIVEN** two shoppers browsing in separate sessions
- **WHEN** the first shopper adds item EST-1 to the cart
- **THEN** the second shopper's cart does not contain EST-1

#### Scenario: Shopper signs out with items in the cart
ID: SWHR2-R-0114.03

- **GIVEN** a signed-on shopper whose cart holds item EST-1
- **WHEN** the shopper signs out
- **THEN** the shopper's cart is empty afterwards

### Requirement: Cart held for the session only

ID: SWHR2-R-0118
Recovered from: SC-BR-0008
The system SHALL hold cart contents only for the life of the shopping session and MUST NOT store the cart durably.

#### Scenario: Session ends
ID: SWHR2-R-0118.01

- **GIVEN** a cart holding items in a browsing session
- **WHEN** the session ends
- **THEN** the cart contents are not retrievable by any later session

### Requirement: Cart use without a security role

ID: SWHR2-R-0117
Recovered from: SC-BR-0007
The system SHALL allow every cart operation without requiring the caller to sign on or hold any security role.

#### Scenario: Anonymous visitor adds an item
ID: SWHR2-R-0117.01

- **GIVEN** a visitor who has not signed on
- **WHEN** the visitor adds item EST-1 to the cart
- **THEN** the item is added and the visitor is not asked to sign on

#### Scenario: Anonymous visitor removes an item
ID: SWHR2-R-0117.02

- **GIVEN** a visitor who has not signed on and whose cart holds item EST-1
- **WHEN** the visitor removes EST-1
- **THEN** EST-1 is removed and no role check refuses the operation

### Requirement: Add item to cart

ID: SWHR2-R-0144
Recovered from: CART-REQ-0001
The system SHALL let a shopper add an item to the shopping cart from the product listing, the item detail page or a search result, and SHALL add it with a quantity of one.

#### Scenario: Add from the product listing
ID: SWHR2-R-0144.01

- **GIVEN** a cart that does not contain item EST-1
- **WHEN** the shopper adds EST-1 from the product listing
- **THEN** the cart contains EST-1 with quantity 1

#### Scenario: Add from a search result
ID: SWHR2-R-0144.02

- **GIVEN** a cart that does not contain item EST-2 and a search result listing EST-2
- **WHEN** the shopper adds EST-2 from the search result
- **THEN** the cart contains EST-2 with quantity 1

### Requirement: Add item with a supplied quantity

ID: SWHR2-R-0033
Recovered from: SC-BR-0009
The system SHALL be able to add an item to the cart with a caller-supplied quantity, replacing any existing quantity for that item, and SHALL NOT validate the supplied quantity.

#### Scenario: Item not yet in the cart
ID: SWHR2-R-0033.01

- **GIVEN** a cart that does not contain item EST-1
- **WHEN** EST-1 is added with quantity 5
- **THEN** the cart contains EST-1 with quantity 5

#### Scenario: Item already in the cart
ID: SWHR2-R-0033.02

- **GIVEN** a cart that contains item EST-1 with quantity 3
- **WHEN** EST-1 is added with quantity 2
- **THEN** the cart contains one line for EST-1 with quantity 2

### Requirement: Remove control for a cart line

ID: SWHR2-R-0145
Recovered from: CART-REQ-0002
The system SHALL let the shopper remove an individual item line from the shopping cart.

#### Scenario: Shopper removes one line
ID: SWHR2-R-0145.01

- **GIVEN** a cart holding items EST-1 and EST-2
- **WHEN** the shopper chooses to remove EST-1
- **THEN** the cart holds only EST-2

### Requirement: Item removal semantics

ID: SWHR2-R-0146
Recovered from: SC-REQ-0001
The system SHALL remove an item from the cart entirely, together with its quantity, when the shopper deletes it, regardless of that quantity. Deleting an item that is not in the cart SHALL leave the cart unchanged.

#### Scenario: Remove a line with several units
ID: SWHR2-R-0146.01

- **GIVEN** a cart holding item EST-1 with quantity 5 and item EST-2 with quantity 1
- **WHEN** EST-1 is deleted
- **THEN** the cart holds only EST-2 with quantity 1

#### Scenario: Remove an item not in the cart
ID: SWHR2-R-0146.02

- **GIVEN** a cart holding only item EST-2
- **WHEN** a deletion of item EST-1 is requested
- **THEN** the cart still holds only EST-2 and no error is raised

### Requirement: Empty cart after order placement

ID: SWHR2-R-0147
Recovered from: SC-REQ-0002
The system SHALL remove every line from the shopper's cart, leaving it empty, once an order has been placed from it.

#### Scenario: Order placed
ID: SWHR2-R-0147.01

- **GIVEN** a signed-on customer whose cart holds two item lines
- **WHEN** the customer places the order
- **THEN** the customer's cart is empty

### Requirement: Cart line order

ID: SWHR2-R-0034
Recovered from: SC-BR-0010
The system SHALL NOT guarantee any particular order of cart lines when listing the cart contents, and MAY list them in any order.

#### Scenario: Lines listed
ID: SWHR2-R-0034.01

- **GIVEN** a cart to which items EST-1, EST-2 and EST-3 were added in that order
- **WHEN** the cart contents are listed
- **THEN** all three lines are listed exactly once, in an order the shopper cannot rely on

### Requirement: Failure routing to an error page

ID: SWHR2-R-0116
Recovered from: CART-WF-0008
The system SHALL route a failure raised while handling a request to the error page configured for that kind of failure, or for a more general kind it belongs to. When no error page is configured for the failure, the request SHALL fail with a general server error.

#### Scenario: Order attempted with an empty cart
ID: SWHR2-R-0116.01

- **GIVEN** an error page configured for the empty-cart order failure
- **WHEN** a shopper submits an order while the cart is empty
- **THEN** the shopper is shown the empty-cart order error page

#### Scenario: Failure matched by a more general kind
ID: SWHR2-R-0116.02

- **GIVEN** an error page configured only for a general failure kind
- **WHEN** a request raises a more specific failure that belongs to that kind
- **THEN** the shopper is shown the general failure's error page

#### Scenario: Unmapped failure
ID: SWHR2-R-0116.03

- **GIVEN** no error page configured for a failure or any kind it belongs to
- **WHEN** a request raises that failure
- **THEN** the request fails with a general server error

### Requirement: Shopping cart screen

ID: SWHR2-R-0115
Recovered from: CART-SCR-0004
The shopping cart screen SHALL show "Your Shopping Cart is Empty." when the cart holds no items. Otherwise it SHALL list one row per cart line, and each row MUST carry the item attribute and product name linked to the item's detail page, a Remove control for that line, an editable quantity field pre-filled with the line's quantity, and the unit price formatted as currency. Below the rows the screen SHALL show an Update Cart control that submits the edited quantities, the cart total formatted as currency, and a Check Out link to order information entry.

#### Scenario: Cart with items is displayed
ID: SWHR2-R-0115.01

- **GIVEN** a cart holding 2 of item EST-1 ("Large Angelfish", unit price 16.50)
- **WHEN** the shopping cart screen is displayed
- **THEN** it shows a row with "Large Angelfish" linked to EST-1's detail page, a Remove control, a quantity field containing 2 and the unit price $16.50, followed by an Update Cart control, the cart total and a Check Out link

#### Scenario: Empty cart is displayed
ID: SWHR2-R-0115.02

- **GIVEN** a cart holding no items
- **WHEN** the shopping cart screen is displayed
- **THEN** it shows "Your Shopping Cart is Empty." and no rows, total, Update Cart control or Check Out link

#### Scenario: Remove activated
ID: SWHR2-R-0115.03

- **GIVEN** the cart screen showing EST-1 and EST-2
- **WHEN** the shopper activates Remove on the EST-1 row
- **THEN** the screen is redisplayed showing only EST-2

#### Scenario: Check Out activated
ID: SWHR2-R-0115.04

- **GIVEN** the cart screen showing at least one row
- **WHEN** the shopper activates Check Out
- **THEN** the shopper is taken to order information entry
