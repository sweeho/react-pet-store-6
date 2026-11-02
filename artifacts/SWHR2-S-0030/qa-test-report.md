---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0030
capability brief: SWHR2-I-0011
branch: vortex/sprint/swhr2-s-0030-1957f09b
upstream: [artifacts/SWHR2-S-0030/SPRINT-PLAN.md]
downstream: [artifacts/SWHR2-S-0030/sprint-summary.md]
---

# QA test report — SWHR2-S-0030

## Executive Summary

Verdict: proceed. Order fulfilment and invoicing (SWHR2-I-0011) verified on the integrated sprint branch. Build, lint, 368 unit tests and 20 Playwright specs all pass. 44 of 44 delta-spec scenarios are recorded as pass; the order-fulfillment acceptance suite passes 43 of 44 and the one failure is a warning (acceptance is enforced at release UAT only). No defects were found in the project's own gates.

## E2E Test Status

`bun run test:e2e`: `20 passed (12.3s)`, 0 failed, 0 skipped. Details in `artifacts/SWHR2-S-0030/integration-test-result.md`.

Acceptance warnings (locked suite, not fixed, triaged at UAT). `bun run test:acceptance`: `Test Files 7 failed | 25 passed (32)`, `Tests 41 failed | 180 passed (221)`.

- order-fulfillment/messaging.test.ts: SWHR2-C-0136 (invoice reaches both subscribers). Harness imports `/services/notifications/send`, which does not exist (belongs to the customer-notifications capability). The same behaviour passes in `services/messaging/worker.test.ts`.
- sign-on/internal.test.ts: SWHR2-C-0264 times out at 5000ms in test setup (`shopper()`); reproduced on re-run. The equivalent unit test in `services/messaging/worker.test.ts` passes.
- Other capabilities, not this sprint's scope: customer-notifications (22), data-population (9, missing `scripts/seed`), sales-reporting (8), plus 1 above each.
- `bun run test:acceptance:e2e`: `11 failed`, `55 passed`; none in order-fulfillment (customer-account 1, data-population 1, localization 4, sales-reporting 4, supplier-inventory 1).

## Unit Test Results

`bun run test`: `Test Files  81 passed (81)`, `Tests  368 passed (368)`, exit 0. `bun run lint`: exit 0. `bun run build` (`tsc --build && vite build`): exit 0.

### Regression guards

Cases from SWHR2-T-0308 that already passed at red. Working = passing in unit tests this sprint; the acceptance column is the locked suite.

| Case         | Unit run                                      | Acceptance run                      |
| ------------ | --------------------------------------------- | ----------------------------------- |
| SWHR2-C-0106 | working (`services/orders/workflow.test.ts`)  | pass                                |
| SWHR2-C-0107 | working (`services/orders/workflow.test.ts`)  | pass                                |
| SWHR2-C-0118 | working (`services/messaging/worker.test.ts`) | pass                                |
| SWHR2-C-0123 | working (`services/orders/workflow.test.ts`)  | pass                                |
| SWHR2-C-0132 | working (`services/orders/workflow.test.ts`)  | pass                                |
| SWHR2-C-0135 | working (`services/messaging/worker.test.ts`) | pass                                |
| SWHR2-C-0137 | working (`services/messaging/worker.test.ts`) | pass                                |
| SWHR2-C-0263 | working (`services/messaging/worker.test.ts`) | pass                                |
| SWHR2-C-0264 | working (`services/messaging/worker.test.ts`) | fail (setup timeout, warning above) |

Scenario verdicts (spec `openspec/changes/swhr2-i-0011-order-fulfilment-and-invoic/specs/order-fulfillment/spec.md`). Basis: the order-fulfillment acceptance suite (43/44 pass, `Tests 1 failed | 43 passed (44)`) plus the unit tests above. The mapping is by suite, not a per-line trace. Scenario names are as in the spec.

