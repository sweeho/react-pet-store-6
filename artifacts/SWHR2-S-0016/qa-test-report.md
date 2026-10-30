---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0016
capability brief: SWHR2-I-0007
branch: vortex/test/SWHR2-T-0249-integration-qa-report-swhr2-s-0016-b80586a2
upstream: [artifacts/SWHR2-S-0016/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0016/sprint-summary.md]
---

# QA test report — SWHR2-S-0016

## Executive Summary

The sprint goal "Shopping cart" is not met. The only feature ticket, SWHR2-T-0247, is DEFERRED, so the cart is still the pre-sprint partial version. Build, typecheck-via-build and the 205 unit tests pass, but 11 locked acceptance tests for the shopping-cart capability fail. E2E could not run (no matching browser). Verdict: unfixable defects escalated (SWHR2-T-0250).

## E2E Test Status

Not run: Chromium revision 1155 is missing (container has 1223). See `integration-test-result.md`. `E2E-RESULT: chromium 0 passed, 0 failed, 0 skipped`. No cart E2E spec exists.

## Unit Test Results

Command `bun run test`: Test Files 55 passed (55), Tests 205 passed (205), exit 0. `bun run build` exit 0.

Command `bun run test:acceptance`: Test Files 18 failed | 13 passed (31); Tests 127 failed | 82 passed (209). The shopping-cart failures: SWHR2-C-0080, 0081, 0086, 0087, 0090, 0091, 0092, 0094, 0098, 0099, 0100. The other 16 failing files belong to other capabilities (e.g. checkout, missing `services/ids`) and were not attributed to this sprint.

## Code Review

Reviewed by inspection only. `services/cart.ts` still has `addItem` incrementing quantity, with no remove/update/clear/total. `routes/api/cart/` has only `index.get.ts` and `items.post.ts`. `services/errors.ts`, `src/errors/`, `src/pages/petstore/error/` do not exist. No code was changed by this ticket.

## Coverage Summary

No coverage run was executed (no coverage command is declared). Not assessed.

## Issues Found

- DEFECT-1 (high): cart feature not implemented; filed as future-sprint DEFECT SWHR2-T-0250. See `integration-defects-resolution.md`.
- E2E could not run: browser revision mismatch in the QA container (environment limitation).
- Design: SWHR2-MCK-22 / SWHR2-MCK-23 comparison not possible; the full cart screen is not built.

DESIGN-VERDICT: SWHR2-MCK-22 not built — cart screen lacks Remove, quantity field, Update Cart, total and Check Out

- RESIDUAL: SWHR2-MCK-22 whole screen — mockup: table with Remove, quantity input, Update Cart, Total, Check Out; built: legacy list without these
  DESIGN-VERDICT: SWHR2-MCK-23 not built — empty message "Your Shopping Cart is Empty." not implemented
- RESIDUAL: SWHR2-MCK-23 empty message — mockup: "Your Shopping Cart is Empty."; built: legacy message

Scenario verdicts (from the locked acceptance results, `bun run test:acceptance`; scenarios without a red test were not independently exercised and are marked accordingly):

SCENARIO-VERDICT: One cart per browsing session / First use of the cart in a session — pass
SCENARIO-VERDICT: One cart per browsing session / Two sessions have separate carts — pass
SCENARIO-VERDICT: One cart per browsing session / Shopper signs out with items in the cart — pass
SCENARIO-VERDICT: Cart held for the session only / Session ends — pass
SCENARIO-VERDICT: Cart use without a security role / Anonymous visitor adds an item — pass
SCENARIO-VERDICT: Cart use without a security role / Anonymous visitor removes an item — fail (C-0094)
SCENARIO-VERDICT: Add item to cart / Add from the product listing — not-testable: no E2E browser; API add exists but no browser run
SCENARIO-VERDICT: Add item to cart / Add from a search result — not-testable: no E2E browser
SCENARIO-VERDICT: Add item with a supplied quantity / Item not yet in the cart — fail (C-0080)
SCENARIO-VERDICT: Add item with a supplied quantity / Item already in the cart — fail (C-0081)
SCENARIO-VERDICT: Remove control for a cart line / Shopper removes one line — fail (C-0098)
SCENARIO-VERDICT: Item removal semantics / Remove a line with several units — fail (C-0099)
SCENARIO-VERDICT: Item removal semantics / Remove an item not in the cart — fail (C-0100)
SCENARIO-VERDICT: Empty cart after order placement / Order placed — not-testable: order placement (checkout) not present in this sprint
SCENARIO-VERDICT: Cart line order / Lines listed — pass
SCENARIO-VERDICT: Failure routing to an error page / Order attempted with an empty cart — fail (C-0090)
SCENARIO-VERDICT: Failure routing to an error page / Failure matched by a more general kind — fail (C-0091)
SCENARIO-VERDICT: Failure routing to an error page / Unmapped failure — fail (C-0092)
SCENARIO-VERDICT: Shopping cart screen / Cart with items is displayed — fail (C-0086)
SCENARIO-VERDICT: Shopping cart screen / Empty cart is displayed — fail (C-0087)
SCENARIO-VERDICT: Shopping cart screen / Remove activated — fail: Remove control not built
SCENARIO-VERDICT: Shopping cart screen / Check Out activated — fail: Check Out link not built

## Recommendation

Do not accept the sprint as delivering the shopping cart. Unfixable defect SWHR2-T-0250 is filed for a future sprint; verdict `validation.unfixable_defects_found`. Re-run E2E in a container with Chromium 1155 once the cart is implemented.
