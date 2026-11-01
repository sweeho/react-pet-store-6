# Summary SWHR2-T-0286

- Reverted the Order placed title from `h1` to `p` (`src/pages/petstore/order-placed.tsx`), removed its unit test, and made `e2e/checkout.spec.ts` find the title by text. Fixes C-0101 (strict-mode double heading match).
- C-0215: locked test races its own sign-in navigation; needs a test dispute. C-0255/C-0256: need supplier inventory (SWHR2-I-0010); need deferral. Details in `integration-defects-resolution.md`.
- Verification: `bun run verify` and local Playwright runs, see the ticket comment.
