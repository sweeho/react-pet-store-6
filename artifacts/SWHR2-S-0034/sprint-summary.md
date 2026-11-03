---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0034
capability_brief: SWHR2-I-0015
branch: vortex/sprint/swhr2-s-0034-75d0ae42
upstream:
  [
    artifacts/SWHR2-S-0034/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0034/qa-test-report.md,
    artifacts/SWHR2-S-0034/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0034/release-notes.md]
---

# Sprint summary — SWHR2-S-0034

Goal: "Place order duplicating shopping cart" (bugfix). Met. The duplicate "Place order" entry is gone from the global navigation, and `qa-test-report.md` records all four scenarios of the modified site-shell requirement "Global navigation" (SWHR2-R-0289) as pass. QA found one unrelated flaky e2e spec and filed it as DEFECT SWHR2-T-0328 for a later sprint.

## Tickets

| Ticket       | Type   | Title                                 | Outcome                                                                                                                    |
| ------------ | ------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| SWHR2-T-0325 | TASK   | Bugfix plan — SWHR2-S-0034            | DONE, e7a8c2d. Change `swhr2-i-0015-place-order-duplicating-sho` (RCA, D1–D4, site-shell delta) and `SWHR2-T-0324/PLAN.md` |
| SWHR2-T-0326 | TASK   | Bugfix plan — SWHR2-S-0034 (re-run)   | DONE, no commit. Re-verified the plan once SWHR2-T-0324 was attached to the sprint                                         |
| SWHR2-T-0324 | DEFECT | Place order duplicating shopping cart | DONE, f68da4c (PR #101). `SWHR2-T-0324/fix-note.md`, `tdd-test-result.md`                                                  |
| SWHR2-T-0327 | TASK   | Integration QA report — SWHR2-S-0034  | DONE, 4a136f5 (PR #103). Pass; flaky e2e filed as SWHR2-T-0328                                                             |
| SWHR2-T-0329 | TASK   | Sprint close bundle — SWHR2-S-0034    | this file                                                                                                                  |

## What shipped

All of it was built in SWHR2-T-0324 (detail in its `fix-note.md`):

- The "Place order" entry is removed from the shell's area list (`src/components/shell/areas.ts`). The Shop group now lists Catalog & search, Shopping cart and Language.
- The now-unused credit-card icon is removed from the icon type and the navigation's icon map (`GlobalNav.tsx`).
- On the cart page only "Shopping cart" is highlighted.
- The landing page's cart card no longer shows a "Place order" sub-label, because it reads the same list.
- `GlobalNav.test.tsx` now guards the bug class. It asserts the Shop group's entries, that every area link has a distinct destination, and that exactly one link is current on `/petstore/cart` (cases C-0283 to C-0287).
- Placing an order is unchanged: cart → Check out → Place order button.

## Divergence from plan

- None in behaviour. The fix touched exactly the three files in the plan's ownership map.
- C-0284 and C-0287 were drafted at e2e level but are asserted in jsdom unit tests, because the red/green evidence run is Vitest only. See Known Issues.

## Verification

Pass, per `qa-test-report.md`:

- Lint, typecheck and build exit 0.
- 432 unit tests pass.
- Project Playwright: 19 passed and 1 failed in the full run; the failing spec passed on a rerun of that spec alone (flaky, SWHR2-T-0328).
- Locked acceptance: no navigation case fails. The 7 known failures (customer-notifications ×6, sign-on C-0264) are pre-existing.
- Coverage was not measured.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- **SWHR2-T-0328** (DEFECT, REFINED, future sprint): flaky e2e `order-approval.spec.ts` C-0243. It timed out once in the full run (order 10011 already COMPLETED) and passed on a single-spec rerun. It is unrelated to the navigation change.
- **Browser-level navigation cases.** C-0284 and C-0287 have no Playwright spec; their behaviour is asserted in jsdom only.
- **Pre-existing locked acceptance failures** in other capabilities, unchanged and triaged at UAT: customer-notifications C-0049/0055/0056/0061/0062/0067 (harness fault) and sign-on C-0264.

## Defects Raised

- SWHR2-T-0328 — "Flaky e2e: order-approval C-0243 fails then passes on rerun" (raised by validation during integration QA, 2026-11-03).

## Retrospective

- Went well: the brief's root-cause hypothesis was accurate and code-verified, so planning only had to add the landing-page side effect and a regression guard. The fix was a 4-line deletion plus tests in one dispatch.
- Went well: the new test asserts the bug class (distinct destinations, a single current link), not just this entry, so a future duplicate fails in the unit suite.
- Could improve: planning ran twice (SWHR2-T-0325, then SWHR2-T-0326), because the first planning ticket started before the DEFECT was attached to the sprint. Attaching the DEFECT before seeding the planning ticket would save a dispatch.
- Could improve: cases drafted at e2e level were implemented in jsdom. When the evidence runner is unit-only, drafting should say so or choose the unit level.
- Could improve: the order-approval e2e flake has now surfaced in a sprint that did not touch order approval.

## Compliance / Control Evidence

| Control                        | Evidence                                              | Location                                                                                                    | Status              | Exception                                      |
| ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; DEFECT PLAN.md | `openspec/changes/swhr2-i-0015-place-order-duplicating-sho/`, `artifacts/SWHR2-S-0034/SWHR2-T-0324/PLAN.md` | Satisfied           | —                                              |
| Change verified before release | QA report with per-scenario verdicts                  | `artifacts/SWHR2-S-0034/qa-test-report.md`                                                                  | Satisfied           | —                                              |
| Tests executed                 | platform red/green runs; QA unit and e2e runs         | `SWHR2-T-0324/tdd-test-result.md`, `integration-test-result.md`                                             | Partially satisfied | C-0284/C-0287 asserted in jsdom, not a browser |
| Browser E2E executed           | `19 passed, 1 failed` (flaky, passed on rerun)        | `artifacts/SWHR2-S-0034/integration-test-result.md`                                                         | Partially satisfied | SWHR2-T-0328 flaky order-approval spec         |
| Code reviewed before merge     | CODE-REVIEW line in fix note                          | `artifacts/SWHR2-S-0034/SWHR2-T-0324/fix-note.md`                                                           | Satisfied (self)    | No sub-agent or human reviewer                 |
| Design conformance             | Not Applicable — no approved mockup                   | —                                                                                                           | Not Applicable      | —                                              |
| Defects dispositioned          | resolution log; flaky spec filed                      | `artifacts/SWHR2-S-0034/integration-defects-resolution.md`                                                  | Satisfied           | SWHR2-T-0328 deferred to a future sprint       |
| Release accepted               | Not Provided                                          | —                                                                                                           | Not Provided        | —                                              |
