---
artifact: plan
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0017
ticket: SWHR2-T-0257
branch: vortex/test/SWHR2-T-0257-qa-rework-round-1-15-case-s-red-in-the-o-80799318
---

# PLAN — SWHR2-T-0257 (QA rework round 1)

Causes shared by the 15 red cases, each fixed once (change `swhr2-i-0007-shopping-cart`):

1. Cart model lacks set-quantity and remove (C-0080, 0081, 0099, 0100, 0098, 0094): add `addItemWithQuantity` and `removeItem` to `services/cart.ts`, `addItem` sets quantity 1, `DELETE /api/cart/items/[itemId]`, optional `quantity` on `POST /api/cart/items`, `PUT /api/cart` for Update Cart.
2. No failure router (C-0091, 0092): `src/errors/routeFailure.ts`.
3. Cart screen is a read-only list (C-0086, 0087, 0084, 0088): rebuild `src/pages/petstore/cart.tsx` to the mockups with the locale strings.
4. Add to Cart does not show the cart (C-0096, 0097): navigate to `/petstore/cart` after a successful add.
5. C-0085 fails in the locked test's own `signIn` helper (ambiguous `getByLabel(/password/i)`): disputed, not changed.
