# TDD result: SWHR2-T-0097

## Test cases

`routes/api/catalog/items/item.test.ts` cites SWHR2-C-0029, C-0030 (item route in ja_JP / en_US) and C-0033, C-0034 (cart lines with no locale / ja_JP).

## Red run

Platform run 9152f63a-41df-40d7-b0bf-b45dcac8db87: valid, all four cases failed on the sentinel stubs. The red tests create the catalog tables themselves (`create table if not exists`) because schema and migration are production code and could not precede red.

## Green run

Platform run ff449470-4cf2-45a3-8e7f-5ae5f2f9528d: valid, all four cases pass. Local gate: lint, typecheck, `bun run test` (22 files, 78 tests) exit 0.

## Notes

The acceptance suite `tests/acceptance/localization/server.test.ts` also needs the sign-on and shopping-cart harnesses (SD1) and was not run.
