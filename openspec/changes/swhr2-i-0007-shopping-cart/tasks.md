## 1. Cart model

- [ ] 1.1 Define the session cart holding at most one line per item id with a whole-number quantity (SWHR2-T-0247; SWHR2-R-0114)
- [ ] 1.2 Create the cart lazily, once per browsing session, starting empty (SWHR2-T-0247; SWHR2-R-0114)
- [ ] 1.3 Keep cart contents in session scope only, with no durable storage (SWHR2-T-0247; SWHR2-R-0118)
- [ ] 1.4 Discard the cart and start a new empty one when the shopper signs out (SWHR2-T-0247; SWHR2-R-0114)

## 2. Cart operations

- [ ] 2.1 Implement add item from listing, item detail and search result with quantity 1 (SWHR2-T-0247; SWHR2-R-0144)
- [ ] 2.2 Implement add item with a supplied quantity that replaces any existing quantity, without validation (SWHR2-T-0247; SWHR2-R-0033)
- [ ] 2.3 Implement remove item regardless of quantity, with removal of an absent item as a no-op (SWHR2-T-0247; SWHR2-R-0146, SWHR2-R-0145)
- [ ] 2.4 Implement empty cart and call it once an order has been placed (SWHR2-T-0247; SWHR2-R-0147)
- [ ] 2.5 Allow every cart operation without sign-on or a role check (SWHR2-T-0247; SWHR2-R-0117)
- [ ] 2.6 Return cart lines without promising an order (SWHR2-T-0247; SWHR2-R-0034)

## 3. Failure routing

- [ ] 3.1 Map each failure kind to its configured error page, matching a more general kind when no exact mapping exists (SWHR2-T-0247; SWHR2-R-0116)
- [ ] 3.2 Configure the empty-cart order failure to show its error page (SWHR2-T-0247; SWHR2-R-0116)
- [ ] 3.3 Fail an unmapped failure with a general server error (SWHR2-T-0247; SWHR2-R-0116)

## 4. Shopping cart screen

- [ ] 4.1 Build the empty-cart state showing "Your Shopping Cart is Empty." (SWHR2-T-0247; SWHR2-R-0115)
- [ ] 4.2 Build the cart rows with linked attribute and name, Remove control, quantity field and currency unit price (SWHR2-T-0247; SWHR2-R-0115, SWHR2-R-0145)
- [ ] 4.3 Add the Update Cart control submitting the edited quantities (SWHR2-T-0247; SWHR2-R-0115)
- [ ] 4.4 Show the cart total as currency and the Check Out link to order information entry (SWHR2-T-0247; SWHR2-R-0115)
- [ ] 4.5 Wire add-to-cart links on the product listing, item detail and search result pages (SWHR2-T-0247; SWHR2-R-0144)

## 5. Verification

- [ ] 5.1 Test add with quantity 1, add with a supplied quantity, remove, absent-item remove and empty after order (SWHR2-T-0247; SWHR2-R-0144, SWHR2-R-0033, SWHR2-R-0146, SWHR2-R-0147)
- [ ] 5.2 Test the one-cart-per-session rule, session-only lifetime and sign-out discard (SWHR2-T-0247; SWHR2-R-0114, SWHR2-R-0118)
- [ ] 5.3 Test that anonymous visitors can use every cart operation (SWHR2-T-0247; SWHR2-R-0117)
- [ ] 5.4 Test error-page routing for mapped, general and unmapped failures (SWHR2-T-0247; SWHR2-R-0116)
- [ ] 5.5 Test the cart screen empty and populated states and the Remove and Check Out controls (SWHR2-T-0247; SWHR2-R-0115)
