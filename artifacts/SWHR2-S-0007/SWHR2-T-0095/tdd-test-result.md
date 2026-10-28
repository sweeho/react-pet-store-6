# TDD result: SWHR2-T-0095

## Notes

Judged on platform-recorded runs.

- Red run id: 43387574-cecd-425b-b950-8a1f594a8d9e (C-0020/21/22 stub_failure, C-0026/28 assertion_failure; C-0027 already passing)
- Green run id: c17a2102-3200-4352-aa9f-cb6fe08f0a61, re-run at the final head (see ticket comment)

Already passing at red: SWHR2-C-0027 (default en_US text existed in the placeholder page); it stays a regression guard.

Tests changed after red: `src/pages/petstore/locale.test.tsx` (queries changed from `findByText` to `findAllByText` because the current-language line and the confirmation both show the code) and `src/components/shell/GlobalNav.test.tsx` (Language now links to `/petstore/change-language`, SD5). No assertion was weakened.

The e2e-level cases are covered by jsdom tests with an in-memory fake of the session API, because the engineer container has no Chromium.
Local gate: `bun run typecheck`, `bun run lint`, `bun run test` (65 passed), `bun run build` all exit 0.
