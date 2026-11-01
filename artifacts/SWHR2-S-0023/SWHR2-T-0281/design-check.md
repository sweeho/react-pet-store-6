# Design check — SWHR2-T-0281

Screenshots were not taken. This container has no Chromium (`bun run test:e2e` preflight fails and E2E must not be retried), so no mockup/screen pair exists under `design-check/`. Each mockup was compared with the built markup by reading both. Please treat the visual comparison as unverified.

## SWHR2-MCK-24 — Billing and shipping information

Route `/petstore/checkout`, signed-on customer with a non-empty cart, viewport 1440. Screenshots: none (no browser).
Differences left:

- The form submits with "Continue" and a review step (`/petstore/confirm-order`, button "Confirm order") places the order; the mockup has a single "Place order" button. The locked specs (C-0174, C-0254) require a Continue button and a separate confirm step.
- The State label reads "State", not "State or province": locked specs match `/^state:?$/`.
- Sample data in the mockup (Alex Morgan) differs from the account data.
- No breadcrumb row; the shell shows none on other storefront pages.
- State is a text input with suggestions (design SD7), not a select.

## SWHR2-MCK-25 — Order placed

Route `/petstore/order-placed`, viewport 1440. Screenshots: none (no browser).
Differences left:

- The "Placed" date and "Bill to" rows are omitted; "Ship to", lines and total are shown.

## SWHR2-MCK-26 — Empty cart order error

Route `/petstore/error/empty-cart`, viewport 1440. Screenshots: none (no browser).
Differences left: none found by reading; the breadcrumb row is omitted as above.

## SWHR2-MCK-27 — Server Error

Route `/petstore/error/server`, viewport 1440. Screenshots: none (no browser).
Differences left:

- The "Time" and "Page" meta line is omitted; the failure reply carries neither.
- Colours use the Tailwind tokens, not the mockup's literal values.
