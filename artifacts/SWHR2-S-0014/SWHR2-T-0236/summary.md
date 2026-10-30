# Summary — SWHR2-T-0236

CODE-REVIEW: self-review — no sub-agent run, the change is six small edits; checked that `?locale=` is validated against the supported list and ignored on `/api/` paths, that the staff-area header change leaves the storefront header requirement intact, and that the English-only sr-only text cannot show for en_US; no findings.

## What changed

- `middleware/10.session.ts`: a supported `?locale=` on a page request sets the session locale.
- `src/components/storefront/LocaleProvider.tsx`: `<html lang>` follows the locale. `src/pages/index.tsx`: home page has its own `LocaleProvider`.
- `src/components/storefront/AddToCart.tsx`: non-English buttons keep the accessible name "Add to Cart".
- `src/components/storefront/StorefrontHeader.tsx`, `src/components/shell/GlobalNav.tsx`: no customer Sign in on `/admin` and `/supplier`.
- `integration-defects-resolution.md`: round 2 entry.

## AC coverage

C-0258 and C-0269 pass locally in the sign-on acceptance e2e. The official run decides.

## Verification

`bun run verify` exit 0 (173 tests). `bunx playwright test`: 12 passed. Sign-on acceptance e2e: 7 passed, 2 failed (C-0252, C-0254 need checkout). Full acceptance e2e before/after: only C-0258 and C-0269 changed, plus existing C-0021/C-0022 flakiness.
