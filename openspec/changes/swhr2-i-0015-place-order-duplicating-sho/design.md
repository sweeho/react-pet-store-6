## Context

Defect SWHR2-T-0324. `src/components/shell/areas.ts` is the single list of primary areas. Both the global navigation (`src/components/shell/GlobalNav.tsx`) and the landing page (`src/pages/index.tsx`) render from it.

## Root cause

Verified in the code:

- The `areas` list contains `{ label: "Place order", to: "/petstore/cart", group: "Shop", icon: "credit-card" }`, with the same `to` as "Shopping cart".
- `GlobalNav` renders every area as `<NavLink to={area.to} end>`, and React Router marks a `NavLink` active by URL match, so two entries with one URL are always active together.
- The landing page groups areas by `to`, so the cart card shows "Shopping cart" with a "Place order" sub-label.
- No `/petstore/place-order` route exists. Orders are placed from `src/pages/petstore/checkout.tsx`.
- The duplicate was locked in by `src/components/shell/GlobalNav.test.tsx`, whose expected list includes `{ label: "Place order", to: "/petstore/cart" }`.

## Decisions

- **D1 Remove the entry; do not repoint it.** There is no place-order page to point at, and checkout is only valid with a non-empty cart, so a navigation entry to it would lead to an error for most visitors.
- **D2 Remove the dead icon.** With the entry gone, `"credit-card"` is unused. Drop it from the `AreaIcon` union in `areas.ts` and the `CreditCard` import and map entry in `GlobalNav.tsx`, so the type and icon map list only icons in use.
- **D3 Guard the class of bug.** The navigation unit test asserts that every rendered area link has a distinct `href`, and that on `/petstore/cart` exactly one link is current (`aria-current="page"`), so a future duplicate fails.
- **D4 Keep the checkout button.** The checkout page's "Place order" button and the `placeOrder` locale strings are a different control and stay.

## Verification

- The `GlobalNav` unit tests cover the Shop group's entries, distinct destinations and a single highlighted entry on the cart page.
- The landing page unit test and the site-shell acceptance suites must stay green; they assert routes, not this label.
- The order flow is covered by the existing checkout and customer-account e2e specs, which click the checkout "Place order" button.
