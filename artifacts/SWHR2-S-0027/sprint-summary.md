---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0027
capability_brief: SWHR2-I-0009
branch: vortex/sprint/swhr2-s-0027-dd099d53
upstream:
  [
    artifacts/SWHR2-S-0027/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0027/qa-test-report.md,
    artifacts/SWHR2-S-0027/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0027/release-notes.md]
---

# Sprint summary — SWHR2-S-0027

Goal: "SWHR2-I-0009: Order approval". Met. All 23 scenarios of change `swhr2-i-0009-order-approval` pass in `qa-test-report.md`, and all 8 locked order-approval acceptance e2e cases (C-0240..C-0249) pass. Integration QA found no defects.

## Tickets

| Ticket       | Type    | Title                      | Outcome                                                                              |
| ------------ | ------- | -------------------------- | ------------------------------------------------------------------------------------ |
| SWHR2-T-0294 | TASK    | Sprint plan — SWHR2-S-0027 | DONE, f9190e2. Change proposal/design/specs/tasks, FEATURE PLAN.md, mockups exported |
| SWHR2-T-0295 | FEATURE | Order approval             | DONE, bf8a786. `SWHR2-T-0295/summary.md`, `design-check.md`, `tdd-test-result.md`    |
| SWHR2-T-0296 | TASK    | Integration QA report      | DONE, d8798fe. Proceed, no defects                                                   |
| SWHR2-T-0297 | TASK    | Sprint close bundle        | this file                                                                            |

## What shipped

- Every received order is stored and starts PENDING, then `services/orders/approval.ts#autoApproves` applies the thresholds in the same transaction: en_US under 500.00 and ja_JP under 50000 approve; exactly at the threshold, and every other locale (zh_CN included), stay PENDING.
- `services/orders/decide.ts`: the `OrderApproval` XML batch (free-text status, so an unlisted value such as COMPLETED is carried without a format error), `applyDecision` and `decideBatch`, registered on the `order.approval` outbox channel.
- Outbox module moved from `services/messages` to `services/messaging` (`enqueue`, `processDue`, `startWorker`). Statuses are now `pending | delivered | failed` with an `available_at` due time; a failing handler retries after 30 s, so a decision stays on the channel until consumed. Migration `drizzle/0006_cool_mojo.sql` rebuilds the `messages` table and copies `done` rows as `delivered`. The table keeps its name.
- Routes `GET /api/admin/orders`, `POST /api/admin/orders/decisions` (202, one message per commit), `GET /api/admin/sales/revenue` and `GET /api/admin/sales/order-count`, all behind `requireAdmin`.
- `/admin/tool` page with Pending and Non-pending tabs, sortable tables, colour-coded status badges, Approve/Deny marking, batch Commit, Refresh with the "Data is not committed…" warning, busy state with "Retrieving data from the server..." / "Updating data on the server...", About and Exit, and revenue and order-count charts (new dependency `recharts`).

## Divergence from plan

- One Start/End date range drives both charts (locked case C-0241).
- Refresh requests all lists at once; actions re-enable when the pending-list reply is applied (locked case C-0237).
- Colocated tests use `services/orders/approvalHarness.ts`, a copy of the acceptance harness, because `tsc` cannot include `tests/acceptance`.

## Verification

Proceed. `bun run build` exit 0; `bun run verify` exit 0 with 303 unit tests in 71 files; project Playwright 19 passed, 0 failed, 0 skipped. Locked acceptance suite outside order approval: 15 e2e and 88 unit failures, warnings only until release UAT (down from 25 e2e and 97 unit at the end of SWHR2-S-0026). Coverage was not measured.

## Defects Raised

- None. Integration QA found no defects, and no DEFECT tickets were filed.

## Known Issues

The sprint was not conditionally approved, and no DEFECT is open from it. Residuals recorded so they are not lost:

- SWHR2-MCK-28: no per-row status dropdown; decisions are made with tick boxes plus Approve/Deny, as the locked tests drive them.
- SWHR2-MCK-29: the refresh warning is the native browser confirm, not the drawn in-page dialog.
- SWHR2-MCK-30: the busy message is plain text under the header, not the in-bar indicator.
- SWHR2-MCK-31: Non-pending header reads "ID", and rows are ordered by status rather than the mockup's sample order.
- Amounts show two decimals for every locale; the mockups show ja_JP without decimals. Locale formatting is unspecified.
- The shared shell still differs from every mockup, as in earlier sprints.
- Locked acceptance failures in other capabilities, listed in `qa-test-report.md` § E2E Test Status. QA suggested the data-population failure comes from T-0295 renaming the `messages` table; it did not (the migration keeps the table name, only the module path moved), so that cause is still unexplained.

## Retrospective

- Went well: one FEATURE delivered the whole change in one dispatch, and QA found no defects.
- Went well: the outbox chosen in SWHR2-S-0026 took the `order.approval` channel without redesign; ARCHITECTURE.md was updated at planning, so nothing was left for close.
- Went well: the FEATURE recorded its conflicts with the locked suite (C-0237, C-0241, status dropdown) in its summary rather than silently.
- Could improve: four of four mockups differ from the build, two of them because the mockup draws a control the locked tests do not drive. Mockup approval should be checked against the locked cases for the same screen.
- Could improve: QA attributed an out-of-scope failure to a table rename without checking the migration. A suggested cause should be verified or labelled as unverified.

## Compliance / Control Evidence

| Control                        | Evidence                                               | Location                                                                                       | Status              | Exception                                        |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------ |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md | `openspec/changes/swhr2-i-0009-order-approval/`, `artifacts/SWHR2-S-0027/SWHR2-T-0295/PLAN.md` | Satisfied           | —                                                |
| Change verified before release | QA report with per-scenario verdicts                   | `artifacts/SWHR2-S-0027/qa-test-report.md`                                                     | Satisfied           | —                                                |
| Tests executed                 | TDD result; QA unit, e2e and acceptance runs           | `SWHR2-T-0295/tdd-test-result.md`, `integration-test-result.md`                                | Satisfied           | Other-capability acceptance cases red (warnings) |
| Browser E2E executed           | `19 passed`                                            | `artifacts/SWHR2-S-0027/integration-test-result.md`                                            | Satisfied           | —                                                |
| Code reviewed before merge     | CODE-REVIEW line in ticket summary                     | `artifacts/SWHR2-S-0027/SWHR2-T-0295/summary.md`                                               | Satisfied (self)    | No sub-agent or human reviewer                   |
| Design conformance             | FEATURE design check, MCK-28..31                       | `SWHR2-T-0295/design-check.md`, `SWHR2-T-0295/design-check/`                                   | Partially satisfied | Residuals listed above                           |
| Defects dispositioned          | resolution log                                         | `integration-defects-resolution.md`                                                            | Satisfied           | —                                                |
| Release accepted               | `Not Provided`                                         | —                                                                                              | Not Provided        | —                                                |
