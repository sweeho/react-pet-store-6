---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0035
capability_brief: none
branch: vortex/sprint/swhr2-s-0035-c80de065
upstream:
  [
    artifacts/SWHR2-S-0035/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0035/qa-test-report.md,
    artifacts/SWHR2-S-0035/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0035/release-notes.md]
---

# Sprint summary — SWHR2-S-0035

Goal: "Bugfix — SWHR2-T-0328: Flaky e2e: order-approval C-0243 fails then passes on rerun". Met. The spec no longer races the order worker: QA ran three consecutive full e2e runs at 20 passed, 0 failed, with [SWHR2-C-0243] green in each. All three scenarios of the modified order-approval requirement "Pending and non-pending order views" (SWHR2-R-0087) pass. No application behaviour changed.

## Tickets

| Ticket       | Type   | Title                                                       | Outcome                                                                                                                        |
| ------------ | ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SWHR2-T-0330 | TASK   | Bugfix plan — SWHR2-S-0035                                  | DONE, 62da66b. Change `swhr2-s-0035-bugfix-swhr2-t-0328-flaky-e` (RCA, D1–D4, order-approval delta) and `SWHR2-T-0328/PLAN.md` |
| SWHR2-T-0328 | DEFECT | Flaky e2e: order-approval C-0243 fails then passes on rerun | DONE, 57fc6c9 (PR #104). `SWHR2-T-0328/fix-note.md`, `tdd-test-result.md`                                                      |
| SWHR2-T-0331 | TASK   | Integration QA report — SWHR2-S-0035                        | DONE, ed0fc42 (PR #106). Pass, no defects                                                                                      |
| SWHR2-T-0332 | TASK   | Sprint close bundle — SWHR2-S-0035                          | this file                                                                                                                      |

## What shipped

All of it was built in SWHR2-T-0328 (detail in its `fix-note.md`):

- `e2e/order-approval.spec.ts` no longer waits for the transient APPROVED status after commit, which the in-process worker overwrites with COMPLETED within a few polls.
  - It refreshes the non-pending tab until the order's row reads APPROVED or COMPLETED.
  - It asserts the row is neither PENDING nor DENIED, which proves the approval decision was recorded.
  - It asserts the order is gone from the pending tab.
  - The test is retitled and tagged C-0243, C-0288 and C-0289.
- Two regression tests in `src/pages/admin/tool.test.tsx` cover the new scenario "Approved order fulfilled before the refresh" (C-0288, C-0289). An order stored as COMPLETED shows in the non-pending view and not in the pending view after Refresh.
- No application file changed.

## Divergence from plan

- The plan's ownership map named only `e2e/order-approval.spec.ts`. The fix also added two tests to `src/pages/admin/tool.test.tsx`, because the platform's red/green evidence run is Vitest only and the approved cases C-0288/C-0289 needed a citing test it executes. These are test additions, with no product change.

## Verification

Pass, per `qa-test-report.md` and `integration-test-result.md`:

- Build and unit suite green.
- `bun run test:e2e`: 20 passed in three consecutive runs (13.4 s, 12.1 s, 12.1 s), 0 failed, 0 skipped.
- The implementer also ran the spec alone with `--repeat-each=3` (3 passed) and two full runs (20 passed each).
- The order-approval locked acceptance cases C-0240 to C-0249 all pass.
- Coverage was not measured.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- **C-0289 runs without the live worker.** It was drafted as a live-worker browser check but is asserted in Vitest with a stored COMPLETED status. The live path is exercised by the fixed project e2e spec C-0243, which accepts APPROVED or COMPLETED rather than requiring COMPLETED.
- **Pre-existing locked browser failures** in other capabilities, unchanged and triaged at UAT:
  - catalog-browsing C-0197/C-0198 (assume 3 dog products; the approved seed has 6)
  - data-population C-0079 (ambiguous password locator)
  - customer-account C-0157
  - localization C-0021/0026/0028/0039
- **Pre-existing locked Vitest failures:** customer-notifications C-0049/0055/0056/0061/0062/0067 (harness fault) and sign-on C-0264, per earlier sprints. This sprint's QA report lists only browser failures.

## Defects Raised

None. No DEFECT ticket was created between sprint start (2026-11-03T01:00Z) and close.

## Retrospective

- Went well: triage's root-cause hypothesis was accurate. Planning verified it in the worker chain and ruled out the suspected sibling weakness (both locked tool specs stub the API), so the fix stayed a one-spec change.
- Went well: the fix asserts the outcome that holds at any timing and still proves the decision was recorded, rather than slowing the pipeline or adding retries.
- Could improve: for the second sprint running, cases drafted at e2e level (C-0289 here, C-0284/C-0287 in SWHR2-S-0034) were satisfied by Vitest tests, because the evidence runner executes Vitest only. Drafting should target the level the runner can prove, or the runner should include the Playwright tier.
- Could improve: a single-spec flake took a full sprint cycle (plan, test-case drafting and approval, fix, QA, close).

## Compliance / Control Evidence

| Control                        | Evidence                                               | Location                                                                                                    | Status           | Exception                      |
| ------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------ |
| Work planned before execution  | change proposal, design, specs, tasks; DEFECT PLAN.md  | `openspec/changes/swhr2-s-0035-bugfix-swhr2-t-0328-flaky-e/`, `artifacts/SWHR2-S-0035/SWHR2-T-0328/PLAN.md` | Satisfied        | —                              |
| Change verified before release | QA report with per-scenario verdicts                   | `artifacts/SWHR2-S-0035/qa-test-report.md`                                                                  | Satisfied        | —                              |
| Tests executed                 | platform red/green runs; QA unit and repeated e2e runs | `SWHR2-T-0328/tdd-test-result.md`, `integration-test-result.md`                                             | Satisfied        | —                              |
| Browser E2E executed           | `20 passed` ×3                                         | `artifacts/SWHR2-S-0035/integration-test-result.md`                                                         | Satisfied        | —                              |
| Code reviewed before merge     | CODE-REVIEW line in fix note                           | `artifacts/SWHR2-S-0035/SWHR2-T-0328/fix-note.md`                                                           | Satisfied (self) | No sub-agent or human reviewer |
| Design conformance             | Not Applicable — test-only fix, no screen change       | —                                                                                                           | Not Applicable   | —                              |
| Defects dispositioned          | resolution log, none found                             | `artifacts/SWHR2-S-0035/integration-defects-resolution.md`                                                  | Satisfied        | —                              |
| Release accepted               | Not Provided                                           | —                                                                                                           | Not Provided     | —                              |
