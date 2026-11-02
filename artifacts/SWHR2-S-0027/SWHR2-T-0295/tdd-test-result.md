# TDD result — SWHR2-T-0295

## Notes

Linked cases C-0228 to C-0250 are judged by the platform's recorded runs.

- Red run: `ef6b36d5-f85f-4367-a898-ff80635c55ee` (commit 9c0c78d), valid; every case failed on an assertion or on a stub.
- Green run: `2e1b5063-2a19-4171-9588-39bbf12f9a99` (commit 9ad622c), valid; all 23 cases pass.
- Locked acceptance at that green: all order-approval cases passed except C-0241 (the two charts must share one date range). Fixed in a later commit. Locally, `playwright test --config playwright.acceptance.config.ts` gives 52 passed and 14 failed; the 14 are other capabilities' specs (localization, supplier inventory, sales-reporting, sign-on supplier flows, customer-account C-0157, data-population C-0079), none of them order-approval.
