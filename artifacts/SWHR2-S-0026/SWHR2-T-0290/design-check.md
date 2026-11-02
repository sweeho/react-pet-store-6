# Design check: SWHR2-T-0290

Each mockup (1440x900) was rendered from its HTML file and the built screen was rendered at the route and state below, in the Playwright Chromium. Screenshots are in `design-check/`, named `<screen>-mockup.png` and `<screen>-built.png`.

| Mockup                                                        | Route / state                                      | Screenshots                                                                                       |
| ------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `mockup-billing-and-shipping-information.html` (SWHR2-MCK-24) | `/petstore/checkout`, pre-filled                   | `design-check/billing-and-shipping-mockup.png`, `design-check/billing-and-shipping-built.png`     |
| `mockup-order-placed.html` (SWHR2-MCK-25)                     | `/petstore/order-placed` after a successful submit | `design-check/order-placed-mockup.png`, `design-check/order-placed-built.png`                     |
| `mockup-empty-cart-order-error.html` (SWHR2-MCK-26)           | `/petstore/error/empty-cart`                       | `design-check/empty-cart-order-error-mockup.png`, `design-check/empty-cart-order-error-built.png` |
| `mockup-server-error.html` (SWHR2-MCK-27)                     | `/petstore/error/server` after a failed placement  | `design-check/server-error-mockup.png`, `design-check/server-error-built.png`                     |

## Differences left

- **Shell (all four).** The mockups draw their own header, rail and footer. The built screens sit in the application's existing shell (header, global nav, category list, language buttons, footer), which this ticket does not change. Breadcrumbs, the cart count badge and the nested Catalog list in the mockup's rail belong to that shell.
- **Sample data (all four).** The mockups show customer "Alex Morgan" and a three-line $245.00 order. The built screens show the seeded customer j2ee (ABC XYZ, 1 Main St, abc@xyz.com) and the real cart. The seeded values are the ones the locked acceptance cases require (design.md SD4).
- **Second address line label.** The mockup says "Street address line 2". The built label is "Address line 2": the locked case SWHR2-C-0215 counts fields by `/street/` and expects exactly two (billing and shipping), so the second line cannot contain "street".
- **Required marker.** The red asterisk is drawn by CSS on the label, so it is not part of the label text that the locked tests match (`/^e-?mail:?$/`).
- **Country** is a text field, as the account form; the mockup shows a plain value box.
- **Order lines (checkout summary).** No item thumbnails. The cart view has no image URL; the mockup's thumbnails are icon placeholders.
- **Focus ring** on the street field in the mockup is a state sample, not part of the default screen.
- **Order Placed heading.** The mockup h1 is "Order placed"; the built h1 is "Your order is complete" (design.md SD8, required by locked cases SWHR2-C-0101 and SWHR2-C-0174, which allow exactly one matching heading). "Order placed" stays as the small label above it. The "Thanks, Alex" greeting is "Thanks, we have your order." without the first name.
- **Server Error.** The Time and Page meta line is not shown, and the trace is the real server trace (one frame in dev) instead of the mockup's sample. The "Error" pill is omitted.
- **Empty-cart error.** Built to the mockup: heading, subtitle, empty-state card, Browse the catalog and View cart. The card uses the shell's border and muted tokens, not the mockup's literal values.
- **Tokens.** Colours, radii and type use the project's Tailwind tokens, not the mockup's literal hex values.
