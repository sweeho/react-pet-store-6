# Summary — SWHR2-T-0234

CODE-REVIEW: self-review — no sub-agent run, the diff is two config hashes and a warm-up loop; checked that the warm-up posts only rejected credentials (no session change) and that cheap hashes are confined to the Playwright web-server env, not product code; no findings.

## What changed

- `playwright.config.ts`, `playwright.acceptance.config.ts`: test-only admin and supplier password hashes use cheap argon2id parameters (m=8, t=1). Credentials unchanged.
- `e2e/global-setup.ts`: warms /admin, /supplier and their sign-in routes (rejected credentials, no session change).
- `integration-defects-resolution.md`: round 1 entry.

## AC coverage

- C-0256: met locally (20/20 repeats; was failing). The Business Owner kept the case, so the cause was the sign-in response racing the test's navigation.
- C-0258, C-0269: not met. Both are faults in the locked test (3-link strict-mode match; unsupported `?locale=`), still under dispute; no decision recorded for them yet.

## Verification

`bun run verify` exit 0 (173 tests). `playwright test`: 12 passed. Sign-on acceptance e2e: 5 passed, 4 failed (C-0252, C-0254 need checkout; C-0258, C-0269 as above).
