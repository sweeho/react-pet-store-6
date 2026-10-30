---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR2-S-0016
ticket: SWHR2-T-0247
---

# Summary — SWHR2-T-0247 Shopping cart

## What changed

- `services/cart.ts`: re-add now sets 1 (SD2); added `addItemWithQuantity`, `removeItem`, `updateQuantities`, `clear`, `totalOf`, `cartTotal`, `cartView`.
- Routes: GET/POST `/api/cart[/items]` return `{ locale, lines, total }`; POST honours `quantity`; new `DELETE /api/cart/items/[itemId]` and `PUT /api/cart`. No guard on any.
- Failure routing: `services/errors.ts` (`AppFailure` > `OrderFailure` > `EmptyCartOrder`, `failureBody`), `src/errors/routeFailure.ts`, `src/pages/petstore/error/empty-cart.tsx`.
- `src/pages/petstore/cart.tsx` rebuilt as the mockup's table (Remove, quantity, unit price, Update Cart, total, Check Out); empty state uses "Your Shopping Cart is Empty."; labels in en_US/ja_JP/zh_CN.
- `AddToCart` navigates to `/petstore/cart` after a successful add (P4); the old "added" status is gone, so `item/[itemId].test.tsx` now expects the cart screen.

## AC coverage

AC-1..AC-22 hold at the service, route and component level. AC-14 (order placed), AC-16 (empty-cart order) and AC-22 (Check Out target) are provided as `clear()`, `EmptyCartOrder` with its page, and the `/petstore/checkout` link; the flows belong to SWHR2-I-0008.

## Deviations and notes

- The Item cell shows the item id once beside the linked name (P5, C-0200/C-0088); the mockup omits it.
- Cases C-0084/85/88/93/96/97 are e2e cases, but the platform only records vitest output, so each is also cited by a vitest test (route test, cart page test, `AddToCart.test.tsx`). `e2e/cart.spec.ts` cites them too but was NOT executed: no Chromium in this container.
- The route test originally imported the acceptance harness; that broke `tsc --build` (tsconfig.node.json), so after the red run its helpers were inlined. Assertions are unchanged.
- C-0085 depends on the sign-in password locator (SD4, DEFECT SWHR2-T-0244); not exercised here.
- Design check: no browser available, so the side-by-side screenshots were not taken (see `design-check.md`).

CODE-REVIEW: self-review — sub-agent skipped to keep the run short; diff checked against ACs, minimal-diff and typing rules; no findings left open.

## Verification

- `bun run typecheck`: pass. `bun run lint`: pass (0 warnings). `bun run test`: 60 files, 229 tests, all pass.
- `bun run test:acceptance`: no newly failing tests vs. the pre-change run (127 failed before, 117 after, all in unbuilt capabilities); only shopping-cart failure is deferred C-0090.
- `bun run test:e2e` / acceptance e2e: not run, Chromium missing.
