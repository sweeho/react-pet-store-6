---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0036
capability_brief: SWHR2-I-0017
branch: vortex/sprint/swhr2-s-0036-f2c6d2bd
upstream:
  [
    artifacts/SWHR2-S-0036/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0036/qa-test-report.md,
    artifacts/SWHR2-S-0036/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0036/release-notes.md]
---

# Sprint summary — SWHR2-S-0036

Goal: "Catalog Choose A Pet Layout Misalligned" (bugfix). Met. On the storefront home page the "Choose a pet" picture now spans its panel, each pet's cell lines up with its name cell, and selecting a pet opens its category at any width. `qa-test-report.md` records all five scenarios of the modified catalog-browsing requirement "Home screen pet selection" (SWHR2-R-0041) as pass. No defects were found.

## Tickets

| Ticket       | Type   | Title                                   | Outcome                                                                                                                          |
| ------------ | ------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| SWHR2-T-0334 | TASK   | Bugfix plan — SWHR2-S-0036              | DONE, 227c9f6. Change `swhr2-i-0017-catalog-choose-a-pet-layout` (RCA, D1–D4, catalog-browsing delta) and `SWHR2-T-0333/PLAN.md` |
| SWHR2-T-0333 | DEFECT | Catalog Choose A Pet Layout Misalligned | DONE, df85adf (PR #107). `SWHR2-T-0333/fix-note.md`, `tdd-test-result.md`                                                        |
| SWHR2-T-0335 | TASK   | Integration QA report — SWHR2-S-0036    | DONE, 14e90c7 (PR #108). Pass, no defects                                                                                        |
| SWHR2-T-0336 | TASK   | Sprint close bundle — SWHR2-S-0036      | this file                                                                                                                        |

## What shipped

All of it was built in SWHR2-T-0333 (detail in its `fix-note.md`):

- `src/components/storefront/PetMap.tsx` renders the picture `block h-auto w-full`, so the 1000 × 300 artwork keeps its proportions and spans the panel at any width, with no letterbox gutters above 1000 px.
- The `<map>`/`<area>` image map, whose fixed 0–1000 px coordinates never rescaled, is replaced by five absolutely positioned overlay links. Each covers its fifth of the picture and is named after its pet, so a click opens the right category at any width.
- The names row, the "Pet selection map" alt text and `public/images/splash.svg` are unchanged.
- A new `e2e/pet-map.spec.ts` checks, at 700 px and 1800 px viewports, that the picture has no gutter, that each region's edges are within 2 px of its name cell, and that clicking each pet's cell centre opens its category. `PetMap.test.tsx` no longer asserts the image map.
- Side effect: the picture's height now follows its width, so content below it moves on wide and narrow screens.

## Divergence from plan

- None in behaviour, and the fix touched exactly the three files in the plan's ownership map.
- The plan asked for panel widths of about 600 px and 1400 px. The e2e spec uses 700 px and 1800 px viewports, and QA recorded the difference in its verdicts.

## Verification

Pass, per `qa-test-report.md` and the implementer's green run:

- Lint and typecheck exit 0.
- 434 unit tests in 90 files pass.
- `bun run test:e2e`: 24 passed, including the 4 new pet-map tests.
- The red run failed on the old `usemap="#petmap"`, as expected.
- Locked acceptance: 7 failures, all pre-existing and unrelated (customer-notifications ×6, sign-on C-0264).
- Coverage was not measured.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- **Case traceability in the e2e spec.** Approved cases SWHR2-C-0290, C-0291 and C-0292 were linked to SWHR2-T-0333 after it merged, so the titles in `e2e/pet-map.spec.ts` don't cite them. The behaviour is covered and QA passed each scenario, but a case-key search finds no citing test.
- **Test widths versus scenario widths.** The scenarios name panel widths of about 600 px and 1400 px; the spec sets viewports of 700 px and 1800 px. The resulting panel widths were not recorded.
- **No-gutter tolerance.** The spec allows 3 px between picture and panel width, against the scenario's 2 px.
- **Pre-existing locked acceptance failures**, unchanged and triaged at UAT: customer-notifications C-0049/0055/0056/0061/0062/0067 (harness fault) and sign-on C-0264.

## Defects Raised

None. No DEFECT ticket was created between sprint start (2026-11-03T02:58Z) and close.

## Retrospective

- Went well: the brief's root cause was right and well evidenced. Planning added one finding: the click regions mis-targeted at every width, not only wide ones. The fix was a small component change with a browser test that measures the actual layout.
- Went well: replacing the image map removes a whole class of fixed-coordinate bugs rather than recalculating coordinates.
- Could improve: the DEFECT had no sprint when planning ran, as in SWHR2-S-0034. Control attached it by hand this time.
- Could improve: test cases were drafted, approved and linked only after the fix had merged. The implementer therefore had no case keys to cite, which caused the traceability gap above. Case approval needs to finish before execution starts.
- Could improve: code review was self-review only.

## Compliance / Control Evidence

| Control                        | Evidence                                              | Location                                                                                                    | Status              | Exception                                                  |
| ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; DEFECT PLAN.md | `openspec/changes/swhr2-i-0017-catalog-choose-a-pet-layout/`, `artifacts/SWHR2-S-0036/SWHR2-T-0333/PLAN.md` | Satisfied           | —                                                          |
| Change verified before release | QA report with per-scenario verdicts                  | `artifacts/SWHR2-S-0036/qa-test-report.md`                                                                  | Satisfied           | —                                                          |
| Tests executed                 | red/green runs; QA unit and e2e runs                  | `SWHR2-T-0333/tdd-test-result.md`, `integration-test-result.md`                                             | Partially satisfied | Cases C-0290–C-0292 linked after merge; not cited by title |
| Browser E2E executed           | `24 passed`                                           | `artifacts/SWHR2-S-0036/integration-test-result.md`                                                         | Satisfied           | —                                                          |
| Code reviewed before merge     | CODE-REVIEW line in fix note                          | `artifacts/SWHR2-S-0036/SWHR2-T-0333/fix-note.md`                                                           | Satisfied (self)    | No sub-agent or human reviewer                             |
| Design conformance             | Not Applicable — no approved mockup (wireframe only)  | —                                                                                                           | Not Applicable      | —                                                          |
| Defects dispositioned          | resolution log, none found                            | `artifacts/SWHR2-S-0036/integration-defects-resolution.md`                                                  | Satisfied           | —                                                          |
| Release accepted               | Not Provided                                          | —                                                                                                           | Not Provided        | —                                                          |
