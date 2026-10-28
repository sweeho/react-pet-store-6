## Test cases

- `src/pages/index.test.tsx`: landing heading [SWHR2-C-0270]; one link per primary area route; shell navigation links every area and Home.
- `e2e/home.spec.ts`: root route shows landing page and links (not run, no Chromium).
- Locked acceptance `tests/acceptance/site-shell/shell.test.tsx` (landing page, app shell): 2 passed, 3 skipped by -t filter.

## Red run

Not recorded by me; the branch started from `dev` where `/` was the boilerplate hero, so the new tests could not pass before the change.

## Green run

`bun run verify` (lint + typecheck + unit): 19 tests passed.

## Notes

`bun run verify:full` not run, no Chromium in the container.

TDD-RESULT: 19 passed, 0 failed
