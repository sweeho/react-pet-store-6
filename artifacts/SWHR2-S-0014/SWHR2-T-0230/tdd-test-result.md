# TDD result — SWHR2-T-0230

## Notes

- Red run (platform-recorded, valid): `6866dfed-f410-4106-9875-63ea4c9724db` at `06c5fdb`. All 13 linked cases failed on an assertion or on a stub.
- Green run (platform-recorded, valid): `bd0019e2-9c69-4c68-82e2-98be08d95eae` at `21e9d9b`. All 13 linked cases pass.
- Two earlier red attempts were invalid: production code (schema, migration, page edits) sat in the red commit, and an e2e spec citing case keys was outside the vitest report. Both were removed from the red commit.
- Tests changed after red: `src/pages/petstore/signed-out.test.tsx` (the Japanese link query matched both links, now `getAllByRole`) and `src/components/shell/GlobalNav.test.tsx` (the Account & profile entry now points at `/petstore/account`). No assertion was weakened.
- Full gate on the green commit: `bun run lint`, `bun run typecheck`, `bun run test` (50 files, 173 tests) all pass. `bun run test:e2e` could not run: Chromium is not installed in this container.
- Acceptance suite `tests/acceptance/sign-on/` (`bun run test:acceptance`): `session.test.ts` and `header.test.tsx` pass; `internal.test.ts` (C-0263, C-0264, C-0268) is deferred to SWHR2-I-0011.
