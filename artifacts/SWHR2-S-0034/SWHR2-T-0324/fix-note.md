# Fix note — SWHR2-T-0324

**Root cause:** `areas.ts` listed "Place order" with `to: "/petstore/cart"`, the same route as "Shopping cart". `NavLink` highlights by URL, so both entries were marked `aria-current="page"` on the cart page. No place-order page exists; orders are placed from checkout.

**Fix:** removed the "Place order" area and the now-unused `credit-card` icon (type and icon map). The landing cart card reads the same list, so its sub-label goes too. Checkout button and `placeOrder` locale strings are untouched.

**Files:** `src/components/shell/areas.ts`, `src/components/shell/GlobalNav.tsx`, `src/components/shell/GlobalNav.test.tsx` (regression tests C-0283, C-0285, C-0286) (C-0283 to C-0287; the two browser-level cases are asserted in jsdom because the evidence command runs vitest only).

CODE-REVIEW: self-review — 4-line deletion plus tests; sub-agent not needed for a pure removal; no findings.
