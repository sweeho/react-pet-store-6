---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0024
ticket: SWHR2-T-0285
capability brief: SWHR2-I-0008
branch: vortex/sprint/swhr2-s-0024-d5762589
upstream: [artifacts/SWHR2-S-0024/SWHR2-T-0284/summary.md]
downstream: [artifacts/SWHR2-S-0024/qa-test-report.md]
---

# QA test report — SWHR2-S-0024

## Executive Summary

**Verdict: PASS.** The 16 scenarios of capability SWHR2-I-0008 (Checkout and order placement) hold on the integrated sprint branch. One minor defect (DEFECT-1, Order Placed title not an `h1`, found by the sprint's own E2E spec) was fixed in place with a red/green pair. After the fix: lint, typecheck and unit tests pass, and the E2E suite reports 22 passed, 0 failed, 0 skipped.

## E2E Test Status

Final run: `22 passed (12.5s)`, 0 failed, 0 skipped; the locked acceptance browser specs for checkout: `3 passed`. The first run had 1 failure (DEFECT-1). Note that `bun run test:e2e` fails its preflight here (it expects Chromium 1155, the container has 1223), so Playwright was run with an executable-path override; details in `artifacts/SWHR2-S-0024/integration-test-result.md`.

## Unit Test Results

```
$ bun run verify     (lint + typecheck + test)
 Test Files  69 passed (69)
      Tests  282 passed (282)
```

Baseline before the fix was 281 tests; the added test is the DEFECT-1 red test. `bun run build` exit 0.

Locked acceptance suite for checkout:

```
$ NODE_ENV=test bun --bun vitest run --config vitest.acceptance.config.ts tests/acceptance/checkout
 Test Files  2 passed (2)
      Tests  14 passed (14)
```

The full `bun run test:acceptance` reports `13 failed | 19 passed` files (`98 failed | 115 passed` tests). The failures are in other capabilities not built in this sprint (supplier order, order approval, order fulfilment, notifications); no checkout test is among them. This is outside the sprint's scope.

SCENARIO-VERDICT: Billing and shipping information screen pre-filled at checkout / Signed-on customer reaches the checkout form — pass
SCENARIO-VERDICT: Billing and shipping information screen pre-filled at checkout / Customer confirms the pre-filled form — pass
SCENARIO-VERDICT: Order id from the 1001 sequence / First orders placed — pass
SCENARIO-VERDICT: Identifier request requires a prefix / Identifier requested without a prefix — pass
SCENARIO-VERDICT: Unique order id from a shared counter / Two orders placed — pass
SCENARIO-VERDICT: Server Error page on unexpected failure / Unexpected failure during order placement — pass
SCENARIO-VERDICT: Atomic purchase order creation / Order created with its dependents — pass
SCENARIO-VERDICT: Atomic purchase order creation / Dependent record cannot be created — pass
SCENARIO-VERDICT: Checkout hands the submitted order to order processing asynchronously / Customer submits the checkout form — pass
SCENARIO-VERDICT: Purchase order exchanged as a structured order document / Valid order document round-trips — pass
SCENARIO-VERDICT: Purchase order exchanged as a structured order document / Document is not a purchase order — pass
SCENARIO-VERDICT: Purchase order exchanged as a structured order document / Card element is not a credit card — pass
SCENARIO-VERDICT: Identifier request fails when its sequence is unavailable / Sequence cannot be created for a new prefix — pass
SCENARIO-VERDICT: Identifier request fails when its sequence is unavailable / Sequence store cannot be located — pass
SCENARIO-VERDICT: Purchase order identified and retrieved by its order id / Order looked up by its id — pass
SCENARIO-VERDICT: Purchase order identified and retrieved by its order id / Second order with an existing id — pass

Basis: each scenario is cited by a case in the locked acceptance suite (`tests/acceptance/checkout`: C-0212 to C-0227; vitest 14 passed, browser 3 passed) and the carried-over unit/E2E specs. I read the case titles against the scenarios; I did not drive the app by hand.

## Code Review

No notable concerns observed. The DEFECT-1 fix is a one-element change (`p` to `h1`) in `src/pages/petstore/order-placed.tsx`.

## Coverage Summary

No coverage tool is declared in the project commands and none was run; no coverage figure is claimed. Test count rose from 281 to 282 (one test added).

## Design fidelity

Reference: `artifacts/SWHR2-S-0024/design/*.html` (SWHR2-MCK-24 to MCK-27, 1440). Method: by reading the mockup markup against the page components and T-0284's `design-check.md`; the rendered E2E run was not screenshotted, so no paired screenshots exist. The DESIGN-VERDICT lines are therefore unverified visually.

DESIGN-VERDICT: SWHR2-MCK-24 differs — Continue + separate confirm step instead of one "Place order" button (locked specs require it); State label "State"; no breadcrumb

- RESIDUAL: SWHR2-MCK-24 submit action — mockup: single "Place order" button; built: "Continue" then "Confirm order" on `/petstore/confirm-order`
  DESIGN-VERDICT: SWHR2-MCK-25 differs — title now `h1` as in the mockup (DEFECT-1); Placed date and Bill to rows omitted
- RESIDUAL: SWHR2-MCK-25 order summary — mockup: Placed date and Bill to rows; built: Ship to, lines and total only
  DESIGN-VERDICT: SWHR2-MCK-26 match — none found by reading, breadcrumb row omitted
- RESIDUAL: none
  DESIGN-VERDICT: SWHR2-MCK-27 differs — Time and Page meta line omitted
- RESIDUAL: SWHR2-MCK-27 meta line — mockup: Time and Page; built: not shown
  The design-conformance decision is off for this project (`disabled: true`); nothing was recorded.

## Regression guards

- SWHR2-C-0214 (credit-card record cannot be created, nothing kept): working. `tests/acceptance/checkout/orders.test.ts` passes in this sprint's run (14 passed).
- SWHR2-C-0225 (sequence store unavailable, request fails, no id issued): working. `tests/acceptance/checkout/unit.test.ts` passes in this sprint's run.

## Issues Found

- DEFECT-1 (minor): Order Placed title was a `<p>`, not a heading; E2E C-0101/C-0254 failed. Fixed in place (`5ff11c3` red, `56b6f5f` green). See `integration-defects-resolution.md`.
- SPEC-GAP: Order Placed title is not a heading — no scenario covers this behaviour

No future-sprint DEFECT tickets filed.

## Recommendation

Proceed: fire `validation.all_acs_passed`. All 16 scenarios pass, the one defect was fixed in place, and the final E2E run is 22 passed, 0 failed, 0 skipped.
