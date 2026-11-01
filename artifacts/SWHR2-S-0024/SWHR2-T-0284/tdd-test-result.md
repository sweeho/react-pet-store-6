# TDD result SWHR2-T-0284

## Test cases

All 22 linked cases (C-0089, C-0090, C-0101, C-0174, C-0212 to C-0227, C-0252, C-0254), cited by key in the carried-over colocated tests, `e2e/checkout.spec.ts` and the locked acceptance suite.

## Notes

- Red commit ce0d6de / bee08b9 (`[tdd:red]`): tests from 41e1140 plus sentinel stubs. Red run 35c56bde was recorded invalid: DB-backed cases ended in error because the schema and migration cannot be stubbed, and e2e/checkout.spec.ts needs e2e/global-setup.ts at load.
- Green commit e3c51b4 (`[tdd:green]`): production code carried over from 41e1140 unchanged. Green run 0d409a65 is valid; all 22 cases pass, including the e2e cases.
- Local `bun run verify`: lint, typecheck, 69 files / 281 tests passed.
