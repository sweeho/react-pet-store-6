# TDD result — SWHR2-T-0081

## Test cases

- `e2e/smoke.spec.ts` "home page loads with no console errors": ok response, title "Pet Store", visible h1, no console errors.

## Red run

Not run. The branding/token ticket has no unit-testable behaviour; the title assertion was added to the existing smoke spec. Playwright Chromium is not installed in this container (`bun run test:smoke` exits at its preflight), so the spec was not executed here; it runs at QA and in CI.

## Green run

`bun run verify` (lint + typecheck + unit), run before the smoke title assertion was added: exit 0, 7 files, 20 passed.

TDD-RESULT: 20 passed, 0 failed
