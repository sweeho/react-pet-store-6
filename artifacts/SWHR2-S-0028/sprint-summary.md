---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0028
capability_brief: SWHR2-I-0010
branch: vortex/sprint/swhr2-s-0028-1d7ea54c
upstream:
  [
    artifacts/SWHR2-S-0028/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0028/qa-test-report.md,
    artifacts/SWHR2-S-0028/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0028/release-notes.md]
---

# Sprint summary — SWHR2-S-0028

Goal: "SWHR2-I-0010: Supplier inventory". Met. All 5 scenarios of change `swhr2-i-0010-supplier-inventory` pass in `qa-test-report.md`, and the two sign-on cases deferred to this brief (C-0255, C-0256) now pass. Integration QA found no defects in the project's own tests. One of this change's locked acceptance cases, C-0042, fails in its setup step (see Known Issues).

## Tickets

| Ticket       | Type    | Title                      | Outcome                                                                                                |
| ------------ | ------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| SWHR2-T-0298 | TASK    | Sprint plan — SWHR2-S-0028 | DONE, 8825e4c / 1286e88. design.md planning (F1–F7, SD1–SD7, P1–P6), PLAN.md, mockups, ARCHITECTURE.md |
| SWHR2-T-0299 | FEATURE | Supplier inventory         | DONE, eb2370e. `SWHR2-T-0299/summary.md`, `design-check.md`                                            |
| SWHR2-T-0300 | TASK    | Integration QA report      | DONE, 2e6a14e. Proceed, no defects                                                                     |
| SWHR2-T-0301 | TASK    | Sprint close bundle        | this file                                                                                              |
| SWHR2-T-0302 | DEFECT  | Locked C-0042 setup fails  | Raised at close, BACKLOG                                                                               |

## What shipped

- `sup_inventory (item_id PK, quantity integer NOT NULL)` in `db/schema.ts`, migration `0007`. Demo stock of 10000 per demo catalog item is seeded by `db/client.ts` outside Vitest; data-population will replace it.
- `services/supplier/inventory.ts`:
  - `listInventory` lists in natural item order.
  - `updateInventory` upserts the changes and enqueues one `supplier.inventory-changed` message in the same transaction.
  - `reduceStock` is the draw-down primitive for order fulfilment.
- `GET` / `POST /api/supplier/inventory` behind `requireSupplier`. Unmarked and blank rows are ignored. A negative, fractional or non-numeric marked quantity gives 400 `InvalidQuantity` and saves nothing.
- The supplier home (`/supplier`, signed in) shows Display Inventory and Logout. `/supplier/inventory` shows Item, Quantity on hand, New quantity and Update per row, with one Submit and an in-page confirmation.

## Divergence from plan

- None beyond the planned spec discrepancies (design.md SD1–SD7): the supplier, not an administrator, uses the screen; invalid quantities are rejected rather than ignored; unknown items are upserted; draw-down, re-fulfilment and invoices are left to order fulfilment; the confirmation is in-page.

## Verification

Proceed. `bun run lint`, `bun run build` exit 0; `bun run test` 321 passed in 74 files; project Playwright 20 passed, 0 failed, 0 skipped. Locked acceptance suite: 85 unit and 12 e2e failures, down from 88 and 15 at the end of SWHR2-S-0027. All are in capabilities not built yet except C-0042. Coverage was not measured.

## Defects Raised

- SWHR2-T-0302: locked acceptance e2e C-0042 fails at its setup POST (`inventory.spec.ts:19`); raised at close.

## Known Issues

The sprint was not conditionally approved. Open from it:

- SWHR2-T-0302: locked case C-0042 (mixed marked and unmarked rows) fails in setup when the helper POSTs stock right after clicking Sign in. C-0041, which uses the same helper, passes, and so do the project's e2e and unit tests for the scenario. Suspected cause, not reproduced: the POST races the sign-in response.

Residuals recorded so they are not lost:

- SWHR2-MCK-32: the existing shell instead of the mockup's chrome; "Signed in" is plain bordered text, not a pill.
- SWHR2-MCK-33: native controls and design-system tokens instead of the drawn pills, plus the in-page confirmation (SD6). The demo database shows 7 items, not the mockup's 29.
- The FEATURE's design check produced no side-by-side screenshots (`SWHR2-T-0299/summary.md`).
- `supplier.inventory-changed` messages stay `pending` until order fulfilment (change `swhr2-i-0011-order-fulfilment-and-invoic`) registers its consumer.
- Locked acceptance failures in later capabilities, listed in `qa-test-report.md` § E2E Test Status.

## Retrospective

- Went well: one FEATURE delivered the whole change and the two deferred sign-on cases in one dispatch.
- Went well: planning read the locked suites of four capabilities first. The route files, table shape, natural row order and demo-stock need were fixed before code was written, and order fulfilment's contract (`reduceStock`, the channel) was settled ahead of that sprint.
- Could improve: a locked case of this sprint's own change (C-0042) failed and was reported as a warning only, without its cause. QA should at least capture the failing response status for a case linked to the sprint's FEATURE.
- Could improve: the FEATURE's self-review and design check were thin (no sub-agent review, no paired screenshots).
- Could improve: planning's prettier run reformatted the exported mockups. They had to be re-fetched, so mockups should be excluded from formatting.

## Compliance / Control Evidence

| Control                        | Evidence                                               | Location                                                                                           | Status              | Exception                                 |
| ------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md | `openspec/changes/swhr2-i-0010-supplier-inventory/`, `artifacts/SWHR2-S-0028/SWHR2-T-0299/PLAN.md` | Satisfied           | —                                         |
| Change verified before release | QA report with per-scenario verdicts                   | `artifacts/SWHR2-S-0028/qa-test-report.md`                                                         | Satisfied           | —                                         |
| Tests executed                 | TDD result; QA unit, e2e and acceptance runs           | `SWHR2-T-0299/tdd-test-result.md`, `integration-test-result.md`                                    | Partially satisfied | Locked C-0042 red (SWHR2-T-0302)          |
| Browser E2E executed           | `20 passed`                                            | `artifacts/SWHR2-S-0028/integration-test-result.md`                                                | Satisfied           | —                                         |
| Code reviewed before merge     | CODE-REVIEW line in ticket summary                     | `artifacts/SWHR2-S-0028/SWHR2-T-0299/summary.md`                                                   | Satisfied (self)    | No sub-agent or human reviewer            |
| Design conformance             | FEATURE design check, MCK-32/33                        | `SWHR2-T-0299/design-check.md`                                                                     | Partially satisfied | Residuals listed above; no paired renders |
| Defects dispositioned          | resolution log; DEFECT raised at close                 | `integration-defects-resolution.md`, SWHR2-T-0302                                                  | Satisfied           | —                                         |
| Release accepted               | `Not Provided`                                         | —                                                                                                  | Not Provided        | —                                         |