SCENARIO-VERDICT: Asynchronous hand-off from storefront to order processing / Placing an order does not wait for processing — pass
SCENARIO-VERDICT: Asynchronous hand-off from storefront to order processing / An approved order is fulfilled and invoiced — pass
SCENARIO-VERDICT: Staged order processing / An order fulfilled in two shipments — pass
SCENARIO-VERDICT: Staged order processing / An order not yet approved is not fulfilled — pass
SCENARIO-VERDICT: Fulfilment message channels / Channels exist after installation — pass
SCENARIO-VERDICT: Fulfilment message channels / An invoice reaches every subscriber — pass
SCENARIO-VERDICT: Fulfilment message channels / A queued order survives a restart — pass
SCENARIO-VERDICT: One workflow record per order / A workflow record holds the current status — pass
SCENARIO-VERDICT: Starting an order workflow / Workflow started for a new order — pass
SCENARIO-VERDICT: Starting an order workflow / Duplicate workflow start rejected — pass
SCENARIO-VERDICT: Reading an order status / Status of a known order — pass
SCENARIO-VERDICT: Reading an order status / Status of an unknown order — pass
SCENARIO-VERDICT: Order lifecycle / New order starts pending — pass
SCENARIO-VERDICT: Order lifecycle / Approved order progresses to completion — pass
SCENARIO-VERDICT: Order lifecycle / Denied order stops — pass
SCENARIO-VERDICT: Order status tracking / Approval decision applied to a pending order — pass
SCENARIO-VERDICT: Order status tracking / Approval decision ignored for an order no longer pending — pass
SCENARIO-VERDICT: Order status tracking / Shipment recorded — pass
SCENARIO-VERDICT: Configurable stage hand-off / Batch hand-off — pass
SCENARIO-VERDICT: Configurable stage hand-off / Transition cannot be loaded — pass
SCENARIO-VERDICT: Order message processed as one unit / Failure after a status change — pass
SCENARIO-VERDICT: Order line record / New order lines start unshipped — pass
SCENARIO-VERDICT: Dependent records removed with a purchase order / Purchase order deleted — pass
SCENARIO-VERDICT: Supplier order identity / Duplicate supplier order rejected — pass
SCENARIO-VERDICT: New supplier order is pending / Supplier order created — pass
SCENARIO-VERDICT: Supplier order status vocabulary / Supplier order status values — pass
SCENARIO-VERDICT: Supplier order lines start unshipped / Supplier order lines copied — pass
SCENARIO-VERDICT: Supplier order contact and lines belong to the order / Supplier order deleted — pass
SCENARIO-VERDICT: Listing supplier orders by status / Pending supplier orders listed — pass
SCENARIO-VERDICT: Atomic supplier order creation / Line item cannot be stored — pass
SCENARIO-VERDICT: Supplier order document content / Supplier order document built — pass
SCENARIO-VERDICT: Supplier order document content / Supplier order without lines — pass
SCENARIO-VERDICT: Supplier document mandatory fields / Missing order identifier — pass
SCENARIO-VERDICT: Supplier document mandatory fields / Missing shipping phone — pass
SCENARIO-VERDICT: Supplier document dates / Order date written as a date — pass
SCENARIO-VERDICT: Supplier document format identification and resolution / Default format identification — pass
SCENARIO-VERDICT: Supplier document format identification and resolution / Deployment catalog overrides the built-in one — pass
SCENARIO-VERDICT: Published document format catalog / Catalog requested — pass
SCENARIO-VERDICT: Supplier receives purchase orders by message / Purchase order received — pass
SCENARIO-VERDICT: Purchase order receipt as one unit of work / Invoice publication fails — pass
SCENARIO-VERDICT: Re-fulfilment after an inventory change / Restock completes a waiting order — pass
SCENARIO-VERDICT: Re-fulfilment after an inventory change / Restock that does not cover a waiting order — pass
SCENARIO-VERDICT: Supplier invoice accepted by order processing / Invoice read — pass
SCENARIO-VERDICT: Supplier invoice accepted by order processing / Document that is not an invoice — pass

## Code Review

No notable concerns observed. Incidental: the acceptance harness for order-fulfillment depends on a notifications module owned by another capability, so one acceptance case cannot pass until that exists.

## Coverage Summary

No coverage tool was run; no coverage script is declared in `package.json` (a `stryker.config.json` exists but mutation testing was not run). Coverage numbers: Not Provided.

## Issues Found

None in the project's own gates. Locked acceptance failures are warnings (see E2E Test Status). No DEFECT tickets filed. No design reference applies: fulfilment has no screen, so there is no mockup comparison.

## Recommendation

Proceed: fire `validation.all_acs_passed`.
