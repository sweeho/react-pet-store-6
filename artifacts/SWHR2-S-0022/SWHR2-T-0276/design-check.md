# Design check — SWHR2-T-0276

Not rendered side by side: the engineer container has no Chromium (`ensure-playwright-browser` reports it missing), so
Playwright screenshots could not be taken. The cart screen was built from `mockup-shopping-cart.html` (MCK-22) and
`mockup-shopping-cart-empty.html` (MCK-23) by reading them.

| Mockup       | Route and state         | Differences left                                                                                                                                                                                                                                                         |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SWHR2-MCK-22 | `/petstore/cart`, lines | Breadcrumb omitted (app shell owns navigation). Colours, spacing and buttons use the design-system tokens and `Button` variants, not the mockup's literal values. Product name and attribute follow the linked item description in the Item cell (spec discrepancy SD2). |
| SWHR2-MCK-23 | `/petstore/cart`, empty | Uses the shared `EmptyFrame` with Browse the catalog / Back to Home actions, as design.md specifies.                                                                                                                                                                     |
