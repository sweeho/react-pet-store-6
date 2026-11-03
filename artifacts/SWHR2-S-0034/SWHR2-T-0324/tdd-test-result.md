# TDD result — SWHR2-T-0324

## Notes

- Red run `5c853537-7263-4ab1-bfd0-95575ac0871d` (commit 2845b44): C-0283 to C-0287 all failed on assertions.
- Green run `df964427-7bb8-4375-ab5b-6f9118bcc929` (commit 28ebc26): all five pass.
- C-0284 and C-0287 are asserted in `GlobalNav.test.tsx` (jsdom) because the evidence command runs vitest only and does not report Playwright specs; an earlier `e2e/global-nav.spec.ts` was dropped for that reason.
- `bun run verify` is run before hand-off (see ticket comment).
