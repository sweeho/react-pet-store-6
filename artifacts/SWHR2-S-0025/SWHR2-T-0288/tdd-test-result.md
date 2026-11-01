---
ticket: SWHR2-T-0288
sprint: SWHR2-S-0025
---

# TDD result

## Notes

Linked cases have platform-recorded runs; no marker is needed.

- Red run: `c20abdb3-0e93-42b3-89ee-2cf0e489bcf4` at `ba715df` (tests plus throwing stubs). SWHR2-C-0214 and SWHR2-C-0225 already passed (the stub throws, which those cases expect).
- Green run: `1fb104ec-f20e-4c05-8bbe-762037ac0d51` at `3fb31f8`; a later green is recorded at the final commit.
- Full gate `bun run verify` (eslint, tsc, vitest): 70 files, 287 tests passed.

## Test cases

Unit, route integration and UI tests cite SWHR2-C-0089 … 0254 in their titles (ids, codec, receive, delivery, orders and checkout routes, checkout/order-placed/error pages).

## Red run

Every citing test failed on an assertion or the `VortexNotImplemented` stub.

## Green run

All citing tests pass. Locked unit/integration acceptance tests pass (C-0090, 0212–0214, 0217–0227). Browser acceptance was run locally with a Chromium 1223 symlinked as 1155: checkout spec (locked and newer f24b0af) 6/6 pass; the older locked 0174, 0101, 0254 expect a Continue-then-Confirm flow and fail (see summary).
