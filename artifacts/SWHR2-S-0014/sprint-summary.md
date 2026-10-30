---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0014
capability_brief: SWHR2-I-0005
branch: vortex/sprint/swhr2-s-0014-2256b050
upstream:
  [
    artifacts/SWHR2-S-0014/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0014/qa-test-report.md,
    artifacts/SWHR2-S-0014/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0014/release-notes.md]
---

# Sprint summary — SWHR2-S-0014

Goal: "SWHR2-I-0005: Sign-on and access control". Met for everything the current code base can host: 13 of the 19 scenarios of change `swhr2-i-0005-sign-on-and-access-control` pass in `qa-test-report.md` (11 there, plus the two QA rework rounds that fixed C-0256, C-0258 and C-0269). The other 6 need components that later capabilities build: checkout (SWHR2-I-0008), message hand-off and order lines (SWHR2-I-0011), and a framework sample application that does not exist (design decision SD4).

## Tickets

| Ticket       | Type    | Title                                      | Outcome                                                                         |
| ------------ | ------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| SWHR2-T-0229 | TASK    | Sprint plan — SWHR2-S-0014                 | DONE, a2486c1                                                                   |
| SWHR2-T-0230 | FEATURE | Sign-on and access control                 | DONE, 96b7a4e — `SWHR2-T-0230/summary.md`, `design-check.md`                    |
| SWHR2-T-0233 | TASK    | Integration QA report                      | DONE, 8f04dc3 — `qa-test-report.md`, `integration-test-result.md`               |
| SWHR2-T-0234 | TASK    | QA rework round 1 (C-0256, C-0258, C-0269) | DONE, b836d3b — C-0256 fixed in the test environment; `SWHR2-T-0234/summary.md` |
| SWHR2-T-0235 | TASK    | Integration QA report (refresh)            | DONE, 8cc7add — QA report updated after round 1                                 |
| SWHR2-T-0236 | TASK    | QA rework round 2 (C-0258, C-0269)         | DONE, a3c2419 — app changed to meet both cases; `SWHR2-T-0236/summary.md`       |
| SWHR2-T-0237 | TASK    | Sprint close bundle                        | this file                                                                       |

## What shipped

- Storefront sign-on: sign-in screen with Returning customer and New customer forms, a remembered user name kept for 31 days, a header that shows Sign in or Sign out but never both, a "You are signed out" screen that keeps the language, and a 15-minute idle limit that also empties the cart (SWHR2-T-0230).
- `requireCustomer` guards account editing; a visitor is sent to sign in and back. Checkout is guarded by the same guard once checkout exists (SWHR2-I-0008).
- Administration area: its own sign-in, Login Error screen with "Back to sign-in", a landing page with Launch administration tool and Log out, and a 54-minute idle limit (SWHR2-T-0230).
- Supplier area: its own sign-in, refused with "Sign out of Administration first…" while an administration session is live (SWHR2-T-0230).
- Three area-scoped server sessions (`ps_sid`, `admin_sid`, `supplier_sid`), an idle-session sweep, guards in `services/session/guards.ts`, the `signon_users` table (migration `drizzle/0003_kind_gladiator.sql`) and sign-on strings for en_US, ja_JP and zh_CN (SWHR2-T-0230).
- From QA rework: a supported `?locale=` query on a page sets the session language; `<html lang>` follows the language; the staff areas no longer show the customer Sign in link (SWHR2-T-0236).

## Divergence from plan

- No `e2e/sign-on.spec.ts` was committed: the implementation container had no Chromium, and an unexecuted spec may not be committed. The acceptance suite covers the same flows (`SWHR2-T-0230/summary.md`).
- Test cases C-0252 and C-0254 (checkout) were deferred to SWHR2-I-0008, and C-0263, C-0264 and C-0268 (message hand-off, order lines) to SWHR2-I-0011. Scenario "Framework sample application idle session expiry" has no target and nothing was built (SD4).
- Two QA rework rounds were needed. Round 1 (T-0234) changed test-environment password hashes and added a warm-up so the admin sign-in response is not cancelled by the test's next navigation. Round 2 (T-0236) changed the app after the approver kept C-0258 and C-0269 as written, although QA had first recorded both as faults in the locked tests.
- Visual differences against the mockups were accepted rather than fixed: field label "User ID" instead of "User name", language switch outside the header, flat sidebar (`qa-test-report.md` Design fidelity; `SWHR2-T-0230/design-check.md`).

