# Design manifest — SWHR2-S-0023

Capability brief **SWHR2-I-0008** (Checkout and order placement), canvas doc version **12** (frozen). This lists the approved mockups only. The four wireframe blocks are drafts, not designs to build.

| Mockup       | Title                            | Route and state                                                   | Viewport | Block id                               | File                                           | Bytes / sha256          |
| ------------ | -------------------------------- | ----------------------------------------------------------------- | -------- | -------------------------------------- | ---------------------------------------------- | ----------------------- |
| SWHR2-MCK-24 | Billing and shipping information | `/petstore/checkout`, signed-on customer with a non-empty cart    | 1440     | `48aaa934-ddd4-4906-87a1-0996429f656a` | `mockup-billing-and-shipping-information.html` | 14043 / `011acb660b33…` |
| SWHR2-MCK-25 | Order Placed                     | `/petstore/order-placed`, right after a successful placement      | 1440     | `abef7549-3685-40ba-b206-d38e2dddaa26` | `mockup-order-placed.html`                     | 12014 / `15667088654f…` |
| SWHR2-MCK-26 | Empty-cart order error           | `/petstore/error/empty-cart`, after submitting with an empty cart | 1440     | `3b711cbc-5d02-4dfd-b3f7-74a294ffec22` | `mockup-empty-cart-order-error.html`           | 9110 / `6669c3e27ce9…`  |
| SWHR2-MCK-27 | Server Error                     | `/petstore/error/server`, after an unexpected placement failure   | 1440     | `202a4f80-ecea-43f0-aace-c4a0e9e8934c` | `mockup-server-error.html`                     | 11136 / `cf769a98f9f4…` |

All four files were exported byte-exact and are committed next to this manifest.
