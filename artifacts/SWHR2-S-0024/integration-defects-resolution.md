---
artifact: integration-defects-resolution
spec: 1
status: complete
author_role: validation
sprint: SWHR2-S-0024
ticket: SWHR2-T-0285
capability brief: SWHR2-I-0008
branch: vortex/sprint/swhr2-s-0024-d5762589
upstream: [artifacts/SWHR2-S-0024/SWHR2-T-0284/summary.md]
downstream: [artifacts/SWHR2-S-0024/qa-test-report.md]
---

# Integration defects resolution — SWHR2-S-0024

## DEFECT-1: Order Placed page title is not a heading

- Severity: minor
- Violated scenario: none; this is a mockup/E2E-spec mismatch. SPEC-GAP: the Order Placed title element is not covered by a written scenario (mockup `SWHR2-MCK-25` uses `<h1>Order placed</h1>`).
- Found by: `e2e/checkout.spec.ts:28` (SWHR2-C-0101, C-0254): `getByRole('heading', { name: /order placed/i })` not found. Re-run twice in isolation, failed both times.
- Cause: `src/pages/petstore/order-placed.tsx` rendered the title as `<p>`.
- Round 1: red commit `5ff11c3` adds a unit test for an `h1` named "Order placed" (fails). Green commit `56b6f5f` changes the `<p>` to `<h1>`. Result: `bun run verify` passes (69 files, 282 tests); `checkout.spec.ts` C-0101 passes; full E2E `22 passed`.
- Resolution: FIXED-IN-PLACE.

## Summary

| Defect   | Severity | Resolution     |
| -------- | -------- | -------------- |
| DEFECT-1 | minor    | FIXED-IN-PLACE |

INTEGRATION_DEFECTS_RESOLUTION: COMPLETE
