---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0033
capability_brief: SWHR2-I-0014
branch: vortex/sprint/swhr2-s-0033-f6a2221d
upstream:
  [
    artifacts/SWHR2-S-0033/SPRINT-PLAN.md,
    artifacts/SWHR2-S-0033/qa-test-report.md,
    artifacts/SWHR2-S-0033/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR2-S-0033/release-notes.md]
---

# Sprint summary — SWHR2-S-0033

Goal: "SWHR2-I-0014: Sample data population". Met. `qa-test-report.md` records all 12 scenarios of change `swhr2-i-0014-sample-data-population` as pass, and integration QA found no defects. The data-population locked Vitest tests pass (11 of 11). Its one locked browser case, SWHR2-C-0079, fails on an ambiguous locator in the test itself. Two catalog-browsing locked browser cases now conflict with the approved seed. Both are in Known Issues.

## Tickets

| Ticket       | Type    | Title                                | Outcome                                                                                                                               |
| ------------ | ------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| SWHR2-T-0320 | TASK    | Sprint plan — SWHR2-S-0033           | DONE, ebf0d27. Planning section P1–P7 and spec discrepancies X1–X5 in the change's design.md; ARCHITECTURE.md; `SWHR2-T-0321/PLAN.md` |
| SWHR2-T-0321 | FEATURE | Sample data population               | DONE, bfb3ac9 (PR #98). `SWHR2-T-0321/summary.md`, `tdd-test-result.md`                                                               |
| SWHR2-T-0322 | TASK    | Integration QA report — SWHR2-S-0033 | DONE, 83036b2 (PR #100). PASS, no defects                                                                                             |
| SWHR2-T-0323 | TASK    | Sprint close bundle — SWHR2-S-0033   | this file                                                                                                                             |

## What shipped

All of it was built in SWHR2-T-0321 (detail in its `summary.md`):

- **One editable UTF-8 seed file, `db/seed/petstore.json`** (+ `types.ts`), ported from the legacy `Populate-UTF8.xml` files. It holds:
  - 4 sample users and customers (j2ee, j2ee-ja, shopper, j2ee-zh)
  - 5 categories, 16 products and 28 items, each in en_US, ja_JP and zh_CN, with prices in hundredths
  - supplier stock EST-1…EST-29 at 10000

  The ja_JP detail for EST-15, missing from the legacy data, was authored.

- **`bun run db:seed` (`scripts/seed.ts`)**:
  - validates the file and hashes the passwords
  - in one transaction, replaces the sample accounts by id (other accounts untouched) and upserts the catalog and inventory; an entry without a quantity loads as 0
  - writes nothing on failure
- **`db/client.ts` inserts no rows.** It also recreates any table that is missing after its migrations ran (`repairMissingTables`, from a `:memory:` reference migration).
- **The dev server and both Playwright web servers seed before starting** (`predev`, `webServer.command`).
- **`services/customers/contact.ts#createContact`** is the one contact writer, linking an existing address.

## Divergence from plan

- The loader's tests live under `services/seed/`, not beside `scripts/seed.ts`, so the existing server Vitest project runs them with no config change. `tsconfig.node.json` now includes `scripts/`.
- Otherwise as planned. The six items of the old inline fixture keep their values (P7), because existing e2e specs pin them.

## Verification

Proceed, per `qa-test-report.md`:

- Lint, typecheck and build exit 0.
- 427 unit tests pass.
- Project Playwright: 20 passed, 0 failed, 0 skipped.
- Locked data-population Vitest: 11 of 11 pass.
- Locked browser suite: 8 failed, 58 passed. These are C-0079 and C-0197/C-0198 (Known Issues), plus pre-existing failures in other capabilities.
- Coverage was not measured.
- At close I could not re-run the browser suite: this container has no Chromium, and installing one is out of policy.

## Known Issues

The sprint was not conditionally approved. These residuals are recorded so they are not lost:

- **SWHR2-C-0079 (data-population, locked browser).** `getByLabel(/^password:?$/i)` on `/petstore/signin` matches both the sign-in and the new-customer password fields, a strict-mode violation in the test. Its `/petstore`, `/admin` and `/supplier` steps pass, and seeded `j2ee` sign-in is covered by the passing project e2e. Disputed by the implementer as a test fault.
- **SWHR2-C-0197 and SWHR2-C-0198 (catalog-browsing, locked browser).**
  - Both assume DOGS has 3 products: page 1 shows Bulldog and Dalmation, page 2 shows Poodle with no Next.
  - They passed against the old 3-dog inline fixture. The approved seed has 6 DOGS products, as SWHR2-C-0075 requires, so page 2 now has a Next.
  - Two capabilities' locked tests conflict here. Disputed by the implementer; needs a test-author fix or a UAT decision.
- **EST-15 Japanese wording (design.md X1).** It was authored by translation and needs Business Owner confirmation.
- **EST-29 (X2).** It stays stocked but uncatalogued, as SWHR2-C-0073 requires; Business Owner finding F1 is still open.
- **One SQLite file (X3).** The spec's "separate datastores" are met as table groups in one file. PRD open question 5 is still open.
- **Pre-existing locked failures in other capabilities**, triaged at UAT:
  - customer-notifications C-0049/0055/0056/0061/0062/0067 (harness fault)
  - sign-on C-0264
  - localization C-0021/0026/0028/0039
  - customer-account C-0157

## Defects Raised

None. No DEFECT ticket was created between sprint start (2026-11-02T17:30Z) and close.

## Retrospective

- Went well: planning read the legacy seed files before decomposing. It found the EST-15 Japanese gap and the client-side demo seeding that would have broken the empty-install case. It also designed the missing-table repair that C-0078 needed, so the FEATURE needed no plan revision.
- Went well: keeping the old fixture's six items byte-for-byte (P7) kept every project e2e green after the demo data moved out of `db/client.ts`.
- Could improve: earlier locked suites (catalog-browsing C-0197/0198) were written against a temporary 3-dog fixture rather than the approved seed counts. Locked tests that depend on catalog contents should cite the seed's numbers.
- Could improve: C-0079's ambiguous locator would have been caught by running the locked browser spec once against the existing sign-in page when it was authored.
- Could improve: code review was self-review only.

## Compliance / Control Evidence

| Control                        | Evidence                                                  | Location                                                                                               | Status              | Exception                                                          |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------ |
| Work planned before execution  | change proposal, design, specs, tasks; FEATURE PLAN.md    | `openspec/changes/swhr2-i-0014-sample-data-population/`, `artifacts/SWHR2-S-0033/SWHR2-T-0321/PLAN.md` | Satisfied           | —                                                                  |
| Change verified before release | QA report with per-scenario verdicts                      | `artifacts/SWHR2-S-0033/qa-test-report.md`                                                             | Satisfied           | —                                                                  |
| Tests executed                 | platform red/green runs; QA unit, e2e and acceptance runs | `SWHR2-T-0321/tdd-test-result.md`, `integration-test-result.md`                                        | Partially satisfied | Locked C-0079 (locator) and C-0197/0198 (seed count) red, disputed |
| Browser E2E executed           | `20 passed`                                               | `artifacts/SWHR2-S-0033/integration-test-result.md`                                                    | Satisfied           | —                                                                  |
| Code reviewed before merge     | CODE-REVIEW line in ticket summary                        | `artifacts/SWHR2-S-0033/SWHR2-T-0321/summary.md`                                                       | Satisfied (self)    | No sub-agent or human reviewer                                     |
| Design conformance             | Not Applicable — no screen                                | —                                                                                                      | Not Applicable      | —                                                                  |
| Defects dispositioned          | resolution log, none found                                | `artifacts/SWHR2-S-0033/integration-defects-resolution.md`                                             | Satisfied           | —                                                                  |
| Release accepted               | Not Provided                                              | —                                                                                                      | Not Provided        | —                                                                  |
