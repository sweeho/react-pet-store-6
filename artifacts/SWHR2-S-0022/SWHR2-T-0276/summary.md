# Summary — SWHR2-T-0276 Shopping cart

Delivers the session cart (add, add with quantity, remove, Update Cart, clear), typed failure routing and the cart screen.

CODE-REVIEW: self-review — sub-agent not run; reviewed the diff against the acceptance criteria. Fixed: dropped the `"anonymous"` cart fallback (SD4); Update Cart treats non-numeric quantities as 0 as the legacy form does.

## Changes

- `services/cart.ts`: `addItem` now sets 1 (P2); new `addItemWithQuantity`, `removeItem`, `updateQuantities`, `clearCart`, `total`; lines carry `productName` and `lineTotal`.
- `services/errors.ts`: `AppFailure` hierarchy (`ItemNotFound`→`CatalogError`, `EmptyCartOrder`→`OrderFailure`), `failureReply`, `guardRoute`.
- Routes: `GET/PUT /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/[itemId]` return `{ locale, lines, total }`, unguarded, session via `sessionOf`. Catalog item route throws `ItemNotFound`.
- `src/errors/routeFailure.ts` plus `error/{empty-cart,catalog,server}.tsx`.
- `src/pages/petstore/cart.tsx` rebuilt; `petstore-cart` locale text in en_US, ja_JP, zh_CN; `AddToCart` navigates to the cart after a successful add (P5).
- Deferred to checkout: C-0089, C-0090, C-0101 (seams: `clearCart`, `EmptyCartOrder` and its page, Check Out link to `/petstore/checkout`).

## Verification

- `bun run verify` (lint, typecheck, unit): pass, 239 tests.
- `bun run test:acceptance`: all shopping-cart cases pass except deferred C-0090; other failures are in other capabilities' suites (order-approval, data-population, order-fulfillment, catalog data-access, sign-on internal) and are untouched by this ticket.
- E2E and design screenshots not run: no Chromium in this container (see `design-check.md`).
- Platform red run f280639b, green run a42da2a7: valid.
