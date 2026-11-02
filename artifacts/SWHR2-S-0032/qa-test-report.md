---
artifact: qa-test-report
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0032
capability brief: SWHR2-I-0013
branch: vortex/sprint/swhr2-s-0032-f7be8d82
upstream: [artifacts/SWHR2-S-0032/SPRINT-PLAN.md]
downstream:
  [
    artifacts/SWHR2-S-0032/integration-test-result.md,
    artifacts/SWHR2-S-0032/integration-defects-resolution.md,
  ]
---

# QA test report — SWHR2-S-0032

## Executive Summary

**Verdict: PASS.** The integrated sprint branch builds, lints, typechecks, passes all 414 unit tests (86 files) and all 20 Playwright specs. All 15 scenarios of SWHR2-I-0013 pass: the sales-reporting acceptance tests (the locked tests for these scenarios) all pass, and the sprint's own component, route and service tests pass. No defects found. Design differs from the mockups in recorded, previously documented ways (advisory).

## E2E Test Status

`bun run test:e2e -- --project=chromium`: `20 passed (12.4s)`, 0 failed, 0 skipped. Details in `artifacts/SWHR2-S-0032/integration-test-result.md`. No spec in `e2e/` targets `/admin/tool`; the browser run of this screen is the locked acceptance suite below.

Locked acceptance browser suite (`bun run test:acceptance:e2e`): `6 failed, 60 passed (28.8s)`. All six `tests/acceptance/sales-reporting/e2e/tool.spec.ts` tests pass in Chromium (SWHR2-C-0003, 0004, 0005, 0009, 0010, 0011), as do the order-approval tool specs (C-0240 to 0243). WARNINGS (other capabilities, UAT): SWHR2-C-0021, 0026, 0028, 0039 (localization), SWHR2-C-0079 (data-population), SWHR2-C-0157 (customer-account).

Locked acceptance vitest suite (`bun run test:acceptance`): `Test Files 3 failed | 29 passed (32); Tests 16 failed | 205 passed (221)`. All sales-reporting tests pass. WARNINGS only (enforced at UAT, not fixed), all outside this sprint:

- customer-notifications (6): SWHR2-C-0049, 0055, 0056, 0061, 0062, 0067.
- data-population (9): SWHR2-C-0070 to 0078.
- sign-on (1): SWHR2-C-0264.

## Unit Test Results

```
$ bun run test
 Test Files  86 passed (86)
      Tests  414 passed (414)
```

`bun run lint` exit 0, `bun run typecheck` exit 0, `bun run build` exit 0.

## Code Review

No notable concerns observed. The ticket renamed the `order-count` route to `order-counts`; both sales routes pass `category`.

## Coverage Summary

No coverage tool was run (not part of the declared commands). Evidence Required for any coverage figure.

## Design fidelity

Method: compared the mockup and the built screen in the paired screenshots under `artifacts/SWHR2-S-0032/SWHR2-T-0317/design-check/` (viewed MCK-34 pair myself) plus the engineer's `design-check.md`. I did not re-render the preview. Conformance proposal tool is disabled for this project.

DESIGN-VERDICT: SWHR2-MCK-34 differs — table, five columns, tabs and Orders/Sales switch built; mockup shell content and layout details not built

- RESIDUAL: SWHR2-MCK-34 chart placement — mockup: table only on the Orders view; built: compact chart pair kept under the table (design P2/X2, locked C-0240/C-0241)
- RESIDUAL: SWHR2-MCK-34 header and shell — mockup: breadcrumbs, count chips, loaded stamp, language switch; built: none of these
- RESIDUAL: SWHR2-MCK-34 sort indicators — mockup: arrows on every column; built: arrow on the active column only

DESIGN-VERDICT: SWHR2-MCK-35 differs — empty state present, without illustration

- RESIDUAL: SWHR2-MCK-35 empty state — mockup: styled empty panel; built: "No orders in this status" in a bordered box

DESIGN-VERDICT: SWHR2-MCK-36 differs — pie chart tab built without the side summary column

- RESIDUAL: SWHR2-MCK-36 side summary — mockup: summary column beside the chart; built: single chart panel, Start/End and Submit

DESIGN-VERDICT: SWHR2-MCK-37 differs — bar chart tab built without the side summary column

- RESIDUAL: SWHR2-MCK-37 side summary — mockup: summary column beside the chart; built: single chart panel

## Regression guards

- SWHR2-T-0317: SWHR2-C-0002 — working: its locked acceptance test (sales-reporting/reports.test.ts) passes in this run.
- SWHR2-T-0317: SWHR2-C-0004 — working: its locked acceptance test (sales-reporting/reports.test.ts) passes in this run.

## Issues Found

None. See `integration-defects-resolution.md`.

SCENARIO-VERDICT: Orders by current status / Orders at the requested status are listed once each — pass
SCENARIO-VERDICT: Orders by current status / Status match is exact — pass
SCENARIO-VERDICT: Order list details by status / Details of each order in the status — pass
SCENARIO-VERDICT: Order list details by status / No orders in the status — pass
SCENARIO-VERDICT: Default chart date range / Charts open on the default range — pass
SCENARIO-VERDICT: Per-item breakdown within a category / Category named in the request — pass
SCENARIO-VERDICT: Per-item breakdown within a category / No category named — pass
SCENARIO-VERDICT: Report data load on start and refresh / Initial load — pass
SCENARIO-VERDICT: Report data load on start and refresh / Refresh reloads everything — pass
SCENARIO-VERDICT: Report data load on start and refresh / Switching to the Sales view — pass
SCENARIO-VERDICT: Non-pending orders screen / Only non-pending orders are listed — pass
SCENARIO-VERDICT: Non-pending orders screen / Refresh loads newly decided orders — pass
SCENARIO-VERDICT: Order list columns and sorting / Order rows show five columns — pass
SCENARIO-VERDICT: Order list columns and sorting / Sorting by a column — pass
SCENARIO-VERDICT: Order list columns and sorting / Non-numeric order ID — pass

## Recommendation

Proceed: fire `validation.all_acs_passed`.
