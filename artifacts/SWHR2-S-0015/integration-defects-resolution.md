---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0015
capability brief: SWHR2-I-0006
branch: vortex/test/SWHR2-T-0240-integration-qa-report-swhr2-s-0015-d9094931
upstream: [artifacts/SWHR2-S-0015/integration-test-result.md]
downstream: [artifacts/SWHR2-S-0015/qa-test-report.md]
---

# Integration defects resolution — SWHR2-S-0015

## DEFECT-1: anonymous Home load logs a 401 console error

- Covering scenario: My List panel for the favourite category / MyList preference off (and e2e/smoke.spec.ts "home page loads with no console errors").
- Failure: `MyListPanel` called `/api/account/my-list` on every load; anonymous visitors got 401, which smoke.spec.ts reports as a console error.
- Round 1: red `ca20270` (unit test: no my-list request when session is not signed on), green `00c4a0b` (panel reads `/api/session` first). `bun run verify` 205 passed; smoke passes. FIXED.

## DEFECT-2: My List panel empty right after sign-up or sign-in until reload

- Covering scenario: My List panel for the favourite category / MyList preference on; Account creation before purchase / First-time visitor signs up.
- Failure: the panel lives in the `/petstore` layout and fetched only on mount, so after the client-side navigation from the account form to Home it stayed empty. Found by new `e2e/account.spec.ts`.
- Round 1: red `e535b3f` (e2e fails at `my-list` visible), green `a37ec6b` (effect re-runs on `pathname` change). Full e2e 15 passed. FIXED.

## Summary

| Defect   | Status | Rounds | Future-sprint DEFECT |
| -------- | ------ | ------ | -------------------- |
| DEFECT-1 | FIXED  | 1      | —                    |
| DEFECT-2 | FIXED  | 1      | —                    |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
