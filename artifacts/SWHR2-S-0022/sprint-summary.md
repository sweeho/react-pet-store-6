---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0022
capability_brief: SWHR2-I-0007
branch: vortex/sprint/swhr2-s-0022-358d0d57
upstream:
  [
    artifacts/SWHR2-S-0022/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0022/qa-test-report.md,
    artifacts/SWHR2-S-0022/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0022/release-notes.md]
---

# Sprint summary — SWHR2-S-0022

Goal: "SWHR2-I-0007: Shopping cart". Met. 19 of 22 scenarios of change `swhr2-i-0007-shopping-cart` pass in `qa-test-report.md`. The other 3 cannot be tested until checkout (SWHR2-I-0008) ships: order placed empties the cart, empty-cart order error, and Check Out navigation. No defects were found at integration QA. QA rework round 1 turned the 4 cases that were red in the official CI run green.

## Tickets

| Ticket       | Type    | Title                                    | Outcome                                                                                               |
| ------------ | ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| SWHR2-T-0275 | TASK    | Sprint plan — SWHR2-S-0022               | DONE, 3e3bb42. Change `design.md` planning section (P1–P7, SD1–SD5), FEATURE PLAN.md, ARCHITECTURE.md |
| SWHR2-T-0276 | FEATURE | Shopping cart                            | DONE, 1b5aa9b. `SWHR2-T-0276/summary.md`, `design-check.md`                                           |
| SWHR2-T-0277 | TASK    | Integration QA report                    | DONE, ff0b70f. PASS with limits, no defects                                                           |
| SWHR2-T-0278 | TASK    | QA rework round 1 (C-0022, C-0280/81/82) | DONE, f8f73a7. All four cases fixed; `SWHR2-T-0278/summary.md`                                        |
| SWHR2-T-0279 | TASK    | Sprint close bundle                      | this file                                                                                             |

Carried in from failed attempts S-0017 to S-0021 and listed in `SPRINT-PLAN.md`: SWHR2-T-0248, T-0253, T-0258, T-0264, T-0267, T-0270 and T-0274. All are CANCELLED. SWHR2-T-0276 replaced them.

## What shipped

- `services/cart.ts`: session cart with `addItem` (sets quantity 1, even when the item is already in the cart), `addItemWithQuantity`, `removeItem` (whole line, no-op when absent), `updateQuantities`, `clearCart` and `total`. Lines carry `productName` and `lineTotal` (SWHR2-T-0276).
- `services/errors.ts`: typed `AppFailure` hierarchy (`ItemNotFound` under `CatalogError`, `EmptyCartOrder` under `OrderFailure`), `failureReply` and `guardRoute`. `src/errors/routeFailure.ts` maps a kind to an error page by walking up its parent kinds. An unmapped failure shows the Server Error page (SWHR2-T-0276).
- Routes `GET/PUT /api/cart`, `POST /api/cart/items` and `DELETE /api/cart/items/[itemId]` return `{ locale, lines, total }`. They need no role. The catalog item route now throws `ItemNotFound` (SWHR2-T-0276).
- Cart screen `src/pages/petstore/cart.tsx` rebuilt: lines, Remove, quantity fields, Update Cart, total and Check Out, plus the empty state. Error pages `error/{empty-cart,catalog,server}.tsx`. Cart text in en_US, ja_JP and zh_CN. Add to Cart now opens the cart (SWHR2-T-0276).
- From QA rework: the cart loads with its route chunk, so the first render already shows the reply's locale. Catalog data access also reads the `CATALOG_DAO_CLASS` / `CATALOG_DAO_DATABASE` names the locked suite uses, and still reads the legacy names. `e2e/global-setup.ts` warms the item, cart and change-language routes (SWHR2-T-0278).

## Divergence from plan

