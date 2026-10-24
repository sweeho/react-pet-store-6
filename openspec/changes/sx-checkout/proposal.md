# Proposal: Checkout and order placement (extracted from Java Pet Store 1.3.2)

## Why

Checkout is how a signed-on customer turns a cart into an order. The rebuild must reproduce what the legacy storefront shows, accepts and hands to order processing, and the business needs a record of where the legacy behaviour is questionable before deciding what to keep.

## What changes

Adds the `checkout` capability, covering:

- The order information entry screen (billing and shipping capture, pre-filled from the account) and its validation rules.
- Refusal of an empty-cart order and its error screen.
- Order composition: header fields, lines, total, the fixed payment card, and order id issue from the "1001" sequence.
- Asynchronous hand-off of the purchase order document to order processing, and the order complete screen.
- The purchase order, card, line item and contact document formats and their persistence on the order processing side.

## Impact

- Spec: `specs/checkout/spec.md` (27 draft requirements, 2 of them screens). No requirement is approved yet, so none carries a key.
- Neighbouring capabilities: customer-account (stored contact and card), sign-on (session customer used for pre-fill), shopping cart (cart contents and emptying), order-approval and order-fulfillment (consumers of the purchase order).
- Ten suspected legacy defects and three open questions are listed in `design.md` for the Business Owner and Intent.
