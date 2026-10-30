---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0016
ticket: SWHR2-T-0247
capability_brief: SWHR2-I-0007
change: swhr2-i-0007-shopping-cart
branch: vortex/sprint/swhr2-s-0016-9692ccab
---

# PLAN — SWHR2-T-0247 Shopping cart

## Objective

Deliver the whole change `swhr2-i-0007-shopping-cart`, working through every `tasks.md` group in order (1 to 5). Part of the cart already exists. This ticket corrects it, completes it, and adds failure routing and the full cart screen.

Read `design.md` first: the legacy notes, then **Target design**, then **Planning — SWHR2-S-0016**. The Planning section has the measured code state, decisions P1–P7, the interface contracts fixed by the locked acceptance suite, the deferred cases and spec discrepancies SD1–SD4. Then read `specs/shopping-cart/spec.md` and `test-cases.md`.

## Steps

1. **Cart model** (tasks 1.1–1.4, 2.1–2.6). In `services/cart.ts` (P1):
   - change `addItem` to set 1 (P2, SD2)
   - add `addItemWithQuantity`, `removeItem`, `updateQuantities`, `clear` and a cart total (P2, P3)

   Sign-out and idle discard already work through `services/session/store.ts`. Do not change that file. Unit tests go in `services/cart.test.ts`.

2. **Routes** (2.1–2.5). Change `routes/api/cart/index.get.ts` and `items.post.ts` to return the cart view `{ locale, lines, total }`. `items.post.ts` honours an optional `quantity`. Add `items/[itemId].delete.ts` and `index.put.ts` (P3). No guard on any of them. Route tests go under `routes/api/cart/`.
3. **Failure routing** (3.1–3.3). Add `services/errors.ts` and `src/errors/routeFailure.ts` (P6), and the empty-cart error page `src/pages/petstore/error/empty-cart.tsx`.
4. **Cart screen** (4.1–4.5):
   - rebuild `src/pages/petstore/cart.tsx` as the table in P5
   - set the empty message "Your Shopping Cart is Empty." in `src/locales/en_US/petstore-cart.ts`, with ja_JP and zh_CN equivalents
   - make `AddToCart` navigate to `/petstore/cart` after a successful add (P4)
5. **Verification** (5.1–5.5). Add UI tests for the cart page and the error page and a route test for anonymous use. Add `e2e/cart.spec.ts` (add from the product page, then Remove), run at least once. Run the locked `tests/acceptance/shopping-cart/` suite. Also re-run the other suites that click Add to Cart (catalog-browsing C-0200, localization C-0022, sign-on C-0252), because P4 changes what happens after the click.

## File/module ownership

| Path                                                       | Action               |
| ---------------------------------------------------------- | -------------------- |
| `services/cart.ts`, `services/cart.test.ts`                | modify               |
| `services/errors.ts` (+ `.test.ts`)                        | create               |
| `routes/api/cart/index.get.ts`, `items.post.ts`            | modify               |
| `routes/api/cart/index.put.ts`, `items/[itemId].delete.ts` | create               |
| `routes/api/cart/*.test.ts`                                | create               |
| `src/errors/routeFailure.ts` (+ `.test.ts`)                | create               |
| `src/pages/petstore/cart.tsx` (+ `cart.test.tsx`)          | modify / create test |
| `src/pages/petstore/error/empty-cart.tsx`                  | create               |
| `src/components/storefront/AddToCart.tsx`                  | modify               |
| `src/locales/{en_US,ja_JP,zh_CN}/petstore-cart.ts`         | modify               |
| `e2e/cart.spec.ts`                                         | create               |

No schema change and no migration (P7). Do not edit anything under `openspec/` or `tests/acceptance/`.

## Design reference

Mockups are committed under `artifacts/SWHR2-S-0016/design/` (index `MANIFEST.md`):

- `mockup-shopping-cart.html` (SWHR2-MCK-22): route `/petstore/cart` with three lines in the cart, viewport 1440. It has the Item / Quantity / Unit price / Actions columns, Update Cart on the left of the footer, and Total plus Check Out on the right.
- `mockup-shopping-cart-empty.html` (SWHR2-MCK-23): route `/petstore/cart` in a new session with nothing added, viewport 1440.

Render each route beside its mockup to check layout. Where a mockup differs from a locked case (row markup, link text, item id shown once), the case wins.

## Test cases

- Linked (19): C-0080 to C-0088, C-0091 to C-0100.
- Deferred to SWHR2-I-0008: C-0089, C-0090, C-0101 (design.md, Test cases deferred).
- C-0085 shares the sign-in password locator with disputed sign-on case C-0269 (SD4, DEFECT SWHR2-T-0244).

## Definition of Done

- AC-1 to AC-22 on the ticket hold. For AC-14 (order placed), AC-16 (empty-cart order) and AC-22 (Check Out), this ticket provides `clear()`, the `EmptyCartOrder` kind with its error page, and the Check Out link. The end-to-end flows are proved by checkout's cases.
- The linked cases pass.
- The other suites' Add to Cart cases are no worse than before.
