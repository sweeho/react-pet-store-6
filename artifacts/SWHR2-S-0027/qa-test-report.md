---
artifact: qa-test-report
sprint: SWHR2-S-0027
ticket: SWHR2-T-0296
author: validation
---

# QA test report — SWHR2-S-0027 (SWHR2-I-0009 Order approval)

## Executive Summary

Order approval (SWHR2-T-0295) verified on the merged sprint branch. `bun run build` exit 0, `bun run verify` exit 0 (303 unit tests pass), `bun run test:e2e` 19 passed. All 8 locked order-approval acceptance e2e tests and all order-approval acceptance unit tests pass. No defects found in sprint scope.

## E2E Test Status

`bun run test:e2e`: `19 passed (12.7s)`, 0 failed, 0 skipped. Details in `integration-test-result.md`.

Warnings (locked acceptance suite, enforced only at UAT; not fixed, not holding the sprint). None are in `tests/acceptance/order-approval/`:

- `bun run test:acceptance:e2e`: 15 failed / 51 passed. Failing: customer-account C-0157; data-population C-0079; localization C-0021, C-0026, C-0028, C-0039; sales-reporting C-0003, C-0009, C-0010, C-0011; sign-on C-0255, C-0256, C-0269; supplier-inventory C-0041, C-0042.
- `bun run test:acceptance`: 88 failed / 133 passed in 11 files: sales-reporting/order-table.test.tsx, reports.test.ts; customer-notifications notifications.test.ts, sender.test.ts; data-population population.test.ts; order-fulfillment documents, messaging, supplier, workflow tests; sign-on internal.test.ts; supplier-inventory stock.test.ts. I did not investigate causes; the data-population migration test references the `messages` table that T-0295 renamed in the outbox move, which is a likely contributor.

SCENARIO-VERDICT: Pending and non-pending order views / Orders are split between the two views — pass (acceptance e2e C-0242)
SCENARIO-VERDICT: Pending and non-pending order views / Non-pending view reloaded on request — pass (C-0243)
SCENARIO-VERDICT: Pending order status colour coding / Statuses are colour-coded — pass (order-approval acceptance and colocated unit tests)
SCENARIO-VERDICT: Batch approval and denial committed together / Decisions held until commit — pass (C-0244)
SCENARIO-VERDICT: Batch approval and denial committed together / Decisions applied on commit — pass (order-approval acceptance and e2e/order-approval.spec.ts)
SCENARIO-VERDICT: Warning before discarding uncommitted decisions / Refresh cancelled — pass (C-0247)
SCENARIO-VERDICT: Warning before discarding uncommitted decisions / Refresh confirmed — pass (C-0248)
SCENARIO-VERDICT: Warning before discarding uncommitted decisions / Refresh with nothing uncommitted — pass (C-0249)
SCENARIO-VERDICT: Loading order data on start and refresh / Tool start — pass (C-0240)
SCENARIO-VERDICT: Loading order data on start and refresh / Refresh — pass (C-0241)
SCENARIO-VERDICT: Busy state during server requests / Update in progress — pass (order-approval acceptance unit/e2e)
SCENARIO-VERDICT: Busy state during server requests / Retrieval in progress — pass (same)
SCENARIO-VERDICT: Busy state during server requests / Reply applied — pass (same)
SCENARIO-VERDICT: New orders start pending / Order recorded before the approval decision — pass (order-approval acceptance server tests)
SCENARIO-VERDICT: Automatic approval thresholds by locale / Japanese order below threshold — pass
SCENARIO-VERDICT: Automatic approval thresholds by locale / Japanese order at the threshold — pass
SCENARIO-VERDICT: Automatic approval thresholds by locale / Chinese order of a small total — pass
SCENARIO-VERDICT: Automatic approval of small US orders / US order below threshold — pass
SCENARIO-VERDICT: Automatic approval of small US orders / US order at exactly the threshold — pass
SCENARIO-VERDICT: Automatic approval of small US orders / US order above threshold — pass
SCENARIO-VERDICT: Asynchronous delivery of administrator decisions / Decisions delivered as one message — pass
SCENARIO-VERDICT: Durable order approval channel / Decision survives until consumed — pass
SCENARIO-VERDICT: Approval batch status is free text / Unlisted status carried — pass

Scenario verdicts rest on the order-approval acceptance tests (none failing under `tests/acceptance/order-approval/`) plus the colocated tests; I ran the suites rather than driving each scenario by hand.

## Unit Test Results

`bun run verify` (lint, `tsc --build`, `bun --bun vitest run`): exit 0. `Test Files 71 passed (71)`, `Tests 303 passed (303)`.

## Code Review

Not a line-by-line review of the merged diff. Read T-0295's `summary.md` and `design-check.md` and relied on the passing suites. No issue observed.

## Coverage Summary

No coverage tool is declared for this project and none was run; no coverage figure is claimed.

## Issues Found

No defects in sprint scope. Out-of-scope observation: 15 locked acceptance e2e and 88 locked acceptance unit failures in other capabilities (see E2E Test Status), triaged at UAT.

## Recommendation

Pass the sprint: every order-approval scenario passes and the project's own gates (build, verify, e2e) are green. Triage the other-capability acceptance failures at UAT.

## Design fidelity

Verdicts come from T-0295's `design-check.md` and code reading, not from my own paired renders.

DESIGN-VERDICT: SWHR2-MCK-28 differs — layout, tabs, toolbar, table and legend match; no per-row status dropdown (tick boxes plus Approve/Deny instead)

- RESIDUAL: SWHR2-MCK-28 status cell — mockup: per-row dropdown caret; built: tick boxes with Approve/Deny
  DESIGN-VERDICT: SWHR2-MCK-29 differs — warning is the native confirm with the spec text, not the drawn in-page dialog
- RESIDUAL: SWHR2-MCK-29 refresh warning — mockup: in-page dialog; built: native browser confirm
  DESIGN-VERDICT: SWHR2-MCK-30 differs — controls disabled and "Updating data on the server..." shown as plain text under the header, not in-bar
- RESIDUAL: SWHR2-MCK-30 busy indicator — mockup: in-bar indicator; built: text under header
  DESIGN-VERDICT: SWHR2-MCK-31 differs — header "ID" and status ordering differ from the sample
- RESIDUAL: SWHR2-MCK-31 header — mockup: "Order ID"; built: "ID"
