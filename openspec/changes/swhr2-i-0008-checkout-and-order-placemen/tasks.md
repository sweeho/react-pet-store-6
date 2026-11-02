## 1. Data model

- [ ] 1.1 Define the purchase order entity with order id key, user id, e-mail, order date to the millisecond, locale and total (SWHR2-T-0290; SWHR2-R-0052, SWHR2-R-0004)
- [ ] 1.2 Define the order-owned contact and address records with cascade delete (SWHR2-T-0290; SWHR2-R-0004)
- [ ] 1.3 Define the order-owned payment card record holding number, type and expiry as text (SWHR2-T-0290; SWHR2-R-0004)
- [ ] 1.4 Define the line item record with ids, line number, whole-number quantity, unit price and quantity shipped (SWHR2-T-0290; SWHR2-R-0004)
- [ ] 1.5 Define the id sequence table keyed by prefix with a mandatory integer value (SWHR2-T-0290; SWHR2-R-0006, SWHR2-R-0051)
- [ ] 1.6 Generate and commit the migration for the checkout tables (SWHR2-T-0290; SWHR2-R-0004, SWHR2-R-0006)

## 2. Order id issue

- [ ] 2.1 Implement prefix-plus-next-value id issue with an atomic increment by 1 inside the caller's unit of work (SWHR2-T-0290; SWHR2-R-0006, SWHR2-R-0008)
- [ ] 2.2 Create a missing sequence at 0 so the first id is the prefix followed by 1 (SWHR2-T-0290; SWHR2-R-0006)
- [ ] 2.3 Fail the request with an error and issue no id when the sequence cannot be created or reached (SWHR2-T-0290; SWHR2-R-0051)
- [ ] 2.4 Reject a null prefix (SWHR2-T-0290; SWHR2-R-0007)
- [ ] 2.5 Use the "1001" prefix for storefront order ids (SWHR2-T-0290; SWHR2-R-0006)

## 3. Order information entry screen

- [ ] 3.1 Build the Billing Information and Shipping Information sections with the ten contact fields each (SWHR2-T-0290; SWHR2-R-0005)
- [ ] 3.2 Pre-fill both sections from the signed-on customer's account contact details (SWHR2-T-0290; SWHR2-R-0005)
- [ ] 3.3 Offer the fixed state lists per store language and the billing and shipping country lists (SWHR2-T-0290; SWHR2-R-0005)
- [ ] 3.4 Alert on empty required fields and empty e-mail before submission (SWHR2-T-0290; SWHR2-R-0005)
- [ ] 3.5 Restrict the screen to signed-on customers and submit to the order placement endpoint (SWHR2-T-0290; SWHR2-R-0005, SWHR2-R-0049)

## 4. Order placement

- [ ] 4.1 Trim submitted values and enforce the required billing and shipping fields on the server (SWHR2-T-0290; SWHR2-R-0005)
- [ ] 4.2 Refuse an empty-cart order and render the Order Error screen (SWHR2-T-0290; SWHR2-R-0049)
- [ ] 4.3 Build order lines numbered from 0 in cart order (SWHR2-T-0290; SWHR2-R-0004)
- [ ] 4.4 Compute the order total as the sum of unit price times quantity with no tax, shipping or discount (SWHR2-T-0290; SWHR2-R-0049)
- [ ] 4.5 Populate the order header from the session, the billing contact, the current date and the locale (SWHR2-T-0290; SWHR2-R-0005)
- [ ] 4.6 Attach the payment card as decided for the fixed-card defect (SWHR2-T-0290; SWHR2-R-0004)
- [ ] 4.7 Render the order complete screen with order id and confirmation e-mail address (SWHR2-T-0290; SWHR2-R-0049)
- [ ] 4.8 Render the Server Error page for unexpected failures (SWHR2-T-0290; SWHR2-R-0003)

## 5. Order hand-off and intake

- [ ] 5.1 Serialise the purchase order document with elements in the required order and default locale en_US (SWHR2-T-0290; SWHR2-R-0050)
- [ ] 5.2 Serialise and parse the CreditCard, LineItem and ContactInfo elements with their rejection messages (SWHR2-T-0290; SWHR2-R-0050)
- [ ] 5.3 Write the order date as yyyy-MM-dd and apply the decided rule for unparseable dates (SWHR2-T-0290; SWHR2-R-0050)
- [ ] 5.4 Queue the order document as one message within the placing unit of work (SWHR2-T-0290; SWHR2-R-0049)
- [ ] 5.5 Report a hand-off failure to the caller and empty the cart only after a successful hand-off decision (SWHR2-T-0290; SWHR2-R-0049)
- [ ] 5.6 Receive queued orders, reject unparseable or invalid documents, and persist accepted ones atomically with shipped quantity 0 (SWHR2-T-0290; SWHR2-R-0004, SWHR2-R-0050, SWHR2-R-0052)
- [ ] 5.7 Store the order total as supplied without recomputation (SWHR2-T-0290; SWHR2-R-0004)

## 6. Payment card handling

- [ ] 6.1 Store a separate card copy per order (SWHR2-T-0290; SWHR2-R-0004)
- [ ] 6.2 Read expiry month and year from the "<month>/<year>" text with the decided fallback (SWHR2-T-0290; SWHR2-R-0050)

## 7. Verification

- [ ] 7.1 Unit tests for id issue, total computation and line numbering (SWHR2-T-0290; SWHR2-R-0006, SWHR2-R-0007, SWHR2-R-0008)
- [ ] 7.2 Integration tests for order placement, empty-cart refusal and hand-off failure (SWHR2-T-0290; SWHR2-R-0049, SWHR2-R-0003)
- [ ] 7.3 Document parse and serialise tests for purchase order, card, line item and contact (SWHR2-T-0290; SWHR2-R-0050)
- [ ] 7.4 UI tests for the order information entry and order complete screens (SWHR2-T-0290; SWHR2-R-0005, SWHR2-R-0003)
