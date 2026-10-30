---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0015
capability_brief: SWHR2-I-0006
branch: vortex/sprint/swhr2-s-0015-ba46b929
upstream:
  [
    artifacts/SWHR2-S-0015/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0015/qa-test-report.md,
    artifacts/SWHR2-S-0015/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0015/release-notes.md]
---

# Sprint summary — SWHR2-S-0015

Goal: "SWHR2-I-0006: Customer account and profile". Met. All 32 scenarios of change `swhr2-i-0006-customer-account-and-profil` pass in `qa-test-report.md`. Two acceptance cases (SWHR2-C-0157, SWHR2-C-0269) stayed red in the official CI run. Both are disputed as test-shape faults, and the follow-up is in the backlog (see Known Issues).

## Tickets

| Ticket       | Type    | Title                              | Outcome                                                                              |
| ------------ | ------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| SWHR2-T-0238 | TASK    | Sprint plan — SWHR2-S-0015         | DONE, 2e2aa4e. Change `design.md` planning section, FEATURE PLAN.md, ARCHITECTURE.md |
| SWHR2-T-0239 | FEATURE | Customer account and profile       | DONE, 4ed1634. `SWHR2-T-0239/summary.md`, `design-check.md`                          |
| SWHR2-T-0240 | TASK    | Integration QA report              | DONE, 40da5e2. PASS, DEFECT-1 and DEFECT-2 fixed in place                            |
| SWHR2-T-0241 | TASK    | QA rework round 1 (C-0157, C-0269) | DONE, 1a3fe8b. App changes made, both cases disputed; `SWHR2-T-0241/summary.md`      |
| SWHR2-T-0243 | TASK    | QA rework round 2 (C-0157, C-0269) | DEFERRED; carried as DEFECT SWHR2-T-0244                                             |
| SWHR2-T-0245 | TASK    | Sprint close bundle                | this file                                                                            |

## What shipped

- Customer, account (contact info, address, payment card, status) and profile tables in migration `drizzle/0004_watery_jasper_sitwell.sql`. `services/customers/` is the only writer. It creates customer, account and profile in one transaction and refuses a duplicate user id (SWHR2-T-0239).
- Address writes join the caller's transaction or open their own, and a contact-information snapshot copies the address without changing the stored record (SWHR2-T-0239).
- Sign-up on the sign-in screen: password typed twice, both required, the first one kept with no mismatch check. A refused name goes to the User Creation Error screen (SWHR2-T-0239).
- Account information page for creating and editing the account. Card type is limited to Java(TM) Card, Duke Express and Meow Card, and the expiry year comes from a fixed list. Profile defaults are en_US, no favourite category, My List on and banner on (SWHR2-T-0239).
- My List panel shows the first 10 products of the favourite category. The pet-tips banner shows on Home and Cart only, and falls back to dogs (SWHR2-T-0239).
- Routes `routes/api/account/*` (GET/POST/PUT, register, my-list) and `routes/api/session.get.ts`. Account strings added for en_US, ja_JP and zh_CN (SWHR2-T-0239).
- From QA: no 401 console error for anonymous visitors, and My List refreshes after client-side navigation (T-0240). My List makes one request, and its "Change in Account & profile" link sits outside the panel (T-0241).

## Divergence from plan

- The FEATURE container had no usable Chromium, so `bun run test:e2e` did not run at ticket level. QA ran it by linking chromium-1223 under the chromium-1155 name the preflight expects. This is the same workaround used in S-0014.
- The purchase step of C-0174 (Account creation before purchase) was deferred to SWHR2-I-0008 (checkout).
- QA rework round 1 did not turn C-0157 or C-0269 green. C-0157 counts My List links straight after `page.goto` with no wait for the client fetch. C-0269's page-wide `getByLabel(/password/i)` now matches three inputs, because the sign-up form adds two password fields that customer-account cases C-0147/C-0164 require. Both cases were disputed. Round 2 (T-0243) was deferred into DEFECT SWHR2-T-0244.
- Gate bypass on T-0241 was accepted and recorded as DEFECT SWHR2-T-0242.

