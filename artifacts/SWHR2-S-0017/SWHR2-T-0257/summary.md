---
artifact: summary
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0017
ticket: SWHR2-T-0257
branch: vortex/test/SWHR2-T-0257-qa-rework-round-1-15-case-s-red-in-the-o-80799318
---

# Summary — SWHR2-T-0257

Built the shopping cart the sprint left deferred: set-quantity add, remove, Update Cart, the failure router, the mockup-matching cart screen, and Add to Cart showing the cart.

Files: `services/cart.ts`, `routes/api/cart/{items.post.ts,index.put.ts,items/[itemId].delete.ts}`, `src/errors/routeFailure.ts`, `src/pages/petstore/cart.tsx`, `src/components/storefront/AddToCart.tsx`, `src/locales/*/petstore-cart.ts`, `src/pages/petstore/item/[itemId].test.tsx` (now asserts navigation to the cart).

AC coverage: 14 of 15 cases pass locally; C-0085 disputed (locked test's `signIn` uses `getByLabel(/password/i)`, which matches 3 fields on the sign-in page).

Verification: `bun run lint` exit 0; `bun run typecheck` exit 0; `bun run test` 205 passed; `bun run test:acceptance:e2e` shopping-cart C-0084/0088/0096/0097 pass. `bun run test:e2e`: 2 failures in `e2e/account.spec.ts`, identical without these changes (verified with the changes stashed), so pre-existing.

Not done (not on this ticket): orders and checkout (C-0089, 0090, 0101).

CODE-REVIEW: self-review — no sub-agent run in this container; reviewed the diff by hand. Fixed: lint error from setState in an effect (moved to a version-counter refetch). Accepted: Update Cart drops a line whose quantity is blank or below 1 (matches the legacy cart). Rejected: validating the quantity on add (spec R-0033 says not to).
