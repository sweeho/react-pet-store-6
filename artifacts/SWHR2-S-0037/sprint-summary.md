---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0037
capability_brief: none
branch: vortex/sprint/swhr2-s-0037-dbc051b2
upstream:
  [
    artifacts/SWHR2-S-0037/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0037/qa-test-report.md,
    artifacts/SWHR2-S-0037/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0037/release-notes.md]
---

# Sprint summary — SWHR2-S-0037

Goal: "Bugfix — SWHR2-T-0337, SWHR2-T-0338, SWHR2-T-0339" (UAT round 1 localization failures at rc-2026.11.4). Met. The storefront is now shown in the chosen language from the first paint, the header language flags switch everything at once, and the site navigation and footer are localized.

- The locked localization browser cases this sprint targeted pass in QA's warm runs: SWHR2-C-0021, C-0026, C-0027 and C-0028.
- All eight scenarios of the two modified localization requirements are recorded as pass.
- One QA rework round added browser tests that cite the new cases.

## Tickets

| Ticket       | Type   | Title                                                     | Outcome                                                                                                                           |
| ------------ | ------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| SWHR2-T-0340 | TASK   | Bugfix plan — SWHR2-S-0037                                | DONE, c1534cd. Change `swhr2-s-0037-bugfix-swhr2-t-0337-swhr2-t` (RCA R1–R3, D1–D6); three chained PLAN.md files; ARCHITECTURE.md |
| SWHR2-T-0339 | DEFECT | UAT acceptance: SWHR2-C-0021 fails                        | DONE, 9e3b60b (PR #110). Locale at first render; one root provider                                                                |
| SWHR2-T-0337 | DEFECT | UAT acceptance: SWHR2-C-0028 fails                        | DONE, 300102f (PR #111). Header reads the shared locale; flags moved into the header                                              |
| SWHR2-T-0338 | DEFECT | UAT acceptance: SWHR2-C-0026 fails                        | DONE, 828050f (PR #112). Localized navigation and footer                                                                          |
| SWHR2-T-0341 | TASK   | Integration QA report — SWHR2-S-0037                      | DONE, 1a498dc (PR #114). Proceed                                                                                                  |
| SWHR2-T-0342 | TASK   | QA rework round 1: 11 case(s) owed in the official CI run | DONE, 52a4517 (PR #115). Case keys added to `e2e/localization.spec.ts`, plus tests for C-0295, C-0298, C-0300                     |
| SWHR2-T-0343 | TASK   | Sprint close bundle — SWHR2-S-0037                        | this file                                                                                                                         |

## What shipped

Details are in each defect's `fix-note.md`. The planning finding that shaped all three fixes: the server already stored and returned the locale correctly, and the ja_JP and zh_CN translations already existed. Every fault was in how the client applied the locale.

- **SWHR2-T-0339:**
  - The server keeps a readable `ps_locale` cookie equal to the storefront session's locale (on session start, `POST /api/session/locale`, and the `?locale=` link). `ps_sid` stays HttpOnly.
  - `LocaleProvider` seeds itself from that cookie, so the first render is already in the session locale.
  - One provider now wraps the whole app in `src/main.tsx`, replacing the per-page providers.
- **SWHR2-T-0337:**
  - `StorefrontHeader` reads the shared locale, so a flag click relabels it on the same page.
  - The EN/JA/ZH flags moved from the `/petstore` page body into the storefront header, as the requirement says.
- **SWHR2-T-0338:**
  - New per-locale `shell` screen definitions (`src/locales/{en_US,ja_JP,zh_CN}/shell.ts`) drive the global navigation's area labels, group headings, Home link and landmark name, and the footer.
  - The en_US text is unchanged.
- **SWHR2-T-0342:** `e2e/localization.spec.ts` titles now carry the case keys, and new browser tests cover C-0295, C-0298 and C-0300.

## Divergence from plan

- All three fixes also edited the shared unit test `src/pages/petstore/locale.test.tsx`, which was in no ownership map. That was safe only because depends_on ran the fixes one after another.
- The plan placed browser verification of the new e2e-level cases in the defect tickets. The platform's evidence run is Vitest only, so those tickets cited the cases in unit tests, and a QA rework round (SWHR2-T-0342) was needed to add keyed browser tests for C-0295, C-0298 and C-0300.

## Verification

Proceed, per `qa-test-report.md` and `integration-defects-resolution.md`:

- Build, lint and typecheck green.
- 444 unit tests pass.
- `bun run test:e2e`: 24 passed, 0 failed, 0 skipped.
- The rework's `e2e/localization.spec.ts`: 8 passed.
- Locked acceptance: C-0021, C-0026, C-0027 and C-0028 pass in warm runs.
- Coverage was not measured.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- **Cold-server first run.** On QA's first run against a cold dev server, locked C-0022, C-0026 and C-0027 failed with an empty page body at the load event while Vite optimised dependencies. They passed in both warm re-runs. This is test-environment start-up, not app behaviour, but the official run can hit it.
- **SWHR2-C-0039 (localization, not in this sprint).** It fails 3 of 3 on the locked test's own selector: `getByLabel(/^password:?$/i)` matches both the sign-in and the new-customer password fields on `/petstore/signin`. This is the same locator fault as data-population C-0079. It is not a Japanese-input defect, as UAT's grouping suggested.
- **Header relabel in a browser.** C-0300's browser test (added in rework) checks the header after a flag click, and C-0299 checks the labels at unit level. QA's verdict for "Header follows a flag change without navigating" leans on the unit test for the exact labels.
- **Staff-area chrome follows the shopper's locale** (design.md D5, proposal follow-up). `/admin` and `/supplier` show the global navigation in the storefront session's language. Whether staff areas should stay English is undecided.
- **QA runner note.** `bun run test tests/acceptance` finds no files (the acceptance suites have their own config). This is recorded by QA and does not affect the declared gates.

## Defects Raised

None. No DEFECT ticket was created between sprint start (2026-11-03T09:41Z) and close.

## Retrospective

- Went well: re-verifying the UAT notes paid off. Their proposed remedy, adding translations, was wrong. A curl check showed the server was fine, which narrowed the fault to three client-side causes that each mapped to one defect.
- Went well: chaining the three defects with depends_on let three agents touch overlapping files (including an unplanned shared test) without a merge conflict.
- Could improve: for the third sprint running, e2e-level cases were satisfied by unit tests during execution and needed a QA rework round to gain browser tests. Either the evidence runner should include Playwright, or defect tickets should own keyed browser tests up front.
- Could improve: a cold dev server can fail locked browser cases at the load event. Warming the routes the localization suite visits in `e2e/global-setup.ts`, or the acceptance equivalent, would remove the flake.

## Compliance / Control Evidence

| Control                        | Evidence                                                    | Location                                                                                                 | Status              | Exception                                                     |
| ------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; three PLAN.md files  | `openspec/changes/swhr2-s-0037-bugfix-swhr2-t-0337-swhr2-t/`, `artifacts/SWHR2-S-0037/SWHR2-T-*/PLAN.md` | Satisfied           | —                                                             |
| Change verified before release | QA report with per-scenario verdicts                        | `artifacts/SWHR2-S-0037/qa-test-report.md`                                                               | Satisfied           | —                                                             |
| Tests executed                 | red/green runs per defect; QA unit, e2e and acceptance runs | `SWHR2-T-*/tdd-test-result.md`, `integration-test-result.md`                                             | Satisfied           | Browser citations for 3 cases added in rework SWHR2-T-0342    |
| Browser E2E executed           | `24 passed`; locked localization cases pass warm            | `artifacts/SWHR2-S-0037/integration-test-result.md`                                                      | Partially satisfied | Cold-server first run failed C-0022/0026/0027; warm runs pass |
| Code reviewed before merge     | CODE-REVIEW line in each fix note                           | `artifacts/SWHR2-S-0037/SWHR2-T-*/fix-note.md`                                                           | Satisfied (self)    | No sub-agent or human reviewer                                |
| Design conformance             | Not Applicable — no approved mockup                         | —                                                                                                        | Not Applicable      | —                                                             |
| Defects dispositioned          | resolution log; rework round recorded                       | `artifacts/SWHR2-S-0037/integration-defects-resolution.md`                                               | Satisfied           | —                                                             |
| Release accepted               | Not Provided                                                | —                                                                                                        | Not Provided        | —                                                             |
