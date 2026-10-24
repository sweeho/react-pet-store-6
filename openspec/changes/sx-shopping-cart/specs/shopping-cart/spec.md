## ADDED Requirements

### Requirement: One cart per shopping session

The system SHALL keep exactly one shopping cart for each browsing session, created empty on first use. The cart MUST hold at most one line per catalog item, and each line SHALL record the item identifier and a whole-number quantity.

#### Scenario: First use of the cart in a session

- **GIVEN** a new browsing session that has not used the cart
- **WHEN** the shopper opens the cart
- **THEN** an empty cart is created for that session and its item count is 0

#### Scenario: Two sessions have separate carts

- **GIVEN** two shoppers browsing in separate sessions
- **WHEN** the first shopper adds item EST-1 to the cart
- **THEN** the second shopper's cart does not contain EST-1

### Requirement: Cart session lifetime

The system SHALL hold cart contents only for the life of the browsing session and MUST NOT store them durably. When the shopper signs out, the system SHALL discard the cart and start a new, empty one.

#### Scenario: Shopper signs out with items in the cart

- **GIVEN** a signed-on shopper whose cart holds item EST-1 with quantity 2
- **WHEN** the shopper signs out
- **THEN** the shopper's cart is empty afterwards

#### Scenario: Session ends

- **GIVEN** a cart holding items in a browsing session
- **WHEN** the session ends
- **THEN** the cart contents are not retrievable by any later session

### Requirement: Anonymous use of the cart

The system SHALL allow any visitor to add, update, remove and view cart items without signing on, and MUST NOT apply a role check to cart operations.

#### Scenario: Anonymous visitor adds an item

- **GIVEN** a visitor who has not signed on
- **WHEN** the visitor adds item EST-1 to the cart
- **THEN** the item is added and the visitor is not asked to sign on

### Requirement: Add item to cart

The system SHALL let a shopper add an item to the cart from the product listing, the item detail page or a search result. Adding an item SHALL set that item's cart quantity to 1. When the item is already in the cart, its quantity SHALL be reset to 1 and MUST NOT be incremented.

#### Scenario: Item not yet in the cart

- **GIVEN** a cart that does not contain item EST-1
- **WHEN** the shopper adds EST-1
- **THEN** the cart contains EST-1 with quantity 1

#### Scenario: Item already in the cart

- **GIVEN** a cart that contains item EST-1 with quantity 3
- **WHEN** the shopper adds EST-1 again
- **THEN** the cart contains one line for EST-1 with quantity 1

### Requirement: Update cart quantities

The system SHALL let the shopper submit new quantities for all cart lines in one update, and SHALL replace each line's quantity with the submitted value. A submitted value that is not a whole number SHALL be treated as 0. A line whose new quantity is 0 or less SHALL be removed from the cart. The system SHALL NOT apply an upper limit to the quantity. A submitted quantity greater than 0 for an item not in the cart SHALL add that item with that quantity.

#### Scenario: Quantity increased

- **GIVEN** a cart holding item EST-1 with quantity 1
- **WHEN** the shopper submits quantity 4 for EST-1
- **THEN** EST-1 has quantity 4

#### Scenario: Quantity set to zero

- **GIVEN** a cart holding items EST-1 and EST-2
- **WHEN** the shopper submits quantity 0 for EST-1 and 2 for EST-2
- **THEN** EST-1 is removed from the cart and EST-2 has quantity 2

#### Scenario: Negative quantity

- **GIVEN** a cart holding item EST-1 with quantity 2
- **WHEN** the shopper submits quantity -1 for EST-1
- **THEN** EST-1 is removed from the cart

#### Scenario: Non-numeric quantity

- **GIVEN** a cart holding item EST-1 with quantity 2
- **WHEN** the shopper submits "abc" as the quantity for EST-1
- **THEN** the value is treated as 0, EST-1 is removed from the cart, and no error is shown

### Requirement: Remove item from cart

The system SHALL let the shopper remove an individual item line from the cart regardless of its quantity. Removing an item that is not in the cart SHALL leave the cart unchanged.

#### Scenario: Remove a line

- **GIVEN** a cart holding item EST-1 with quantity 5 and item EST-2 with quantity 1
- **WHEN** the shopper removes EST-1
- **THEN** the cart holds only EST-2 with quantity 1

#### Scenario: Remove an item not in the cart

- **GIVEN** a cart holding only item EST-2
- **WHEN** a removal of item EST-1 is requested
- **THEN** the cart still holds only EST-2 and no error is raised

### Requirement: Empty cart after order placement

The system SHALL remove every line from the shopper's cart once an order has been placed from it.

#### Scenario: Order placed

- **GIVEN** a signed-on customer whose cart holds two item lines
- **WHEN** the customer places the order
- **THEN** the customer's cart is empty and its item count is 0

### Requirement: Cart item count

The system SHALL report the cart's item count as the number of distinct item lines in the cart, not the sum of their quantities.

#### Scenario: Multiple units of one item

