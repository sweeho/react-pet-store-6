---
artifact: qa-test-report
sprint: SWHR2-S-0033
ticket: SWHR2-T-0322
author: validation
---

# QA Test Report — SWHR2-S-0033 (SWHR2-I-0014 Sample data population)

## Executive Summary

All 12 acceptance criteria / 9 scenarios of the sprint pass. Sprint-owned verification ran green: `bun run verify` (lint, typecheck, 427 unit tests), `bun run build`, `bun run test:e2e` (20 passed) and the locked data-population suite (11 passed). No defects found. Locked acceptance failures in other capabilities are listed as warnings (acceptance enforced only at UAT). The feature has no screen; behaviour was verified through the seed script, the unit tests and the locked acceptance tests.

## E2E Test Status

Project E2E: `bun run test:e2e` → `20 passed (11.8s)`, 0 failed, 0 skipped. Detail in `integration-test-result.md`.

Locked acceptance suite (warnings only, triaged at UAT, not fixed here):

- `bun run test:acceptance` (vitest): 7 failed, 214 passed. Failures: SWHR2-C-0049, 0055, 0056, 0061, 0062, 0067 (customer-notifications) and SWHR2-C-0264 (sign-on). None belong to data-population (its 11 tests pass).
- `bun run test:acceptance:e2e` (Playwright): 8 failed, 58 passed. Failures include SWHR2-C-0079 (data-population: `getByLabel(/^password:?$/i)` on `/petstore/signin` matches two inputs, the sign-in and the new-customer form, strict-mode violation, a locator ambiguity in the locked test; the earlier steps of the test, /petstore, /supplier and /admin, passed), SWHR2-C-0021, 0026, 0028, 0039 (localization) and others in customer-account/sign-on lists. Warning only.

SCENARIO-VERDICT: List all customers / Customers exist — pass
SCENARIO-VERDICT: List all customers / No customers — pass
SCENARIO-VERDICT: Single editable seed data set / First load into an empty datastore — pass
SCENARIO-VERDICT: Single editable seed data set / Operator edits the seed data — pass
SCENARIO-VERDICT: Contact information linked to an existing address / Seeding a sample customer's contact details — pass
SCENARIO-VERDICT: Supplier seed inventory content / Seeded supplier stock — pass
SCENARIO-VERDICT: Supplier seed inventory content / Seed entry without a quantity — pass
SCENARIO-VERDICT: Storefront seed data content / Seeded storefront contents — pass
SCENARIO-VERDICT: Sample account replacement by id / Sample account reset — pass
SCENARIO-VERDICT: Separate datastores per application area / Fresh installation — pass
SCENARIO-VERDICT: Separate datastores per application area / Installation over an existing datastore — pass
SCENARIO-VERDICT: Installation sequence / Installation completes — pass (the unit/acceptance part passes; locked Playwright SWHR2-C-0079 fails only on an ambiguous password locator after the area checks succeeded, and the seeded j2ee sign-in is covered by the passing project E2E `account.spec.ts`)

## Regression guards

- SWHR2-C-0068 (listing all customers returns j2ee and shopper): working; passes in `tests/acceptance/data-population/population.test.ts`.
- SWHR2-C-0069 (listing customers with none on file returns an empty list): working; passes in the same file.

## Unit Test Results

Command: `bun run verify` (exit 0). Output tail: `Test Files  90 passed (90)`, `Tests  427 passed (427)`. Lint and `tsc --build` clean. `bun run build` exit 0.

## Code Review

Not a line-by-line review of merged tickets. Inspection of the ticket SWHR2-T-0321 summary shows the seed moved into one editable file loaded by `bun run db:seed`, with `db/client.ts` no longer inserting data. Behaviour confirmed by the passing tests above.

## Coverage Summary

No coverage run was executed (no coverage command is declared); no coverage figure is claimed.

## Issues Found

No defects in sprint-owned behaviour. Warnings: the locked acceptance failures listed under E2E Test Status. SWHR2-C-0079's failure looks like a locator problem in the locked test; it was not edited. No DEFECT tickets filed.

## Recommendation

Proceed: fire `validation.all_acs_passed`. Triage the locked-acceptance warnings (notably the SWHR2-C-0079 locator) at UAT.
