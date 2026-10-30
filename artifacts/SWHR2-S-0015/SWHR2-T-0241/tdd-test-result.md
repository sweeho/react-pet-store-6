---
artifact: tdd-test-result
spec: 1
status: escalated
author_role: validation
sprint: SWHR2-S-0015
ticket: SWHR2-T-0241
branch: vortex/test/SWHR2-T-0241-qa-rework-round-1-2-case-s-red-in-the-of-e0f58a17
---

# TDD result

## Test cases

SWHR2-C-0157 and SWHR2-C-0269 live in the locked acceptance suite (`tests/acceptance/`), unedited.

## Red run

`bunx playwright test --config playwright.acceptance.config.ts -g "C-0157|C-0269"`: 2 failed.

## Green run

Not reached; both cases disputed. C-0157 still fails (count read before async fill), C-0269 fails on a label collision with C-0147/C-0164.

TDD-RESULT: 0 passed, 2 failed
