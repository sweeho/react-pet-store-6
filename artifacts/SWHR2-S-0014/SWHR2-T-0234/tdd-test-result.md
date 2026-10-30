# TDD test result — SWHR2-T-0234

## Test cases

SWHR2-C-0256, SWHR2-C-0258, SWHR2-C-0269 in the locked `tests/acceptance/sign-on/e2e/sign-on.spec.ts`. They are not edited; no new tests were written.

## Red run

`bunx playwright test --config playwright.acceptance.config.ts tests/acceptance/sign-on` (QA run earlier): C-0256, C-0258, C-0269 failed, with the causes in `integration-defects-resolution.md`.

## Green run

None: the three cases are disputed, because the tests, not the app, are wrong. No green was recorded.

TDD-RESULT: 0 passed, 3 failed
