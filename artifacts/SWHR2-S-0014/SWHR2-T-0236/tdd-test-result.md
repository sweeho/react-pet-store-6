# TDD test result — SWHR2-T-0236

## Test cases

SWHR2-C-0258 and SWHR2-C-0269 in the locked `tests/acceptance/sign-on/e2e/sign-on.spec.ts` (not edited), plus the unit tests that cite them.

## Red run

Platform red (run a1c0752e): the cited unit tests already pass; the browser tests were red before the change (`PLAYWRIGHT_BROWSERS_PATH=/tmp/pw bunx playwright test --config playwright.acceptance.config.ts tests/acceptance/sign-on`: C-0258 strict-mode violation on 3 links, C-0269 no Japanese after `?locale=`).

## Green run

Same command after the change: C-0258 and C-0269 pass (`7 passed`; C-0252 and C-0254 still fail, they need checkout from SWHR2-I-0008). `bun run verify`: 173 tests pass. `playwright test`: 12 passed.

TDD-RESULT: 2 passed, 0 failed