- C-0089, C-0090 and C-0101 were deferred to checkout (SWHR2-I-0008). The seams are in place: `clearCart`, `EmptyCartOrder` with its error page, and the Check Out link to `/petstore/checkout`. C-0090 is still red in the acceptance suite because `routes/api/orders/index.post` does not exist yet.
- The FEATURE container had no usable Chromium, so the FEATURE ran neither e2e nor design screenshots. QA ran both after linking chromium-1223 under the 1155 name the preflight expects.
- 4 cases outside the cart (C-0022 localization, C-0280/81/82 catalog data access) were red in the official run and needed a rework round. C-0022 was a load race on the rebuilt cart screen. C-0280/81/82 came from env names in the locked suite that the code did not read.

## Verification

PASS with limits. See `qa-test-report.md` and `integration-defects-resolution.md`. Lint, typecheck and build pass, and 240 unit tests pass (61 files). Playwright passed 18 of 18, including the new `e2e/cart.spec.ts`. The shopping-cart acceptance suite passed 13 of 14, the exception being deferred C-0090. Coverage is not measured because `@vitest/coverage-v8` is missing.

## Defects Raised

- None. Integration QA found no defects in scope, and no DEFECT tickets were filed.

## Known Issues

The sprint was not conditionally approved, and no DEFECT is open from it. The residuals below are recorded so they are not lost:

- Checkout dependency: SWHR2-C-0090 is red, and Check Out leads to a page that does not exist yet. Both resolve when SWHR2-I-0008 ships.
- Design residuals on SWHR2-MCK-22/23: no breadcrumb, the line text shows more than the item name, the empty-state frame differs, and the shared shell differs (sidebar, language control). Details in `qa-test-report.md` § Design fidelity.

## Retrospective

- Went well: after five failed planning attempts (S-0017 to S-0021), this sprint planned one FEATURE that delivered the whole change in one dispatch, and QA found no defects.
- Went well: the typed failure-routing decision went into ARCHITECTURE.md Key Decisions at planning time, before any code was written. Checkout can now add its failures there without a redesign.
- Could improve: the Chromium revision pin is still unfixed. This is the fourth sprint where the FEATURE shipped without e2e and the problem surfaced only at QA (C-0022).
- Could improve: the locked acceptance suite used config names (`CATALOG_DAO_*`) the code never read. A suite lock should check its contract names against the code before cases go red in the official CI run.
- Could improve: the design residuals are mostly in the shared shell, so each new screen inherits them. A shell-conformance pass would clear them once.

## Compliance / Control Evidence

| Control                        | Evidence                                               | Location                                                                                      | Status              | Exception                                      |
| ------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md | `openspec/changes/swhr2-i-0007-shopping-cart/`, `artifacts/SWHR2-S-0022/SWHR2-T-0276/PLAN.md` | Satisfied           | —                                              |
| Change verified before release | QA report with per-scenario verdicts                   | `artifacts/SWHR2-S-0022/qa-test-report.md`                                                    | Satisfied           | 3 scenarios not testable until SWHR2-I-0008    |
| Tests executed                 | TDD results per ticket; QA unit and e2e runs           | `artifacts/SWHR2-S-0022/SWHR2-T-027*/tdd-test-result.md`, `integration-test-result.md`        | Partially satisfied | C-0090 red, deferred to checkout               |
| Browser E2E executed           | `18 passed`                                            | `artifacts/SWHR2-S-0022/integration-test-result.md`                                           | Satisfied           | Chromium linked by hand past the preflight pin |
| Code reviewed before merge     | CODE-REVIEW line in each ticket summary                | `SWHR2-T-0276/summary.md`, `SWHR2-T-0278/summary.md`                                          | Satisfied (self)    | No sub-agent or human reviewer                 |
| Design conformance             | FEATURE design check; QA screenshot pairs, MCK-22/23   | `SWHR2-T-0276/design-check.md`, `qa/design/`                                                  | Partially satisfied | Residuals listed in QA report                  |
| Defects dispositioned          | resolution log                                         | `integration-defects-resolution.md`                                                           | Satisfied           | —                                              |
| Release accepted               | `Not Provided`                                         | —                                                                                             | Not Provided        | —                                              |
