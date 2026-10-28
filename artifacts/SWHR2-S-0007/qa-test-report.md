---
artifact: qa-test-report
sprint: SWHR2-S-0007
ticket: SWHR2-T-0103
author: validation
---

# QA test report — SWHR2-S-0007 (SWHR2-I-0003 Localization)

## Executive Summary

All 24 delta-spec scenarios hold on the integrated sprint branch. Lint, typecheck, unit (86/86) and Playwright E2E (10/10, 0 skipped) pass. Two E2E specs in `e2e/localization.spec.ts` raced the client-side session-locale fetch (they read `innerText()` right after `page.goto`, before `LocaleProvider` applied the session locale) and failed intermittently; fixed in place by switching to auto-retrying `toContainText` assertions (defect D1). Three consecutive full E2E runs after the fix were green. Mockup fidelity was not compared pixel-wise (see Code Review).

## E2E Test Status

Executed `bunx playwright test --project=chromium` (Chromium 1223 symlinked as the expected 1155 via `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw`, because the container's browser build differs from the one Playwright 1.50 expects; no repo change). Final summary: `10 passed (3.7s)`, 0 failed, 0 skipped. Details in `integration-test-result.md`.

## Unit Test Results

`bun run test` → `Test Files  26 passed (26)`, `Tests  86 passed (86)`. `bun run lint` exit 0, `bun run typecheck` exit 0, `bun run build` exit 0.

## Code Review

Reviewed the session middleware, `LocaleProvider`, `/api/session*` routes and the localization specs. Observation: `LocaleProvider` starts at en_US and fetches the session locale after mount, so a full page load in ja/zh briefly renders English before switching (cause of D1). Not a scenario violation; left as is. Mockup HTML files were absent from the worktree and the ticket `design-check.md` files record the known differences; I did not render paired screenshots.

## Coverage Summary

No coverage tool is declared for this project and none was run; no coverage figure is claimed. Scenario-to-test mapping was made by test titles citing `SWHR2-C-00NN` case keys (unit/route/component tests) plus the five localization E2E specs.

## Issues Found

- D1 (fixed in place): E2E specs "activating the Japanese flag…", "selecting Japanese and submitting Change Locale…" and "storefront screens render localized text…" failed intermittently on a race with the client session-locale fetch. Fix: auto-retrying assertions. See `integration-defects-resolution.md`.
- No SPEC-GAP found.
- Design: the Cancel button and "What changes when you switch" card from the mockup are not built (per T-0095 design-check.md), and the header flags show EN/JA/ZH rather than the written language names.

SCENARIO-VERDICT: Supported storefront locales and header language switch / Each supported locale has a full screen set — pass
SCENARIO-VERDICT: Supported storefront locales and header language switch / Default locale — pass
SCENARIO-VERDICT: Supported storefront locales and header language switch / Shopper switches to Japanese from the header — pass
SCENARIO-VERDICT: Locale change applies to session and cart / Locale changed with items in the cart — pass
SCENARIO-VERDICT: Locale code interpretation / Two-part code — pass
SCENARIO-VERDICT: Locale code interpretation / The word default — pass
SCENARIO-VERDICT: Locale code interpretation / Code without an underscore — pass
SCENARIO-VERDICT: Page locale resolution and fallback / Request locale overrides session locale — pass
SCENARIO-VERDICT: Page locale resolution and fallback / Locale without screen definitions — pass
SCENARIO-VERDICT: Page locale resolution and fallback / Screen missing from the chosen locale — pass
SCENARIO-VERDICT: Page locale resolution and fallback / Screen missing everywhere — pass
SCENARIO-VERDICT: Locale-aware money and number formatting / Money formatted to two places — pass
SCENARIO-VERDICT: Locale-aware money and number formatting / Number formatted to zero places — pass
SCENARIO-VERDICT: Locale-aware formatting and keyword splitting / Search phrase split into words — pass
SCENARIO-VERDICT: Locale-aware formatting and keyword splitting / Money formatted to a fixed precision — pass
SCENARIO-VERDICT: Change-language screen / The screen is displayed — pass
SCENARIO-VERDICT: Change-language screen / A locale is selected and submitted — pass
SCENARIO-VERDICT: Catalog shown in the shopper's locale / Same item in two locales — pass
SCENARIO-VERDICT: Catalog shown in the shopper's locale / Shopper in English — pass
SCENARIO-VERDICT: UTF-8 interpretation of submitted text / Japanese text submitted in a form — pass
SCENARIO-VERDICT: UTF-8 interpretation of submitted text / Chinese text in a query parameter — pass
SCENARIO-VERDICT: Encoding established before sign-on / Non-ASCII credentials at sign-on — pass
SCENARIO-VERDICT: Encoding established before sign-on / Non-ASCII form after sign-on — pass
SCENARIO-VERDICT: Cart lines follow the cart locale / New cart with no locale — pass
SCENARIO-VERDICT: Cart lines follow the cart locale / Cart with a locale — pass

## Recommendation

Approve. Every scenario passes, the gates are green and the one defect found was fixed in place. Not asserted: mockup pixel fidelity and test coverage percentage (not measured).
