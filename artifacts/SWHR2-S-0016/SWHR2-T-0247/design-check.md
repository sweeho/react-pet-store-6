---
artifact: design-check
spec: 1
status: partial
author_role: implementation
sprint: SWHR2-S-0016
ticket: SWHR2-T-0247
---

# Design check — SWHR2-T-0247

Playwright's Chromium is not installed in this container (`ensure-playwright-browser` fails), so no screenshots were taken. The check below is by reading `mockup-shopping-cart.html` and `mockup-shopping-cart-empty.html` against the built markup.

| Mockup                                       | Route / state / viewport          | Result                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mockup-shopping-cart.html                    | /petstore/cart, three lines, 1440 | Item / Quantity / Unit price / Actions columns, 72px right-aligned quantity input, Remove ghost button, Update Cart left of footer, Total + Check Out right. Differences: item id shown once beside the name (locked case C-0200/C-0088); mockup's per-row remove icon and the "Kept for this visit only" intro line are omitted; hint line sits inside the form; colours use design-system tokens. |
| SWHR2-MCK-23 mockup-shopping-cart-empty.html | /petstore/cart, empty, 1440       | Shared `EmptyFrame` with "Your Shopping Cart is Empty."; no table, total, Update Cart or Check Out.                                                                                                                                                                                                                                                                                                 |

Screenshots: not captured (no browser).
