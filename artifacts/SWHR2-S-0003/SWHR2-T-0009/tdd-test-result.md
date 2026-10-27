# TDD result — SWHR2-T-0009

## Test cases

`src/design-tokens.test.ts`: 8 token values, destructive-foreground differs, fonts Inter/JetBrains Mono.

## Red run

`bun run test` with index.css and fonts.config.ts stashed: 10 failed | 20 passed (30).

## Green run

`bun run verify` (lint + typecheck + unit): Test Files 8 passed, Tests 30 passed.
`bun run test:smoke` could not run: Chromium missing in this container (preflight). e2e/smoke.spec.ts already asserts ok response, h1 and no console errors; it is unchanged.

TDD-RESULT: 30 passed, 0 failed
