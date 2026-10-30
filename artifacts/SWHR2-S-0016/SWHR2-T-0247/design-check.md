---
artifact: design-check
spec: 1
status: complete
author_role: implementation
sprint: SWHR2-S-0016
ticket: SWHR2-T-0247
---

# Design check — SWHR2-T-0247

Rendered with Playwright Chromium at 1440×900, mockup HTML beside the built screen at `/petstore/cart`. Screenshots are in `design-check/`.

## SWHR2-MCK-22 mockup-shopping-cart.html (/petstore/cart, lines in cart, 1440)

Mockup: `design-check/cart-mockup.png`. Built: `design-check/cart-built.png`.

Matches: Item / Quantity / Unit price columns, right-aligned 72px quantity inputs, Remove per row, Update Cart at left of the footer, Total and Check Out at right, hint line below.

Differences left:

- Item id and attribute shown beside the link name: locked cases C-0200/C-0088 need the id once as text.
- Built page has two lines, not three: the seed data has no EST-3 line to show; mockup rows are sample data.
- No Remove trash icon, no refresh/arrow icons, no breadcrumb or "Kept for this visit only" intro, hint has no info icon: not specified by the plan.
- Header, rail and footer differ (language flags, catalog sub-list, Checkout rail item highlighted): they belong to the existing shell, not this ticket.
- Colours and spacing use design-system tokens.

## SWHR2-MCK-23 mockup-shopping-cart-empty.html (/petstore/cart, empty, 1440)

Mockup: `design-check/cart-empty-mockup.png`. Built: `design-check/cart-empty-built.png`.

Matches: only the empty message "Your Shopping Cart is Empty." with no table, total, Update Cart or Check Out. Differences: the shared `EmptyFrame` (icon, "Nothing here yet" heading, Back to home link) is used, as the design's target says; shell differences as above.
