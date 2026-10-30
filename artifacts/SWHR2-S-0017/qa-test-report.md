---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0017
capability brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0017-002e294d
upstream: [artifacts/SWHR2-S-0017/SPRINT-PLAN.md]
---

# QA test report — SWHR2-S-0017

## Executive Summary

**Verdict: FAIL, escalate.** The sprint delivered no code. FEATURE SWHR2-T-0247 (Shopping cart) stayed DEFERRED, so the integrated branch has only the add-only cart stub from earlier sprints. Of 21 scenarios, 6 pass and 15 fail (see verdict lines below). The missing work is a feature, not a fix, so it was filed as future-sprint DEFECT SWHR2-T-0255. One unrelated flaky e2e was filed as SWHR2-T-0256.

## E2E Test Status

`bun run test:e2e` (with a symlinked browser path, explained in the file): 14 passed, 1 failed, 0 skipped. The failure is a flaky account spec that passed on re-run. Detail in `artifacts/SWHR2-S-0017/integration-test-result.md`.

## Unit Test Results

```
$ bun run lint        -> exit 0
$ bun run typecheck   -> exit 0
$ bun run test
 Test Files  55 passed (55)
      Tests  205 passed (205)
```

`bun run build` exit 0.

## Code Review

Verified by inspection: `services/cart.ts` `addItem` increments the quantity (spec R-0033 requires replacing it) and has no remove, set-quantity or empty operation. `src/pages/petstore/cart.tsx` renders a read-only list with the placeholder "Your cart will appear here once the cart ships." No order or empty-cart error page exists. Cart discard on sign-out and session id renewal is wired in `services/session/store.ts`.

## Coverage Summary

No coverage tool run; the project declares no coverage command.

## Design fidelity

Reference: `artifacts/SWHR2-S-0017/design/default-shopping-cart.html` (SWHR2-MCK-22) and `empty-shopping-cart-empty.html` (SWHR2-MCK-23).

DESIGN-VERDICT: SWHR2-MCK-22 not built — the cart screen is a plain list with no Remove control, quantity field, Update Cart, total or Check Out

- RESIDUAL: SWHR2-MCK-22 whole screen — mockup: rows with Remove, quantity input, unit price, Update Cart, total, Check Out; built: read-only "qty × price" list
  DESIGN-VERDICT: SWHR2-MCK-23 differs — the empty state shows a different message
- RESIDUAL: SWHR2-MCK-23 empty message — mockup: "Your Shopping Cart is Empty."; built: "Your cart will appear here once the cart ships."

Not compared by screenshot; compared by code against the mockup copy and structure.

## Issues Found

- DEFECT-1: cart operations, screen and failure routing not built. Future-sprint DEFECT SWHR2-T-0255.
- DEFECT-2: flaky `e2e/account.spec.ts:14`. Future-sprint DEFECT SWHR2-T-0256.

Resolution entries: `artifacts/SWHR2-S-0017/integration-defects-resolution.md`.

SCENARIO-VERDICT: One cart per browsing session / First use of the cart in a session — pass
SCENARIO-VERDICT: One cart per browsing session / Two sessions have separate carts — pass
SCENARIO-VERDICT: One cart per browsing session / Shopper signs out with items in the cart — pass
SCENARIO-VERDICT: Cart held for the session only / Session ends — pass
SCENARIO-VERDICT: Cart use without a security role / Anonymous visitor adds an item — pass
SCENARIO-VERDICT: Cart use without a security role / Anonymous visitor removes an item — fail
SCENARIO-VERDICT: Add item to cart / Add from the product listing — pass
SCENARIO-VERDICT: Add item to cart / Add from a search result — pass
SCENARIO-VERDICT: Add item with a supplied quantity / Item not yet in the cart — fail
SCENARIO-VERDICT: Add item with a supplied quantity / Item already in the cart — fail
SCENARIO-VERDICT: Remove control for a cart line / Shopper removes one line — fail
SCENARIO-VERDICT: Item removal semantics / Remove a line with several units — fail
SCENARIO-VERDICT: Item removal semantics / Remove an item not in the cart — fail
SCENARIO-VERDICT: Empty cart after order placement / Order placed — fail
SCENARIO-VERDICT: Cart line order / Lines listed — pass
SCENARIO-VERDICT: Failure routing to an error page / Order attempted with an empty cart — fail
SCENARIO-VERDICT: Failure routing to an error page / Failure matched by a more general kind — fail
SCENARIO-VERDICT: Failure routing to an error page / Unmapped failure — fail
SCENARIO-VERDICT: Shopping cart screen / Cart with items is displayed — fail
SCENARIO-VERDICT: Shopping cart screen / Empty cart is displayed — fail
SCENARIO-VERDICT: Shopping cart screen / Remove activated — fail
SCENARIO-VERDICT: Shopping cart screen / Check Out activated — fail

Basis for the passes: session-keyed map and sign-out discard by inspection of `services/cart.ts` and `services/session/store.ts`; anonymous add and add-from-listing by the passing e2e `[SWHR2-C-0207]` and `[SWHR2-C-0206]`; add-from-search by `search.test.tsx` within the 205 passing unit tests. Session-end and two-session isolation are verified by inspection only (in-memory map keyed by session id), not by a dedicated test.

## Recommendation

**Escalate: `validation.unfixable_defects_found`.** The cart feature was not delivered and cannot be built as a fix in place. A human should decide whether to continue with SWHR2-T-0255 in a new sprint. Do not release this as the shopping cart.
