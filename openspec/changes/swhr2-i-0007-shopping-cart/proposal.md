# Proposal: Shopping cart (extracted from Java Pet Store 1.3.2)

## Why

The shopping cart is where a shopper collects catalog items before checkout. The rebuild must reproduce how the legacy storefront adds, updates, removes, counts and totals cart lines, and what the cart page shows. The business also needs a record of where the legacy behaviour is questionable before deciding what to keep.

## What changes

Adds the `shopping-cart` capability, covering the 11 approved requirements:

- One cart per browsing session, created on first use, held for the session only and discarded on sign-out.
- Cart use without sign-on or a security role.
- Adding an item from the listing, item page or search result with quantity one, and adding an item with a supplied quantity that replaces the existing one.
- Removing a line (regardless of quantity, a no-op for an absent item) and emptying the cart after an order is placed.
- No guaranteed order of cart lines.
- Routing a request failure to its configured error page, such as the empty-cart order error.
- The shopping cart screen.

## Impact

- Spec: `specs/shopping-cart/spec.md` (11 requirements, each carrying its approved key; 1 of them is the screen).
- Not specified: the remaining extracted records (quantity update, item count, subtotal, line details, locale, lookup failure, re-add reset) are pending SME decision and are left out of the spec until approved.
- Neighbouring capabilities: catalog-browsing (the item lookup behind every cart line, and the add-to-cart links), checkout (the Check Out link, the order total and the empty-cart order refusal), sign-on (sign-out discards the cart), localization (currency formatting).
- Three suspected legacy defects and two open questions are listed in `design.md` for the Business Owner and Intent.
- Recommendations for the records still awaiting a decision are in `legacy-analysis/ir/_recommendations/shopping-cart.yaml`.
