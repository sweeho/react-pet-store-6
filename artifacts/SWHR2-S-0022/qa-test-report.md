---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0022
capability brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0022-358d0d57
upstream: [artifacts/SWHR2-S-0022/SPRINT-PLAN.md]
---

# QA test report — SWHR2-S-0022

## Executive Summary

**Verdict: PASS with limits.** The shopping cart (SWHR2-I-0007, delivered by SWHR2-T-0276) works on the integrated sprint branch: lint, typecheck, build, 240 unit tests and 18 Playwright tests all pass.
Three scenarios cannot be exercised yet because they depend on checkout, which is a different capability (see Issues Found).
No defects were found in this sprint's scope.

SCENARIO-VERDICT: One cart per browsing session / First use of the cart in a session — pass
SCENARIO-VERDICT: One cart per browsing session / Two sessions have separate carts — pass
SCENARIO-VERDICT: One cart per browsing session / Shopper signs out with items in the cart — pass
SCENARIO-VERDICT: Cart held for the session only / Session ends — pass
SCENARIO-VERDICT: Cart use without a security role / Anonymous visitor adds an item — pass
SCENARIO-VERDICT: Cart use without a security role / Anonymous visitor removes an item — pass
SCENARIO-VERDICT: Add item to cart / Add from the product listing — pass
SCENARIO-VERDICT: Add item to cart / Add from a search result — pass
SCENARIO-VERDICT: Add item with a supplied quantity / Item not yet in the cart — pass
SCENARIO-VERDICT: Add item with a supplied quantity / Item already in the cart — pass
SCENARIO-VERDICT: Remove control for a cart line / Shopper removes one line — pass
SCENARIO-VERDICT: Item removal semantics / Remove a line with several units — pass
SCENARIO-VERDICT: Item removal semantics / Remove an item not in the cart — pass
SCENARIO-VERDICT: Empty cart after order placement / Order placed — not-testable: no order placement route exists in this sprint; `clearCart` is covered only at service level (C-0089 deferred to checkout)
SCENARIO-VERDICT: Cart line order / Lines listed — pass
SCENARIO-VERDICT: Failure routing to an error page / Order attempted with an empty cart — not-testable: `/api/orders` does not exist yet; acceptance case SWHR2-C-0090 fails with "Cannot find module /routes/api/orders/index.post" (deferred by T-0276). The error page and `EmptyCartOrder` type are unit-tested
SCENARIO-VERDICT: Failure routing to an error page / Failure matched by a more general kind — pass
SCENARIO-VERDICT: Failure routing to an error page / Unmapped failure — pass
SCENARIO-VERDICT: Shopping cart screen / Cart with items is displayed — pass
SCENARIO-VERDICT: Shopping cart screen / Empty cart is displayed — pass
SCENARIO-VERDICT: Shopping cart screen / Remove activated — pass
SCENARIO-VERDICT: Shopping cart screen / Check Out activated — not-testable: the link targets `/petstore/checkout` (href asserted in e2e/cart.spec.ts) but no checkout page exists yet

Basis for "pass": the shopping-cart acceptance suite (13 of 14 tests pass), the colocated unit tests (`services/cart.test.ts`, `services/errors.test.ts`, `routes/api/cart/cart.test.ts`, `src/errors/routeFailure.test.ts`, `src/pages/petstore/cart.test.tsx`) and the Playwright run.
Browser-level evidence exists for: empty cart, add from listing, update quantity, remove, separate sessions.
Search-result add, sign-out and session-expiry are verified at unit/acceptance level only.

## E2E Test Status

Executed: `bun run test:e2e -- --project=chromium` gave `15 passed (6.9s)`; the new `e2e/cart.spec.ts` gave `3 passed (4.6s)`.
Total 18 passed, 0 failed, 0 skipped.
Detail in `artifacts/SWHR2-S-0022/integration-test-result.md`.

## Unit Test Results

```
$ bun run test
 Test Files  61 passed (61)
      Tests  240 passed (240)
```

`bun run lint`, `bun run typecheck` and `bun run build` all exited 0.
`bun run test:acceptance` exits 1 overall: `Test Files 17 failed | 15 passed, Tests 117 failed | 96 passed`.
Within `tests/acceptance/shopping-cart/cart.test.ts`: `14 tests | 1 failed`, the failure being SWHR2-C-0090 (deferred, see Issues Found).
The other failing files belong to other capabilities (order approval, data population, fulfilment and similar) and were not investigated here.

## Code Review

No notable concerns observed in `src/pages/petstore/cart.tsx`: failures route through `routeFailure`, quantities are held as drafts until Update Cart.
Observation (not a defect): the cart screen includes a "Browse the catalog / Back to Home" action pair in the empty state that the spec does not require.

## Coverage Summary

Not measured: `@vitest/coverage-v8` is not installed (`vitest run --coverage` fails with MISSING DEPENDENCY) and the project declares no coverage command.

## Design fidelity

Reference: `artifacts/SWHR2-S-0022/design/mockup-shopping-cart.html` (SWHR2-MCK-22) and `mockup-shopping-cart-empty.html` (SWHR2-MCK-23), 1440×900.
Method: Playwright screenshots of the built screens next to the rendered mockups, in `artifacts/SWHR2-S-0022/qa/design/`. Not fixed in place: the differences are in the shared app shell or are design decisions.

DESIGN-VERDICT: SWHR2-MCK-22 differs — cart table, Update Cart, total and Check Out match; shell, breadcrumb and line text differ

- RESIDUAL: SWHR2-MCK-22 breadcrumb — mockup: "Home > Shopping cart" above the title; built: none
- RESIDUAL: SWHR2-MCK-22 line text — mockup: item name only; built: name plus item id, product name and attribute
- RESIDUAL: SWHR2-MCK-22 shell — mockup: nested Catalog sidebar and EN/日本語/中文 control in the header; built: flat sidebar, category list in content and EN/JA/ZH buttons above the title
  DESIGN-VERDICT: SWHR2-MCK-23 differs — empty message and actions present; layout of the empty frame differs
- RESIDUAL: SWHR2-MCK-23 empty frame — mockup: cart icon, message as heading and a hint line, bordered white frame; built: inbox icon, "Shopping cart" heading with the message below, grey filled frame
- RESIDUAL: SWHR2-MCK-23 shell — same shell differences as MCK-22

## Issues Found

- I1: acceptance case SWHR2-C-0090 (empty-cart order shows error page) fails because `routes/api/orders/index.post` does not exist. This is explicitly deferred to the checkout capability in `artifacts/SWHR2-S-0022/SWHR2-T-0276/summary.md`. Not a defect of this sprint; not filed.
- I2: checkout page (`/petstore/checkout`) does not exist, so Check Out leads to a missing page until the checkout capability ships. Same deferral.
- I3: environment: Playwright preflight expects Chromium revision 1155, the container ships 1223. Worked around by symlink outside the repo.

No entries in `integration-defects-resolution.md`; no DEFECT tickets filed.

## Regression guards

Cases accepted by the merge gate because they passed at the `[tdd:red]` commit (SWHR2-T-0276):

- SWHR2-C-0084 (session ends, cart not retrievable): working. Covered by the passing acceptance suite and 240 unit tests; not driven in a browser.
- SWHR2-C-0085 (sign-out empties cart): working, same evidence.
- SWHR2-C-0095 (anonymous removal not role-checked): working, same evidence.

## Recommendation

Proceed: fire `validation.all_acs_passed`. Every scenario this sprint can exercise passes; the three not-testable scenarios depend on the checkout capability, which is outside this sprint's commitment. Design differences are advisory and do not affect the verdict.
