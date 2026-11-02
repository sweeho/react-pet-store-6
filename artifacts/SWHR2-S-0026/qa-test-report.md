---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0026
capability brief: SWHR2-I-0008
branch: vortex/sprint/swhr2-s-0026-8875aed6
upstream: [artifacts/SWHR2-S-0026/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0026/sprint-summary.md]
---

# QA test report — SWHR2-S-0026

## Executive Summary

Verdict: proceed. All 16 scenarios in `openspec/changes/swhr2-i-0008-checkout-and-order-placemen/specs/checkout/spec.md` pass, `bun run verify` is green (274 unit tests) and the project E2E suite passes 18/18 with 0 skipped. No defects were found. The 25 failing locked acceptance E2E tests and 97 failing acceptance unit tests belong to other capabilities (order approval, fulfilment, notifications, reporting, data population, sign-on, supplier inventory, localization, customer account) and are warnings per the UAT-only enforcement setting.

Checkout verification was run on the merged sprint branch. Checkout's own locked acceptance tests all pass: 14/14 in `tests/acceptance/checkout/` (vitest) and 3/3 in `tests/acceptance/checkout/e2e/checkout.spec.ts` (Playwright).

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

## E2E Test Status

Project E2E (`bun run test:e2e`): 18 passed, 0 failed, 0 skipped. Details in `artifacts/SWHR2-S-0026/integration-test-result.md`.

Locked acceptance suite (warnings only, enforced at release UAT, not fixed here):

- `bun run test:acceptance:e2e`: 41 passed, 25 failed. Checkout's SWHR2-C-0215, SWHR2-C-0216 and SWHR2-C-0212 pass. Failing specs: `customer-account/e2e/account.spec.ts` (C-0157, C-0160), `data-population/e2e/areas.spec.ts` (C-0079), `localization/e2e/localization.spec.ts` (C-0021, C-0026, C-0028, C-0039), `order-approval/e2e/tool.spec.ts` (C-0240 to C-0244, C-0247 to C-0249), `sales-reporting/e2e/tool.spec.ts` (C-0003 to C-0005, C-0009 to C-0011), `sign-on/e2e/sign-on.spec.ts` (C-0255, C-0256), `supplier-inventory/e2e/inventory.spec.ts` (C-0041, C-0042). Log: /tmp/acce2e.log (not committed).
- None of these cases belong to the checkout capability.

## Unit Test Results

`bun run verify` (lint, typecheck, unit): exit 0. Vitest summary verbatim: `Test Files  67 passed (67)` / `Tests  274 passed (274)`.

Locked acceptance unit suite (`bun run test:acceptance`, warning only): `Test Files  13 failed | 19 passed (32)`, `Tests  97 failed | 116 passed (213)`. Failing files: order-approval (approval.test.ts, tool-ui.test.tsx), order-fulfillment (documents, messaging, supplier, workflow), customer-notifications (notifications, sender), data-population (population), sales-reporting (reports, order-table.test.tsx), sign-on (internal), supplier-inventory (stock). All are later capabilities. Checkout re-run on its own: `bun --bun vitest run --config vitest.acceptance.config.ts tests/acceptance/checkout` gives `Test Files  2 passed (2)`, `Tests  14 passed (14)`.

## Code Review

No notable concerns observed. Incidental: the built Telephone and E-mail inputs on the checkout form are narrow and clip their values (see Design fidelity).

## Coverage Summary

No coverage tool was run (none is declared among the project commands). Mutation config exists (`stryker.config.json`) and was not run.

## Design fidelity

Method: Playwright screenshots of the mockup (file://) and the built screen at 1440x900, in `artifacts/SWHR2-S-0026/qa/design/` (billing and empty-cart paired; Server Error mockup rendered and compared against the implementation ticket's built capture `artifacts/SWHR2-S-0026/SWHR2-T-0290/design-check/server-error-built.png`; Order Placed and Empty-cart compared by that ticket's design-check.md and captures). No fixes were made. Server Error and Order Placed were not re-rendered by me in a failing or completed state beyond that capture; the verdict for them leans on the implementation ticket's record.

DESIGN-VERDICT: SWHR2-MCK-24 match — layout, sections, banner, order summary and Place order controls match; differences are shell, sample data and copy listed below

- RESIDUAL: SWHR2-MCK-24 application shell — mockup: breadcrumbs, language segmented control and Catalog sub-list; built: the existing shell with EN/JA/ZH buttons and a category list
- RESIDUAL: SWHR2-MCK-24 address line 2 label — mockup: "Street address line 2"; built: "Address line 2" (locked case SWHR2-C-0215 counts /street/ fields)
- RESIDUAL: SWHR2-MCK-24 Telephone and E-mail fields — mockup: values fully visible; built: narrow inputs clip "555-555-5555" and "abc@xyz.com"
- RESIDUAL: SWHR2-MCK-24 order lines — mockup: item thumbnails and three lines; built: no thumbnails, one cart line

DESIGN-VERDICT: SWHR2-MCK-25 differs — heading is "Your order is complete" instead of "Order placed" (locked cases C-0101 and C-0174 require it)

- RESIDUAL: SWHR2-MCK-25 heading and greeting — mockup: "Order placed", "Thanks, Alex"; built: "Your order is complete", "Thanks, we have your order."

DESIGN-VERDICT: SWHR2-MCK-26 match — heading, subtitle, empty-state card, Browse the catalog and View cart present

- RESIDUAL: SWHR2-MCK-26 application shell — mockup: own header and rail; built: the existing shell

DESIGN-VERDICT: SWHR2-MCK-27 match — message, notify-the-administrator text and technical trace shown; sample content differs

- RESIDUAL: SWHR2-MCK-27 meta line and pill — mockup: "Error" pill and Time/Page line; built: omitted, and the trace is the real server trace

## Issues Found

None. No entry in `artifacts/SWHR2-S-0026/integration-defects-resolution.md`. SPEC-GAP: none observed.

## Recommendation

Proceed: fire `validation.all_acs_passed`. Release UAT should triage the acceptance warnings listed under E2E Test Status; none concern checkout.
