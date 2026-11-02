---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0032
capability_brief: SWHR2-I-0013
branch: vortex/sprint/swhr2-s-0032-f7be8d82
upstream:
  [
    artifacts/SWHR2-S-0032/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0032/qa-test-report.md,
    artifacts/SWHR2-S-0032/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0032/release-notes.md]
---

# Sprint summary — SWHR2-S-0032

Goal: "SWHR2-I-0013: Admin order and sales reporting". Met. `qa-test-report.md` records all 15 scenarios of change `swhr2-i-0013-admin-order-and-sales-repor` as pass. Every sales-reporting locked acceptance test passes, in both the Vitest and the browser suite, and integration QA found no defects. The screen differs from the mockups in documented ways (see Known Issues).

## Tickets

| Ticket       | Type    | Title                                | Outcome                                                                                                                                |
| ------------ | ------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR2-T-0316 | TASK    | Sprint plan — SWHR2-S-0032           | DONE, e911a28. Planning section P1–P5 and spec discrepancies X1–X7 in the change's design.md; mockups exported; `SWHR2-T-0317/PLAN.md` |
| SWHR2-T-0317 | FEATURE | Admin order and sales reporting      | DONE, c4b8d4b (PR #95). `SWHR2-T-0317/summary.md`, `tdd-test-result.md`, `design-check.md`                                             |
| SWHR2-T-0318 | TASK    | Integration QA report — SWHR2-S-0032 | DONE, 3cee41a (PR #97). PASS, no defects                                                                                               |
| SWHR2-T-0319 | TASK    | Sprint close bundle — SWHR2-S-0032   | this file                                                                                                                              |

## What shipped

All of it was built in SWHR2-T-0317 (detail in its `summary.md`):

- `/admin/tool` is now "Orders and sales". It has an Orders view (Pending, then Non-pending) and a Sales view (Pie chart and Bar chart tabs), and opens on Orders. The Administration navigation entry is renamed "Orders and sales" and points to it (`src/pages/admin/tool.tsx`, `src/components/shell/areas.ts`).
- Both order lists show ID, User ID, Date (`3/5/2002`), Amount (`120.50`) and Status. They sort on any column header (`SortHeader`, `aria-sort`), show `-1` for a non-numeric id, and show "No orders in this status" instead of an empty table (`src/components/admin/OrderTable.tsx`, `PendingTable.tsx`, `format.ts`).
- `GET /api/admin/orders?status=` matches status exactly and case-sensitively. An unmatched status returns an empty list, and the reply is a plain array with UTC `M/D/YYYY` dates (`routes/api/admin/orders/index.get.ts`).
- The revenue and order-count reports take an optional `category` and then break down per item. The order-count route is now `/api/admin/sales/order-counts` (`services/orders/sales.ts`, `routes/api/admin/sales/`).

## Divergence from plan

- None in behaviour. The plan's deliberate divergence P2 was built as planned: the compact chart pair stays on the Orders view.
- A new `src/components/admin/SortHeader.tsx` was added, shared by both tables. It was not in the ownership map.
- `ChartPanel` gained a `large` size for the Sales view tabs.

## Verification

Proceed, per `qa-test-report.md`:

- Lint, typecheck and build exit 0.
- 414 unit tests in 86 files pass.
- Project Playwright: 20 passed, 0 failed, 0 skipped.
- Locked acceptance: every sales-reporting case passes (Vitest C-0001/0002/0006–0008/0012–0015; Chromium C-0003/0004/0005/0009/0010/0011). The order-approval tool specs C-0240–C-0243 still pass.
- Coverage was not measured.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- **Charts on the Orders view (design.md X2).** Mockup SWHR2-MCK-34 shows the Orders view without charts. The build keeps a compact chart pair under the lists, because the shipped, locked order-approval cases SWHR2-C-0240/C-0241 require a chart and date fields visible on opening `/admin/tool`. A human decision at UAT is needed: change those two cases, or accept the divergence.
- **Mockup details not built.** The table header and shell content from MCK-34 were not built: breadcrumbs, count chips, the "loaded" time stamp and the language switch. The Sales view tabs (MCK-36/37) have no side summary column, and the empty state (MCK-35) has no illustration. Details are in `SWHR2-T-0317/design-check.md`.
- **Locked acceptance failures in other capabilities**, triaged at UAT:
  - customer-notifications SWHR2-C-0049/0055/0056/0061/0062/0067 (harness re-export fault, recorded in SWHR2-S-0031)
  - data-population C-0070–C-0079
  - localization C-0021/0026/0028/0039
  - customer-account C-0157
  - sign-on C-0264
- **Sales-count meaning (X6).** The count is distinct orders, while legacy counted units sold. No approved scenario fixes it.

## Defects Raised

None. No DEFECT ticket was created between sprint start (2026-11-02T16:30Z) and close.

## Retrospective

- Went well: planning found that order-approval had already shipped most of the screen and API. That turned the change into a focused 27-file modification in one FEATURE dispatch.
- Went well: reading both locked suites before planning surfaced the cross-capability conflict (X2), the route rename (X4) and the response-shape change (X1) up front. The FEATURE passed both suites without a plan revision.
- Went well: the implementer recorded paired mockup and built screenshots (`design-check/`), so QA judged design fidelity from evidence.
- Could improve: two locked suites written for different capabilities disagree about the same screen (charts on open versus only in the Sales view). Test authoring should check a shared route against every suite that opens it.
- Could improve: code review was self-review only.

## Compliance / Control Evidence

| Control                        | Evidence                                                  | Location                                                                                                    | Status              | Exception                                         |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md    | `openspec/changes/swhr2-i-0013-admin-order-and-sales-repor/`, `artifacts/SWHR2-S-0032/SWHR2-T-0317/PLAN.md` | Satisfied           | —                                                 |
| Change verified before release | QA report with per-scenario verdicts                      | `artifacts/SWHR2-S-0032/qa-test-report.md`                                                                  | Satisfied           | —                                                 |
| Tests executed                 | platform red/green runs; QA unit, e2e and acceptance runs | `SWHR2-T-0317/tdd-test-result.md`, `integration-test-result.md`                                             | Satisfied           | —                                                 |
| Browser E2E executed           | `20 passed`; locked browser suite sales-reporting 6/6     | `artifacts/SWHR2-S-0032/integration-test-result.md`, `qa-test-report.md`                                    | Satisfied           | —                                                 |
| Code reviewed before merge     | CODE-REVIEW line in ticket summary                        | `artifacts/SWHR2-S-0032/SWHR2-T-0317/summary.md`                                                            | Satisfied (self)    | No sub-agent or human reviewer                    |
| Design conformance             | paired screenshots, design check, QA DESIGN-VERDICT       | `artifacts/SWHR2-S-0032/SWHR2-T-0317/design-check.md`, `qa-test-report.md`                                  | Partially satisfied | MCK-34 "differs": charts kept (X2), shell details |
| Defects dispositioned          | resolution log, none found                                | `artifacts/SWHR2-S-0032/integration-defects-resolution.md`                                                  | Satisfied           | —                                                 |
| Release accepted               | Not Provided                                              | —                                                                                                           | Not Provided        | —                                                 |
