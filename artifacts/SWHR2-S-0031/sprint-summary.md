---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0031
capability_brief: SWHR2-I-0012
branch: vortex/sprint/swhr2-s-0031-cfa6ffdc
upstream:
  [
    artifacts/SWHR2-S-0031/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0031/qa-test-report.md,
    artifacts/SWHR2-S-0031/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0031/release-notes.md]
---

# Sprint summary — SWHR2-S-0031

Goal: "SWHR2-I-0012: Customer notifications". Met. `qa-test-report.md` records all 22 scenarios of change `swhr2-i-0012-customer-notifications` as pass, and integration QA found no product defects. Six locked acceptance tests for this capability still fail inside the locked test harness (see Known Issues).

## Tickets

| Ticket       | Type    | Title                                | Outcome                                                                                                                        |
| ------------ | ------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| SWHR2-T-0312 | TASK    | Sprint plan — SWHR2-S-0031           | DONE, 942937f / 83049c8. Planning section P1–P6 and spec discrepancies X1–X6 in the change's design.md; `SWHR2-T-0313/PLAN.md` |
| SWHR2-T-0313 | FEATURE | Customer notifications               | DONE, 8f5eabd (PR #92). `SWHR2-T-0313/summary.md`, `tdd-test-result.md`                                                        |
| SWHR2-T-0314 | TASK    | Integration QA report — SWHR2-S-0031 | DONE, 9d41c47 (PR #94). PASS, no defects                                                                                       |
| SWHR2-T-0315 | TASK    | Sprint close bundle — SWHR2-S-0031   | this file                                                                                                                      |

## What shipped

All of it was built in SWHR2-T-0313 (detail in its `summary.md`):

- Approval, shipment and completion e-mails, each behind its own `NOTIFY_APPROVAL_ENABLED` / `NOTIFY_SHIPMENT_ENABLED` / `NOTIFY_COMPLETED_ENABLED` switch, off unless set to `true` (`services/notifications/config.ts`, `handlers.ts`).
- Order steps only enqueue: `decide.ts` puts approval on `notify.approval`, `invoice.ts` puts completion on `notify.completed`, and shipment arrives through the new `notify.shipment` subscriber on `supplier.invoice`. A switched-off trigger is consumed with no mail.
- Locale templates for en_US, ja_JP and zh_CN. The completion e-mail has the subject "Java Pet Store Order COMPLETED: <id>" and lists each line with category, product, quantity and unit price (`services/notifications/templates/`).
- The mail sender (`services/notifications/request.ts`, `send.ts`):
  - accepts a request only with recipient, subject and content
  - sends to a comma-separated recipient list, all as To
  - passes the HTML content through unchanged
  - uses nodemailer over SMTP, with operator-set `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD` and `MAIL_FROM` (default `customerservice@javapetstoredemo.com`)
- The outbox worker has an async handler path for `mail.outbound`. The send is awaited outside the delivery transaction, a transport error is retried, and a malformed request is marked `failed` (`services/messaging/worker.ts`).

## Divergence from plan

- The shipment subject is `Java Pet Store Order Shipment: <id>`. The plan fixed only that it carries the order id and avoids "Order Status:" and "COMPLETED".
- Subjects are English in every locale; only bodies are localized. The spec only fixes the English completion subject.
- Two existing tests, `services/messaging/worker.test.ts` and `services/orders/invoice.test.ts`, were updated for the second `supplier.invoice` subscriber. They were not in the ownership map, but the edits are required by it.
- Otherwise as planned. Spec discrepancies X1–X6 (retry rather than discard on send failure, missing switch = off, malformed request marked `failed`, and the others) are recorded in the change's design.md.

## Verification

Proceed, per `qa-test-report.md`:

- Lint, typecheck and build exit 0.
- 398 unit tests in 84 files pass.
- Playwright: 20 passed, 0 failed, 0 skipped.
- Customer-notifications locked acceptance: 16 of 22 pass.
- The deferred SWHR2-C-0136 now passes. I re-ran it at close: `messaging.test.ts` plus the customer-notifications suite gave 22 passed and 6 failed, the same 6 as QA.
- Coverage was not measured.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- SWHR2-C-0049, SWHR2-C-0055, SWHR2-C-0056, SWHR2-C-0061, SWHR2-C-0062 and SWHR2-C-0067 fail in `tests/acceptance/customer-notifications/notifications.test.ts` with `TypeError: statusOf / messages / approvalXml is not a function`. Those helpers are re-exported by the locked `harness.ts` from `../order-fulfillment/harness`, and they arrive undefined at runtime. This is a locked-test fault, triaged at UAT. The same behaviours pass in `services/notifications/notifications.test.ts`.
- SWHR2-C-0264 (sign-on) still times out in setup, as in SWHR2-S-0030. Sales-reporting (8) and data-population (9) locked cases fail because those capabilities are not built yet.
- Delivery is at-least-once: a crash between an SMTP send and marking its row delivered resends that e-mail (design.md P1).
- No status e-mail is specified for a DENIED order (spec discrepancy X6). The implementation follows the change's target design; no test covers it.

## Defects Raised

None. No DEFECT ticket was created between sprint start (2026-11-02T15:40Z) and close.

## Retrospective

- Went well: one FEATURE delivered the full 22-scenario change, plus the deferred C-0136, in a single dispatch.
- Went well: planning read the locked harness before decomposing. It fixed module paths, exports and channel names up front, and resolved three tasks.md/spec conflicts (X1–X3) from the tests, so the FEATURE needed no plan revision.
- Could improve: six locked cases for this capability are red because of a harness re-export fault. Nobody can fix that before UAT, so the locked suite cannot yet prove this capability on its own. One test-author fix to `harness.ts` would clear all six.
- Could improve: code review was self-review only, with the sub-agent skipped to limit cost.
- Could improve: a stale `node_modules` in a long-lived clone made the first close-time acceptance run show `Cannot find package 'nodemailer'`. Re-running `bun install` after a dependency merge avoids misreading that as a product failure.

## Compliance / Control Evidence

| Control                        | Evidence                                                  | Location                                                                                               | Status              | Exception                                         |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md    | `openspec/changes/swhr2-i-0012-customer-notifications/`, `artifacts/SWHR2-S-0031/SWHR2-T-0313/PLAN.md` | Satisfied           | —                                                 |
| Change verified before release | QA report with per-scenario verdicts                      | `artifacts/SWHR2-S-0031/qa-test-report.md`                                                             | Satisfied           | —                                                 |
| Tests executed                 | platform red/green runs; QA unit, e2e and acceptance runs | `SWHR2-T-0313/tdd-test-result.md`, `integration-test-result.md`                                        | Partially satisfied | 6 locked cases red from a harness re-export fault |
| Browser E2E executed           | `20 passed`                                               | `artifacts/SWHR2-S-0031/integration-test-result.md`                                                    | Satisfied           | —                                                 |
| Code reviewed before merge     | CODE-REVIEW line in ticket summary                        | `artifacts/SWHR2-S-0031/SWHR2-T-0313/summary.md`                                                       | Satisfied (self)    | No sub-agent or human reviewer                    |
| Design conformance             | Not Applicable — no screen                                | —                                                                                                      | Not Applicable      | —                                                 |
| Defects dispositioned          | resolution log, none found                                | `artifacts/SWHR2-S-0031/integration-defects-resolution.md`                                             | Satisfied           | —                                                 |
| Release accepted               | Not Provided                                              | —                                                                                                      | Not Provided        | —                                                 |
