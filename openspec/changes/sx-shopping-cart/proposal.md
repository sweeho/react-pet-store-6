# Proposal: Shopping cart (extracted from Java Pet Store 1.3.2)

## Why

The shopping cart is where a shopper collects catalog items before checkout. The rebuild must reproduce how the legacy storefront adds, updates, removes, counts and totals cart lines, and what the cart page shows. The business also needs a record of where the legacy behaviour is questionable before deciding what to keep.

## What changes

Adds the `shopping-cart` capability, covering:

- One cart per browsing session, holding at most one line per item, kept in memory only and discarded on sign-out.
- Adding an item (always quantity 1, also when the item is already in the cart), updating all quantities in one submission, removing a line, and emptying the cart after an order is placed.
- The cart item count (distinct lines) and the subtotal (live catalog list price times quantity, no tax, shipping, discount or rounding).
- Locale-dependent cart line details, and the omission of a line whose catalog lookup fails.
- Anonymous use of the cart.
- The shopping cart screen.

## Impact

- Spec: `specs/shopping-cart/spec.md` (14 draft requirements, 1 of them a screen). No requirement is approved yet, so none carries a key.
- Neighbouring capabilities: catalog-browsing (the item lookup behind every cart line, and the add-to-cart links), checkout (the Check Out link, the order total and the empty-cart order refusal), sign-on (sign-out discards the cart), localization (cart line details and currency formatting).
- Three suspected legacy defects and two open questions are listed in `design.md` for the Business Owner and Intent.
- Recommendations for each extracted record are in `legacy-analysis/ir/_recommendations/shopping-cart.yaml`.