## Verification

PASS — see `qa-test-report.md` and `integration-defects-resolution.md`. Lint, typecheck, build and 173 unit tests pass. The regular Playwright suite passed 12/12 with a Chromium 1223 build linked under `PLAYWRIGHT_BROWSERS_PATH`. After round 2 the sign-on acceptance e2e passed locally 7 of 9 cases; the 2 failures are the checkout cases deferred to SWHR2-I-0008. `a2a_get_ci_status` on the sprint branch reports `pass`, but lists no workflow runs. No product defect was filed.

## Defects Raised

None. No DEFECT ticket was filed this sprint; acceptance-test findings were handled in rework tickets SWHR2-T-0234 and SWHR2-T-0236.

## Retrospective

- Went well: one FEATURE carried the whole change and landed in a single dispatch. Its summary maps every AC to a case or a recorded deferral.
- Went well: approved mockups were committed under `artifacts/SWHR2-S-0014/design/` this time, so QA rendered MCK-13 next to the built screen (`qa/design/`). In S-0009 QA had no design reference.
- Could improve: the browser tier is still unreliable. The implementation container had no Chromium. QA's container had Chromium 1223, but the repo preflight pins 1155 and refuses it, so QA had to link it by hand (QA I5, SPEC-GAP). The preflight version pin needs fixing.
- Could improve: two of the three rework causes were test-shape problems (a navigation race, a non-unique link query) found only in the official run. The FEATURE had no browser to run the acceptance e2e before it merged, so these surfaced late.
- Could improve: the dispute on C-0258 / C-0269 cost a QA round. They were first recorded as "fault in the locked test" and then kept by the approver, after which the app changed in round 2.

## Compliance / Control Evidence

| Control                        | Evidence                                                  | Location                                                                                        | Status                       | Exception                                      |
| ------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; per-ticket PLAN.md | `openspec/changes/swhr2-i-0005-sign-on-and-access-control/`, `artifacts/SWHR2-S-0014/*/PLAN.md` | Satisfied                    | —                                              |
| Change verified before release | QA report with per-scenario verdicts                      | `artifacts/SWHR2-S-0014/qa-test-report.md`                                                      | Satisfied                    | 6 scenarios not testable (deferred components) |
| Tests executed                 | TDD results per ticket; QA unit, e2e and acceptance runs  | `artifacts/SWHR2-S-0014/SWHR2-T-023*/tdd-test-result.md`, `integration-test-result.md`          | Satisfied                    | —                                              |
| Browser E2E executed           | `12 passed`; acceptance sign-on 7/9                       | `artifacts/SWHR2-S-0014/integration-test-result.md`, `SWHR2-T-0236/summary.md`                  | Satisfied                    | Chromium linked by hand past the preflight pin |
| Code reviewed before merge     | CODE-REVIEW lines in each ticket summary                  | `artifacts/SWHR2-S-0014/SWHR2-T-023*/summary.md`                                                | Satisfied (sub-agent / self) | No independent human reviewer                  |
| Design conformance             | design check; MCK-13 screenshot pair                      | `SWHR2-T-0230/design-check.md`, `qa/design/MCK-13-*.png`                                        | Partially satisfied          | Residual differences accepted, not ticketed    |
| Defects dispositioned          | none found; rework rounds recorded                        | `integration-defects-resolution.md`                                                             | Satisfied                    | —                                              |
| Release accepted               | `Not Provided`                                            | —                                                                                               | Not Provided                 | —                                              |
