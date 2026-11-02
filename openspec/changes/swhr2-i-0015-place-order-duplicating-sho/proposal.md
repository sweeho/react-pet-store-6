## Why

The global navigation lists a "Place order" entry under Shop that leads to the cart page, the same destination as "Shopping cart". Navigation entries are highlighted by destination, so both entries are highlighted together on the cart page, and the menu offers two ways into one page. There is no place-order page: an order is placed from checkout, reached from the cart (defect SWHR2-T-0324, capability brief SWHR2-I-0015).

## What Changes

- Remove the "Place order" entry from the global navigation. The Shop group lists Catalog & search, Shopping cart and Language.
- Add regression scenarios to the site-shell "Global navigation" requirement: no two entries share a destination, only the current page's entry is highlighted, and the Shop group's entries are fixed.
- The landing page's cart card loses its "Place order" sub-label, because both read the same area list.
- Placing an order is unchanged: cart → Check out → Place order button (checkout capability).

## Impact

- Affected capability: `site-shell` (Global navigation), as a MODIFIED requirement.
- Code: the shell's area list and its navigation unit test. The "Place order" checkout button and its locale strings are not touched.
- No route, API, data or dependency change.

## Follow-ups / out of scope

- None found. Root-causing surfaced no other defect.
