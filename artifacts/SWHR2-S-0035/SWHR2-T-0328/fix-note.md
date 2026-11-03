# Fix note — SWHR2-T-0328

## Root cause

`e2e/order-approval.spec.ts` (SWHR2-C-0243) waited for the order to read APPROVED after commit. That status is transient: the in-process worker moves an in-stock order to COMPLETED within a few polls. Under a full parallel run the first refresh often already shows COMPLETED, so "APPROVED" never appears and the spec times out. The application is correct (design.md D1).

## Fix

After commit, refresh on the non-pending tab until the row matches APPROVED or COMPLETED, assert it is neither PENDING nor DENIED, then assert the row is absent from the Pending tab. Test retitled and tagged with SWHR2-C-0243, C-0288, C-0289 (design.md D2, D4).

## Files

- `e2e/order-approval.spec.ts`

CODE-REVIEW: self-review — single spec file, assertions only; sub-agent not run.
