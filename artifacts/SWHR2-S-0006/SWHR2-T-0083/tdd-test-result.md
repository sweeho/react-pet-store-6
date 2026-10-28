# TDD result — SWHR2-T-0083

## Test cases

- SWHR2-C-0273 / 0274 / 0276: cited by `GlobalNav.test.tsx` and `AppShell.test.tsx` (unit proxies; the e2e originals in `tests/acceptance/site-shell/e2e/` are not run in this container, no Chromium).
- SWHR2-C-0275: `AppShell.test.tsx` and the locked `tests/acceptance/site-shell/shell.test.tsx`.

## Notes

- Red run id: 3bdb6f4b-8ec2-4b9e-b597-217474917215 (valid, stub failures for all four cases).
- Green run id: d02c36a2-30ad-4e75-8f5b-917657da9a89 (valid, all four cases pass).
- `bun run verify` (lint + typecheck + unit): exit 0, 9 files, 26 tests passed.
