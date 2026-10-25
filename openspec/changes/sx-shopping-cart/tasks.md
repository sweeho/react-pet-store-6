## 1. Cart model

- [ ] 1.1 Define the session cart holding at most one line per item id with a whole-number quantity
- [ ] 1.2 Create the cart lazily, once per browsing session, starting empty
- [ ] 1.3 Keep cart contents in session scope only, with no durable storage
- [ ] 1.4 Discard the cart and start a new empty one when the shopper signs out

## 2. Cart operations

- [ ] 2.1 Implement add item from listing, item detail and search result with quantity 1
- [ ] 2.2 Implement add item with a supplied quantity that replaces any existing quantity, without validation
- [ ] 2.3 Implement remove item regardless of quantity, with removal of an absent item as a no-op
- [ ] 2.4 Implement empty cart and call it once an order has been placed
- [ ] 2.5 Allow every cart operation without sign-on or a role check
- [ ] 2.6 Return cart lines without promising an order

## 3. Failure routing

- [ ] 3.1 Map each failure kind to its configured error page, matching a more general kind when no exact mapping exists
- [ ] 3.2 Configure the empty-cart order failure to show its error page
- [ ] 3.3 Fail an unmapped failure with a general server error

## 4. Shopping cart screen

- [ ] 4.1 Build the empty-cart state showing "Your Shopping Cart is Empty."
- [ ] 4.2 Build the cart rows with linked attribute and name, Remove control, quantity field and currency unit price
- [ ] 4.3 Add the Update Cart control submitting the edited quantities
- [ ] 4.4 Show the cart total as currency and the Check Out link to order information entry
- [ ] 4.5 Wire add-to-cart links on the product listing, item detail and search result pages

## 5. Verification

- [ ] 5.1 Test add with quantity 1, add with a supplied quantity, remove, absent-item remove and empty after order
- [ ] 5.2 Test the one-cart-per-session rule, session-only lifetime and sign-out discard
- [ ] 5.3 Test that anonymous visitors can use every cart operation
- [ ] 5.4 Test error-page routing for mapped, general and unmapped failures
- [ ] 5.5 Test the cart screen empty and populated states and the Remove and Check Out controls
