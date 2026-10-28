---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0006
capability_brief: SWHR2-I-0002
branch: vortex/sprint/swhr2-s-0006-cae7cae1
upstream:
  [
    artifacts/SWHR2-S-0006/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0006/qa-test-report.md,
    artifacts/SWHR2-S-0006/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0006/release-notes.md]
---

# Sprint summary — SWHR2-S-0006

## Tickets

| Ticket       | Type | Title                                                                                    | Outcome                                            |
| ------------ | ---- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| SWHR2-T-0080 | TASK | Sprint plan — SWHR2-S-0006                                                               | DONE (c17db51)                                     |
| SWHR2-T-0081 | TASK | Site shell 1 — Boilerplate: brand the scaffold as Pet Store and keep the root smoke test | DONE (93b28f2, PR #16) — `SWHR2-T-0081/summary.md` |
| SWHR2-T-0083 | TASK | Site shell 3 — Shared layout (header, footer) and global navigation rail on every page   | DONE (c3235c7, PR #17) — `SWHR2-T-0083/summary.md` |
| SWHR2-T-0084 | TASK | Site shell 4 — Shared empty, error and loading frames with a data hook                   | DONE (c6a8e95, PR #18) — `SWHR2-T-0084/summary.md` |
| SWHR2-T-0082 | TASK | Site shell 2 — Landing page at / linking to every primary area                           | DONE (b3e35f9, PR #19) — `SWHR2-T-0082/summary.md` |
| SWHR2-T-0086 | TASK | Integration QA report — SWHR2-S-0006                                                     | DONE (282701e, PR #21) — `qa-test-report.md`       |
| SWHR2-T-0088 | TASK | Sprint close bundle — SWHR2-S-0006                                                       | this file and `release-notes.md`                   |

## What shipped

Sprint goal "SWHR2-I-0002: Bootstrap, landing page and shared site shell" is met. The app is branded Pet Store; `/` is a landing page linking to every primary area; every route renders inside one `AppShell` (header, grouped navigation rail with a Home link, footer); shared `EmptyFrame`, `ErrorFrame` (Try again) and `LoadingFrame` plus a `useApi` hook exist, and unshipped areas (`/petstore`, `/petstore/cart`, `/petstore/signin`, `/admin`, `/supplier`) open empty-frame placeholder pages. All five change scenarios passed at QA.

## Divergence from plan

- Execution order was 0081 → 0083 → 0084 → 0082, as the planned `depends_on` chain required; no re-sequencing.
- SWHR2-T-0081 set light-theme tokens in hex rather than OKLCH (PLAN step 4) to match the mockups exactly. DESIGN.md §Tokens corrected at close to say so.
- SWHR2-T-0082 made the catalog link the hero CTA and rendered one card per distinct route with merged labels (e.g. "Shopping cart · Checkout"), so each route is linked once.
- SWHR2-T-0084 also moved `/users` onto `useApi` and the frames, replacing its hard-coded list.
- Header search, language, cart and account controls, the "Choose a pet" panel and per-card descriptions were left to later capabilities, as planned.

## Verification

PASS — `qa-test-report.md` (SWHR2-T-0086): verify green (44 unit tests), Playwright 5/5, all five SCENARIO-VERDICT lines pass; `integration-defects-resolution.md`: no defects. Design fidelity: MCK-1..3 "differs" for out-of-scope content, MCK-4 (error state) "not built" on a route — the `ErrorFrame` is unit-tested only.

## Defects Raised

None. `a2a_list_tickets(type="defect", created_since=2026-10-28T14:18:29Z)` returned no tickets, and no improvement TASKs were raised in the sprint window.

## Retrospective

- Went well: the single `areas.ts` list (decision P3) let the navigation (0083) and landing page (0082) be built by separate tickets without drift; QA found nothing to fix.
- Went well: the linear `depends_on` chain meant no ownership collisions across four parallel-capable tickets.
- Could improve: no implementation ticket could run E2E — the container's Chromium (1223) does not match Playwright 1.50's expected revision (1155). `e2e/home.spec.ts` was first executed only at QA, via a symlinked browser path, and no implementation-time design-check screenshots exist. This is an environment gap worth fixing before the next UI sprint.
- Could improve: on `/petstore/cart` both "Shopping cart" and "Checkout" nav entries show active because they share a route (QA note). Acceptable while checkout is unshipped; it resolves when checkout gets its own route.
- Could improve: no route renders the error frame, so MCK-4 could not be compared in a browser; the first data-driven capability page should add an E2E for it.

## Compliance / Control Evidence

| Control                        | Evidence                                                  | Location                                                                                                        | Status    | Exception                                                 |
| ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------- |
| Work planned before execution  | change design.md, per-ticket PLAN.md                      | `openspec/changes/swhr2-i-0002-bootstrap-landing-page-and/`, `artifacts/SWHR2-S-0006/SWHR2-T-008{1..4}/PLAN.md` | Satisfied | —                                                         |
| Change verified before release | QA report, PASS, 5/5 scenarios                            | `artifacts/SWHR2-S-0006/qa-test-report.md`                                                                      | Satisfied | —                                                         |
| Tests executed                 | platform red/green runs, TDD results                      | `artifacts/SWHR2-S-0006/SWHR2-T-008{1..4}/tdd-test-result.md`, `integration-test-result.md`                     | Satisfied | E2E not run at ticket level (browser mismatch); run at QA |
| Defects dispositioned          | 0 found                                                   | `artifacts/SWHR2-S-0006/integration-defects-resolution.md`                                                      | Satisfied | —                                                         |
| Code review before merge       | self-review per ticket                                    | each ticket's `summary.md` CODE-REVIEW line                                                                     | Satisfied | Self-review only; no independent reviewer                 |
| Release accepted               | `validation.all_acs_passed` fired; sprint in SPRINT_CLOSE | sprint SWHR2-S-0006 state                                                                                       | Satisfied | Human approver: Not Provided                              |
