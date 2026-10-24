## 1. Cart model

- [ ] 1.1 Define the session cart holding at most one line per item id with a whole-number quantity
- [ ] 1.2 Define the cart line view with item id, product id, category, name, attribute, quantity, unit price and line total
- [ ] 1.3 Create the cart lazily, once per browsing session, starting empty
- [ ] 1.4 Keep cart contents in session scope only, with no durable storage
- [ ] 1.5 Discard the cart and start a new empty one when the shopper signs out

## 2. Cart operations

- [ ] 2.1 Implement add item, setting the quantity to 1 and resetting an existing line to 1
- [ ] 2.2 Implement update quantities for all submitted lines in one operation
- [ ] 2.3 Treat a non-numeric submitted quantity as 0
- [ ] 2.4 Remove a line whose updated quantity is 0 or less, and add an absent item submitted with a positive quantity
- [ ] 2.5 Implement remove item, with removal of an absent item as a no-op
- [ ] 2.6 Implement empty cart and call it once an order has been placed
- [ ] 2.7 Allow every cart operation without sign-on or a role check

## 3. Cart reads

- [ ] 3.1 Implement the item count as the number of distinct lines
- [ ] 3.2 Resolve each line's details and list price from the catalog at read time
- [ ] 3.3 Read line details in the shopper's locale, defaulting to US English
- [ ] 3.4 Calculate the subtotal as the sum of list price times quantity with no tax, shipping or discount
- [ ] 3.5 Omit a line whose catalog lookup fails from listing and subtotal while keeping and counting it
- [ ] 3.6 Return cart lines without promising an order

## 4. Shopping cart screen

- [ ] 4.1 Build the empty-cart state showing "Your Shopping Cart is Empty."
- [ ] 4.2 Build the cart rows with linked attribute and name, Remove control, quantity field and unit price
- [ ] 4.3 Add the Update Cart control submitting every row's quantity in one update
- [ ] 4.4 Show the subtotal labelled "Total:" as currency and the Check Out link to order information entry
- [ ] 4.5 Wire add-to-cart links on the product listing, item detail and search result pages

## 5. Verification

- [ ] 5.1 Test add, re-add reset, update, non-numeric and negative quantities, remove and empty
- [ ] 5.2 Test item count, subtotal and live price re-read
- [ ] 5.3 Test the failed-lookup line omission and the locale default
- [ ] 5.4 Test the cart screen empty and populated states and each control
- [ ] 5.5 Test that sign-out discards the cart and anonymous visitors can use it
