# TDD result — SWHR2-T-0317

## Test cases

SWHR2-C-0001…C-0015, cited in `routes/api/admin/orders/orders.test.ts`, `services/orders/sales.test.ts`, `src/components/admin/OrderTable.test.tsx`, `src/pages/admin/tool.test.tsx`.

## Red run

Platform run 9d4b93a7-f8a9-4e9a-a4a6-9feee6d35e7a (valid). C-0002 and C-0004 already passed (existing behaviour); the others failed on an assertion or the OrderTable stub.

## Green run

Platform run ad64702a-f0a2-448f-9708-3ef071a87c8a (valid), locked acceptance run a0b30ec2-2c4e-4669-bed8-482eca8b25b7 passed for all 15 cases.

## Notes

`bun run verify`: 86 files, 414 tests passed. `bun run test:e2e`: 20 passed.
