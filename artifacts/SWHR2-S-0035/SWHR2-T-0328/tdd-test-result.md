# TDD result — SWHR2-T-0328

## Notes

- Red run 144abbe3-b8ec-4346-a66f-2f9d87b60c02 (commit cee3367): C-0288 and C-0289 are cited by two vitest tests in `src/pages/admin/tool.test.tsx` (order stored COMPLETED shows in the non-pending view and not in the pending view after Refresh). Both already pass: the application behaviour was correct, so they are regression guards. The platform test command is vitest and does not run Playwright specs, which is why the cases are cited in vitest.
- The fix is in the Playwright spec `e2e/order-approval.spec.ts` (C-0243), which asserts the stable approved-or-completed outcome instead of the transient APPROVED. Real output: `--repeat-each=3` alone, 3 passed; full `bun run test:e2e` twice, 20 passed each.
- Green run id: recorded by the platform after this commit.
