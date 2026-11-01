# TDD result SWHR2-T-0284

## Test cases

All 22 linked cases (C-0089, C-0090, C-0101, C-0174, C-0212 to C-0227, C-0252, C-0254), cited by key in the carried-over colocated tests, `e2e/checkout.spec.ts` and the locked acceptance suite.

## Notes

- Red commit 831a7ad (`[tdd:red]`): tests from 41e1140 plus sentinel stubs; route stubs are plain functions that throw the sentinel (the earlier stubs called an undefined defineEventHandler and errored). Red run 2d3c33c8: every vitest case fails on an assertion or the stub; e2e specs could not be loaded locally (no Chromium).
- Green commit f14a3ae (`[tdd:green]`): production code carried over from 41e1140 unchanged. Green run ec1ab6c1 is valid; all 22 cases pass.
- Local `bun run verify`: lint, typecheck, 69 files / 281 tests passed.
