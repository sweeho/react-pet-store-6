---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0022
ticket: SWHR2-T-0276
capability_brief: SWHR2-I-0007
change: swhr2-i-0007-shopping-cart
branch: vortex/sprint/swhr2-s-0022-358d0d57
---

# PLAN — SWHR2-T-0276 Shopping cart

## Objective

Deliver the whole change `swhr2-i-0007-shopping-cart`, working through every `tasks.md` group in order (1 to 5). The scope is the session cart, add (quantity 1 or a supplied quantity), remove, Update Cart, clear-after-order, typed failure routing to error pages, and the cart screen.

Read `design.md` first: the legacy notes, then **Target design**, then **Planning — SWHR2-S-0022**. That section holds the measured code state, decisions P1–P7, the interface contracts fixed by the locked suite, and the spec discrepancies SD1–SD5. Then read `specs/shopping-cart/spec.md` and `test-cases.md`.

## Steps

1. **Cart model** (tasks 1.1–1.4, 2.1–2.6). Extend `services/cart.ts` in place (P1). Make `addItem` set 1 (P2), and add `addItemWithQuantity`, `removeItem`, `updateQuantities` and `clearCart`. Extend `lines` with `productName` and `lineTotal`, and add a total. Session lifetime is already wired in `services/session/store.ts`; prove it with tests rather than rewriting it.
2. **Cart routes** (2.1–2.5):
   - extend `routes/api/cart/index.get.ts` and `items.post.ts` (with `quantity`);
   - add `routes/api/cart/items/[itemId].delete.ts` and `routes/api/cart/index.put.ts`.
     Every route returns `{ locale, lines, total }`, takes no guard, and reads the session through `sessionOf` (SD4).
3. **Failure routing** (3.1–3.3):
   - `services/errors.ts`, holding the `AppFailure` hierarchy, the reply body and the route wrapper (P3);
   - `ItemNotFound` on `routes/api/catalog/items/[itemId].get.ts`;
   - `src/errors/routeFailure.ts` and `src/pages/petstore/error/{empty-cart,catalog,server}.tsx` (P4).
4. **Cart screen** (4.1–4.5):
   - rebuild `src/pages/petstore/cart.tsx` to the mockups and the screen contract in design.md;
   - update `src/locales/{en_US,ja_JP,zh_CN}/petstore-cart.ts`, plus `src/locales/registry.ts` if the definition type grows;
   - navigate to the cart after a successful add in `src/components/storefront/AddToCart.tsx` (P5).
5. **Tests** (5.1–5.5). Add colocated tests mirroring the nearest file: `services/cart.test.ts`, `services/errors.test.ts`, `routes/api/cart/*.test.ts`, `src/pages/petstore/cart.test.tsx` and `src/errors/routeFailure.test.ts`. Adjust colocated tests whose expectation P2/P5 changes (for example C-0200's inline status in `src/pages/petstore/item/[itemId].test.tsx`), and keep their case keys. The locked suite `tests/acceptance/shopping-cart/` must pass unmodified, except the three deferred cases.

## File/module ownership

| Path                                                                                                        | Change                                               |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `services/cart.ts` (+ `cart.test.ts`)                                                                       | extend                                               |
| `services/errors.ts` (+ test)                                                                               | new                                                  |
| `routes/api/cart/index.get.ts`, `index.put.ts`, `items.post.ts`, `items/[itemId].delete.ts` (+ `*.test.ts`) | extend / new                                         |
| `routes/api/catalog/items/[itemId].get.ts` (+ test)                                                         | typed `ItemNotFound`                                 |
| `services/session/store.ts`                                                                                 | touch only if a test exposes a gap in discard-on-end |
| `src/errors/routeFailure.ts` (+ test)                                                                       | new                                                  |
| `src/pages/petstore/cart.tsx` (+ `cart.test.tsx`)                                                           | rebuild                                              |
| `src/pages/petstore/error/empty-cart.tsx`, `catalog.tsx`, `server.tsx`                                      | new                                                  |
| `src/components/storefront/AddToCart.tsx` (+ test)                                                          | navigate after add                                   |
| `src/pages/petstore/item/[itemId].test.tsx`, `product/[productId].test.tsx`, `search.test.tsx`              | adjust for P5 only                                   |
| `src/locales/{en_US,ja_JP,zh_CN}/petstore-cart.ts`, `src/locales/registry.ts`, `src/locales/types.ts`       | screen text                                          |
| `routes/api/catalog/browse-to-cart.test.ts`, `routes/api/session/sign-on.test.ts`                           | adjust only if P2 changes an expectation             |

`tests/acceptance/**` is locked: read it, never edit it. Nothing under `openspec/` beyond ticking is yours.

## Design reference

The approved mockups are committed in `artifacts/SWHR2-S-0022/design/` (index: `MANIFEST.md`).

| Mockup       | File                                                            | Route and state                                                                                                           | Viewport |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| SWHR2-MCK-22 | `artifacts/SWHR2-S-0022/design/mockup-shopping-cart.html`       | `/petstore/cart`, cart holding lines (table: Item · Quantity · Unit price · Actions; Update Cart, Total, Check Out below) | 1440     |
| SWHR2-MCK-23 | `artifacts/SWHR2-S-0022/design/mockup-shopping-cart-empty.html` | `/petstore/cart`, new session with nothing added ("Your Shopping Cart is Empty." with Browse the catalog / Back to Home)  | 1440     |

Render each route beside its mockup to check the work. Where a mockup conflicts with the screen contract in design.md, the contract wins, because the locked tests depend on it.

## Definition of Done

- AC-1 to AC-22 are met, each covered by its linked case (19 cases). AC-14 (Order placed), AC-16 (Order attempted with an empty cart) and AC-22 (Check Out activated) are shown here only through their seams: `clearCart`, `EmptyCartOrder` with its page, and the Check Out link. Their cases C-0101, C-0090 and C-0089 are deferred to checkout SWHR2-I-0008.
- The locked suite `tests/acceptance/shopping-cart/` passes, except the three deferred cases. The existing catalog, localization and sign-on suites still pass.
