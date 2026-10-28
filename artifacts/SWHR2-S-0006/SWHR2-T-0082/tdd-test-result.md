# TDD result — SWHR2-T-0082

## Test cases

- SWHR2-C-0270, 0271, 0272: cited by unit tests in `src/pages/index.test.tsx` (heading, one link per area route, Staff sign-in marker). The e2e originals in `tests/acceptance/site-shell/e2e/` are not run here (no Chromium).

## Notes

- Red run id: f0e3e53f-0018-4a2c-b979-4d6da06aa241 (valid, assertion failures for all three cases).
- Green run id: see the final green run recorded at the pushed head (first green: 3e9c555f-2976-4059-a610-55acdc82742e).
- `bun run verify` (lint + typecheck + unit): exit 0, 14 files, 44 tests passed.
