# Design manifest — SWHR2-S-0024

Capability brief **SWHR2-I-0008** (Checkout and order placement), canvas doc version **12** (frozen). Approved mockups only; the four wireframe blocks are drafts, not designs to build.

| Mockup       | Title                            | Route and state                                                    | Viewport | Block id                               | File                                           | Export bytes / sha256       |
| ------------ | -------------------------------- | ------------------------------------------------------------------ | -------- | -------------------------------------- | ---------------------------------------------- | --------------------------- |
| SWHR2-MCK-24 | Billing and shipping information | `/petstore/checkout`, signed-on customer, cart with items          | 1440     | `48aaa934-ddd4-4906-87a1-0996429f656a` | `mockup-billing-and-shipping-information.html` | 14043 / `011acb660b338ae2…` |
| SWHR2-MCK-25 | Order Placed                     | `/petstore/order-placed`, just after a successful placement        | 1440     | `abef7549-3685-40ba-b206-d38e2dddaa26` | `mockup-order-placed.html`                     | 12014 / `15667088654f21b1…` |
| SWHR2-MCK-26 | Empty-cart order error           | `/petstore/error/empty-cart`, order submitted with an empty cart   | 1440     | `3b711cbc-5d02-4dfd-b3f7-74a294ffec22` | `mockup-empty-cart-order-error.html`           | 9110 / `6669c3e27ce9ce83…`  |
| SWHR2-MCK-27 | Server Error                     | `/petstore/error/server`, reached with a failure message and trace | 1440     | `202a4f80-ecea-43f0-aace-c4a0e9e8934c` | `mockup-server-error.html`                     | 11136 / `cf769a98f9f44964…` |

All four files were exported byte-exact. Bytes/sha256 above are the export's. The repository's pre-commit prettier hook then reformatted the HTML whitespace before commit; markup and text are unchanged. Re-fetch a block with `a2a_get_capability_brief_design` if you need the original bytes.
