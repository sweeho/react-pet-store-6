---
ticket: SWHR2-T-0288
sprint: SWHR2-S-0025
---

# Design check

All four mockups rendered at 1440×900 against the built screens (dev server, signed in as j2ee, cart with EST-1 and EST-4). Pairs are in `design-check/`.

| Mockup                      | Route / state                                   | Mockup                                                     | Built                                                     |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| MCK-24 Billing and shipping | `/petstore/checkout`, pre-filled                | `design-check/mockup-billing-and-shipping-information.png` | `design-check/built-billing-and-shipping-information.png` |
| MCK-25 Order Placed         | `/petstore/order-placed` after POST             | `design-check/mockup-order-placed.png`                     | `design-check/built-order-placed.png`                     |
| MCK-26 Empty-cart error     | `/petstore/error/empty-cart`                    | `design-check/mockup-empty-cart-order-error.png`           | `design-check/built-empty-cart-order-error.png`           |
| MCK-27 Server Error         | `/petstore/error/server` with message and trace | `design-check/mockup-server-error.png`                     | `design-check/built-server-error.png`                     |

## Differences left

- **App shell** (header, left rail, language switch, footer, categories column): the existing shell, outside this ticket. It narrows the form columns, so telephone and e-mail values are clipped more than in the mockup.
- **State label** is "State", not "State or province": the locked acceptance spec's label patterns accept only State, State/province or Province.
- **Address line 2** label is "Address line 2", not "Street address line 2": a locked label pattern `/street/i` would otherwise count four street fields.
- **Single-focus ring / sample data** (Alex Morgan, three lines, $245.00) are mockup sample data; built values come from the j2ee account and the cart.
- **Order lines** show no thumbnail icons (the catalog has no icon source).
- **Breadcrumb** on the checkout page is not built (the shell has none).
- **Order id** shows the real sequence value (e.g. 100111 once earlier orders exist).
