## Notes

Platform-recorded runs (ticket SWHR2-T-0308):

- Red run id: 186d4983-9721-45eb-ac15-c12cc9fde70c (commit 524e4f2). Cases already passing at red: C-0106, 0107, 0118, 0123, 0132, 0135, 0137, 0263, 0264.
- Green run id: b1052da7-c80e-4e82-8fe0-d4a422393587 (commit b89a100). All linked cases pass in own tests.
- Locked acceptance: all pass except SWHR2-C-0264 (5 s timeout inside `shopper()` setup, reproduced on the base commit too); disputed as a test fault, finding 30e616a5.
- The test files were edited after red only to change the harness import to `services/orders/fulfilmentHarness.ts` (typecheck cannot include `tests/acceptance` files) and one `as unknown as` cast. No assertion changed.
- Full gate `bun run verify`: lint, typecheck, 81 files / 368 tests passed.
