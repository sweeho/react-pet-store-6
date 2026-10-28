# Design manifest — SWHR2-S-0004

Capability brief: **SWHR2-I-0002** — Bootstrap, landing page and shared site shell. Canvas doc version **12** (frozen). Approved mockups only; wireframes are not exported.

| Mockup                   | File                       | Viewport | Route / state to compare against                                                                               |
| ------------------------ | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| SWHR2-MCK-1 Landing page | `mockup-landing-page.html` | 1440×900 | `/`, default                                                                                                   |
| SWHR2-MCK-2 Site shell   | `mockup-site-shell.html`   | 1440×900 | any page's chrome (header, left rail, footer); the drawn content is a storefront category in its loading state |
| SWHR2-MCK-3 Empty state  | `mockup-empty-state.html`  | 1440×900 | `/petstore/cart`, empty (the `EmptyFrame` with a capability message)                                           |
| SWHR2-MCK-4 Error state  | `mockup-error-state.html`  | 1440×900 | a data page whose request fails, e.g. `/users` with `/api/users` failing (`ErrorFrame` with Try again)         |

Exported byte-exact (sha256 prefixes: landing `bd04ba2f7c64`, shell `78fa6bbc11b1`, empty `69b9d4232712`, error `fa4b4a1681f4`).
