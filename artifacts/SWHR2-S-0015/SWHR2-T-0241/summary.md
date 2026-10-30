---
artifact: summary
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0015
ticket: SWHR2-T-0241
branch: vortex/test/SWHR2-T-0241-qa-rework-round-1-2-case-s-red-in-the-of-e0f58a17
---

# SWHR2-T-0241 summary

Rework round 1 for C-0157 and C-0269. Both are disputed rather than made green; causes and evidence are in `artifacts/SWHR2-S-0015/integration-defects-resolution.md`.

Changed: `src/components/storefront/MyListPanel.tsx` (footer link outside the panel, single request), `routes/api/account/my-list.get.ts` (200 empty list when signed out) with tests, `e2e/account.spec.ts` (no reliance on j2ee defaults).

Verification: `bun run verify` 205 passed; `bun run test:e2e` 14 to 15 passed, one non-reproduced failure in 4 runs of `e2e/account.spec.ts` sign-up test; acceptance runs of C-0157 and C-0269 still fail (8/8 and 1/1) for the reasons disputed.
