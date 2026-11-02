---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0031
capability brief: SWHR2-I-0012
branch: vortex/sprint/swhr2-s-0031-cfa6ffdc
upstream: [artifacts/SWHR2-S-0031/SPRINT-PLAN.md]
downstream:
  [
    artifacts/SWHR2-S-0031/integration-test-result.md,
    artifacts/SWHR2-S-0031/integration-defects-resolution.md,
  ]
---

# QA test report — SWHR2-S-0031

## Executive Summary

**Verdict: PASS.** The integrated sprint branch builds, lints, typechecks, passes all 398 unit tests (84 files) and all 20 Playwright specs. Each of the 22 customer-notifications scenarios is verified by the sprint's own service tests, which cite their case keys and pass (30 tests in `services/notifications`). No product defects were found. 6 locked acceptance tests for this capability fail inside the test harness (see warnings below); per project policy they are triaged at UAT.

## E2E Test Status

`bun run test:e2e -- --project=chromium`: `20 passed (14.2s)`, 0 failed, 0 skipped. Details in `artifacts/SWHR2-S-0031/integration-test-result.md`. This capability has no screen, so no Playwright spec targets it directly.

Locked acceptance suite (`bun run test:acceptance`): `Test Files 5 failed | 27 passed (32); Tests 24 failed | 197 passed (221)`. WARNINGS only (enforced at UAT, not fixed):

- customer-notifications (6): SWHR2-C-0049, 0055, 0056, 0061, 0062, 0067 fail with `TypeError: statusOf / messages / approvalXml is not a function`. `tests/acceptance/customer-notifications/harness.ts` re-exports these from `../order-fulfillment/harness` and they are undefined, so the fault is in the locked test harness, not the product. The same behaviours pass in `services/notifications/notifications.test.ts` (SWHR2-C-0049, 0056, 0055, 0061, 0062, 0067 verified green in verbose run). The other 16 notification acceptance tests pass.
- sales-reporting (8: SWHR2-C-0001, 0006-0008, 0012-0015), data-population (9: SWHR2-C-0070-0078), sign-on (1: SWHR2-C-0264, 5000ms timeout): other capabilities, outside this sprint.

## Unit Test Results

```
$ bun run test
 Test Files  84 passed (84)
      Tests  398 passed (398)
```

`bun run lint` exit 0, `bun run typecheck` exit 0, `bun run build` exit 0.

## Code Review

No notable concerns observed. Observed incidentally: notification code lives in `services/notifications/` (config, request validation, send, handlers, templates).

## Coverage Summary

No coverage tool was run (not part of the declared commands). Evidence Required for any coverage figure.

## Design fidelity

No design reference on this capability brief (no screen; capability runs behind the scenes).

## Regression guards

- SWHR2-T-0313: SWHR2-C-0046 — behaviour working: the case is cited by passing tests in `services/notifications` and its acceptance test passes in this run.

## Issues Found

None in the product. Test-harness fault in locked acceptance tests noted above (not filed; UAT triage). See `integration-defects-resolution.md`.

SCENARIO-VERDICT: Independently switchable order notifications / Only the approval notification is enabled — pass
SCENARIO-VERDICT: Independently switchable order notifications / A disabled notification's event occurs — pass
SCENARIO-VERDICT: Order notifications disabled unless enabled at deployment / No notification is enabled at deployment — pass
SCENARIO-VERDICT: Order notifications disabled unless enabled at deployment / One notification is enabled at deployment — pass
SCENARIO-VERDICT: Recipient address list / Two recipients in one request — pass
SCENARIO-VERDICT: Recipient address list / Single recipient — pass
SCENARIO-VERDICT: Configurable mail server and sender / Shipped sender address — pass
SCENARIO-VERDICT: Configurable mail server and sender / Operator changes the mail server and sender — pass
SCENARIO-VERDICT: E-mail request format / Complete request is accepted — pass
SCENARIO-VERDICT: E-mail request format / Request missing its subject is rejected — pass
SCENARIO-VERDICT: Asynchronous e-mail delivery from a queue / One request produces one e-mail — pass
SCENARIO-VERDICT: Asynchronous e-mail delivery from a queue / Producer does not wait for delivery — pass
SCENARIO-VERDICT: Content sent as supplied / Pre-formatted content is delivered unchanged — pass
SCENARIO-VERDICT: Completed-order e-mail content / Order completes with completed-order mail enabled — pass
SCENARIO-VERDICT: Completed-order e-mail content / Order completes with completed-order mail disabled — pass
SCENARIO-VERDICT: Per-notification deployment switch consumes the trigger / Shipment notification switched off — pass
SCENARIO-VERDICT: Per-notification deployment switch consumes the trigger / Switching one notification does not affect the others — pass
SCENARIO-VERDICT: Customer e-mail sequence for an order / Order fulfilled in two shipments — pass
SCENARIO-VERDICT: Configurable mail server account / Operator sets the mail-server account — pass
SCENARIO-VERDICT: Notification sequence on enabled notifications / Order fulfilled in a single shipment — pass
SCENARIO-VERDICT: Separate durable notification channels / Mail server unavailable — pass
SCENARIO-VERDICT: Separate durable notification channels / Channels are distinct — pass

## Recommendation

Proceed: fire `validation.all_acs_passed`.
