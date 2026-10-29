## Test cases

SWHR2-C-0193..0196, C-0203, C-0210, C-0211 in `services/catalog/queries.test.ts`; SWHR2-C-0280..0282 in `services/catalog/data-access.test.ts`.

## Red run

Platform red run 5393b496-684b-421c-af0b-c36467e6fc5b at 8bca9b8: all 10 cases `stub_failure`.

## Green run

Recorded by the platform via `a2a_run_tests(phase: "green")`. Local `bun run verify` (lint, typecheck, vitest): 29 files, 104 tests passed.

## Notes

The locked acceptance cases C-0183 and C-0185 in `tests/acceptance/catalog-browsing/reads.test.ts` still fail: they call the `/api/catalog` list route, which is the Catalog API ticket's.