## Verification

PASS. See `qa-test-report.md` and `integration-defects-resolution.md`. Lint, typecheck and 205 unit tests pass (55 files). Playwright e2e passed 15 of 15 after the DEFECT-1 and DEFECT-2 fixes. Coverage is not measured because `@vitest/coverage-v8` is missing. QA did not compare the mockups (MCK-19/20/21) with the built screens. The FEATURE's own `design-check.md` has the screenshot pairs.

## Defects Raised

- DEFECT-1, DEFECT-2: found and fixed in place at integration QA (`integration-defects-resolution.md`).
- SWHR2-T-0242 (BACKLOG): accepted gate bypass on SWHR2-T-0241.
- SWHR2-T-0244 (BACKLOG): unfinished work from deferred rework round 2, covering C-0157 and C-0269.

## Known Issues

- SWHR2-T-0244: acceptance cases SWHR2-C-0157 (My List links counted before the panel loads) and SWHR2-C-0269 (sign-on password label not unique once the sign-up form exists) are still red in the official CI run. Both are disputed as test faults.
- SWHR2-T-0242: the merge gate was bypassed on SWHR2-T-0241 while those two cases were red.

## Retrospective

- Went well: one FEATURE carried the whole change (32 scenarios) in one dispatch. QA found only two defects, and both were fixed in place in one round each.
- Went well: approved mockups were exported at planning, and the FEATURE produced screenshot pairs for all three (`SWHR2-T-0239/design-check/`).
- Could improve: the Chromium revision pin is still unfixed. The FEATURE again shipped without running e2e, and DEFECT-2 and both red acceptance cases surfaced only at QA. This is the third sprint with this problem.
- Could improve: locked acceptance cases from two capabilities (sign-on C-0269, customer-account C-0147/C-0164) conflict on one page. Cross-capability case review should catch page-wide locators before the cases are locked.
- Could improve: QA left design fidelity as "Evidence Required" even though the FEATURE's screenshot pairs were on the branch.

## Compliance / Control Evidence

| Control                        | Evidence                                               | Location                                                                                                    | Status              | Exception                                      |
| ------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------- |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md | `openspec/changes/swhr2-i-0006-customer-account-and-profil/`, `artifacts/SWHR2-S-0015/SWHR2-T-0239/PLAN.md` | Satisfied           | —                                              |
| Change verified before release | QA report with per-scenario verdicts                   | `artifacts/SWHR2-S-0015/qa-test-report.md`                                                                  | Satisfied           | C-0174 purchase step deferred to SWHR2-I-0008  |
| Tests executed                 | TDD results per ticket; QA unit and e2e runs           | `artifacts/SWHR2-S-0015/SWHR2-T-02*/tdd-test-result.md`, `integration-test-result.md`                       | Partially satisfied | C-0157, C-0269 red (SWHR2-T-0244)              |
| Browser E2E executed           | `15 passed`                                            | `artifacts/SWHR2-S-0015/integration-test-result.md`                                                         | Satisfied           | Chromium linked by hand past the preflight pin |
| Code reviewed before merge     | CODE-REVIEW line in FEATURE summary                    | `artifacts/SWHR2-S-0015/SWHR2-T-0239/summary.md`                                                            | Satisfied (self)    | No sub-agent or human reviewer                 |
| Design conformance             | FEATURE design check, MCK-19/20/21 screenshot pairs    | `SWHR2-T-0239/design-check.md`                                                                              | Partially satisfied | QA issued no design verdict                    |
| Defects dispositioned          | resolution log; backlog DEFECTs                        | `integration-defects-resolution.md`, SWHR2-T-0242, SWHR2-T-0244                                             | Satisfied           | Two DEFECTs open in backlog                    |
| Release accepted               | `Not Provided`                                         | —                                                                                                           | Not Provided        | —                                              |
