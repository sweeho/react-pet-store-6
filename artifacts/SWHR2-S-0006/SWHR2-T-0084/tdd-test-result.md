# TDD result — SWHR2-T-0084

## Test cases

SWHR2-C-0277, C-0278, C-0279, cited in tests for EmptyFrame, ErrorFrame, LoadingFrame, useApi and the /users page.

## Notes

Platform-recorded runs (linked cases).

- Red: run bec4a327-8018-4926-a141-07ae4d78048d, valid. Two earlier red attempts were invalid: hooks/index.ts had been changed, and a test name matched the old hard-coded data. The third attempt hit a flaky reproduction, then recorded.
- Green: run 5be79553-abc7-4770-b66c-03118c17ffb2, valid.
  Cases already passing at red: none.
