## Test cases

- `src/pages/index.test.tsx`: landing page renders heading, header and footer inside the shell; every primary area is linked from the page and from the global navigation; Home links to `/` (SWHR2-R-0288.01, R-0289.01, R-0290.01).
- `e2e/home.spec.ts`: root route shows the landing page, navigation and a link per primary area (Playwright; not executable here, no browser).

## Red run

The previous `index.test.tsx` and `home.spec.ts` asserted the old boilerplate hero; the new tests were written against the new page before the page existed and would fail on the old hero. A separate red run was not recorded (ticket has no linked test cases).

## Green run

`bun run verify` (lint + typecheck + unit): 7 test files, 18 tests, all passed.

## Notes

`bun run verify:full` fails at the E2E preflight: no Chromium in this container.

TDD-RESULT: 18 passed, 0 failed
