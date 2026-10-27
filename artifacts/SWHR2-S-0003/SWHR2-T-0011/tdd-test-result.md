# TDD result — SWHR2-T-0011

## Notes

Platform-recorded runs (ticket has linked test cases):

- Red: run `9b855e7b-9f9c-4a62-a57c-79391a3d7067` (valid, stub failures for C-0273/74/75/76)
- Green: run `0e6403fc-65c3-4613-bd96-a1f2280544db` (valid, all cases pass)

The recorded command is vitest only, so the e2e cases are cited from `src/components/shell/shell-routes.test.tsx`; `e2e/shell.spec.ts` (Playwright) was added in the green commit because an uncited Playwright spec made the red run invalid.
Full gate `bun run verify`: lint, typecheck, 54 unit tests pass. `bun run test:e2e` not run: Chromium is not installed in this container.