- **GIVEN** a cart holding item EST-1 with quantity 3 and item EST-2 with quantity 1
- **WHEN** the item count is read
- **THEN** the count is 2

### Requirement: Cart line details

The system SHALL present each cart line with the item identifier, product identifier, category, product name, item attribute, quantity, unit price and a line total equal to quantity multiplied by unit price. The unit price SHALL be the item's current catalog list price, read when the cart is listed, not when the item was added.

#### Scenario: Line total

- **GIVEN** a cart line for an item whose catalog list price is 18.50 with quantity 2
- **WHEN** the cart contents are listed
- **THEN** the line shows unit price 18.50 and line total 37.00

#### Scenario: Price changed after adding

- **GIVEN** an item added to the cart when its list price was 18.50
- **WHEN** the catalog list price changes to 20.00 and the cart is listed again
- **THEN** the line shows unit price 20.00

### Requirement: Cart subtotal

The system SHALL calculate the cart subtotal as the sum, over all listed cart lines, of the current catalog list price multiplied by the line quantity. The subtotal MUST NOT include tax, shipping or discount, and the legacy system applies no explicit rounding step.

#### Scenario: Two lines

- **GIVEN** a cart holding 2 of an item priced 18.50 and 1 of an item priced 10.00
- **WHEN** the subtotal is calculated
- **THEN** the subtotal is 47.00

#### Scenario: Empty cart

- **GIVEN** an empty cart
- **WHEN** the subtotal is calculated
- **THEN** the subtotal is 0

### Requirement: Cart contents in the shopper's locale

The system SHALL read cart line details (product name, attribute, category and unit price) from the catalog in the shopper's current locale, and SHALL use US English when no locale has been set.

#### Scenario: No locale chosen

- **GIVEN** a shopper who has not chosen a language
- **WHEN** the cart contents are listed
- **THEN** each line's name, attribute, category and price come from the US English catalog

#### Scenario: Locale changed

- **GIVEN** a cart holding item EST-1 and a shopper who switches to Japanese
- **WHEN** the cart contents are listed
- **THEN** EST-1's details and price come from the Japanese catalog

### Requirement: Cart line whose catalog lookup fails

When the catalog cannot be consulted for a cart line, the system SHALL leave that line out of the listed contents and the subtotal without a message to the shopper. It SHALL keep the line in the cart and SHALL still count it in the item count.

#### Scenario: Catalog unavailable for one line

- **GIVEN** a cart holding items EST-1 and EST-2, and the catalog lookup for EST-2 fails
- **WHEN** the cart contents and subtotal are read
- **THEN** only EST-1 is listed, the subtotal covers only EST-1, the item count is 2, and EST-2 remains in the cart

### Requirement: Cart line order

The system MAY list cart lines in any order. It SHALL NOT guarantee that lines appear in the order they were added.

#### Scenario: Lines listed

- **GIVEN** a cart to which items EST-1, EST-2 and EST-3 were added in that order
- **WHEN** the cart contents are listed
- **THEN** all three lines are listed exactly once, in an order the shopper cannot rely on

### Requirement: Shopping cart screen

The shopping cart screen SHALL show "Your Shopping Cart is Empty." when the cart item count is 0. Otherwise it SHALL show a "Shopping Cart" title and one row per listed cart line. Each row MUST carry the item attribute and product name linked to the item's detail page, a Remove control for that line, an editable quantity field pre-filled with the line's quantity, and the unit price formatted as currency. Below the rows the screen SHALL show an Update Cart control, the cart subtotal labelled "Total:" formatted as currency, and a Check Out link to order information entry. Update Cart SHALL submit every row's quantity field in one update. Remove SHALL remove that row's item.

#### Scenario: Cart with items is displayed

- **GIVEN** a cart holding 2 of item EST-1 ("Large Angelfish", list price 16.50)
- **WHEN** the shopping cart screen is displayed
- **THEN** it shows a row with "Large Angelfish" linked to EST-1's detail page, a Remove control, a quantity field containing 2 and the unit price $16.50, followed by Update Cart, "Total:" $33.00 and a Check Out link

#### Scenario: Empty cart is displayed

- **GIVEN** a cart with item count 0
- **WHEN** the shopping cart screen is displayed
- **THEN** it shows "Your Shopping Cart is Empty." and no rows, total, Update Cart or Check Out link

#### Scenario: Update Cart submitted

- **GIVEN** the cart screen showing EST-1 with quantity 2 and EST-2 with quantity 1
- **WHEN** the shopper changes EST-1 to 3 and EST-2 to 0 and activates Update Cart
- **THEN** the screen is redisplayed showing only EST-1 with quantity 3 and the total recalculated

#### Scenario: Remove activated

- **GIVEN** the cart screen showing EST-1 and EST-2
- **WHEN** the shopper activates Remove on the EST-1 row
- **THEN** the screen is redisplayed showing only EST-2

#### Scenario: Check Out activated

- **GIVEN** the cart screen showing at least one row
- **WHEN** the shopper activates Check Out
- **THEN** the shopper is taken to order information entry, which requires sign-on
