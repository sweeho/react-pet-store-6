# TDD test result — SWHR2-T-0234

## Test cases

SWHR2-C-0256, SWHR2-C-0258, SWHR2-C-0269 in the locked `tests/acceptance/sign-on/e2e/sign-on.spec.ts`. They are not edited; no new tests were written.

## Red run

`bunx playwright test --config playwright.acceptance.config.ts tests/acceptance/sign-on` (QA run earlier): C-0256, C-0258, C-0269 failed, with the causes in `integration-defects-resolution.md`.

Platform red/green cover the unit tests citing these keys (all pass, already passing). Browser run of C-0256 after the fix: `--repeat-each=20` gives `20 passed`. C-0258 and C-0269 remain red in the browser (locked-test faults).

TDD-RESULT: 1 passed, 2 failed
