# Summary — SWHR2-T-0251

Implemented the shopping cart so the 15 red cases can pass: `services/cart.ts` (add sets 1, add with quantity, remove, update, clear, cart view with total), routes (`GET/PUT /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/[itemId]`, all returning `{ locale, lines, total }`), `src/errors/routeFailure.ts`, empty-cart error page, table cart screen with locale strings, and Add to Cart navigating to the cart. Updated the item page test for the navigation.

Verification: `bun run lint`, `bun run typecheck` clean; `bun run test` 215/215; `bun run test:acceptance` shopping-cart all pass except C-0090 (checkout, not built). E2E (`e2e/cart.spec.ts`) written but not executed: no matching Chromium here.

CODE-REVIEW: self-review — no sub-agent run to limit cost; reviewed the diff by hand: no findings fixed; zero/negative/NaN quantities on update are left unvalidated on purpose (open SME record, plan P2).
