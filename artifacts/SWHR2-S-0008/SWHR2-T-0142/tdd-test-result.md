## Test cases

SWHR2-C-0191, C-0192, C-0204, C-0205 in `services/catalog-schema.test.ts`, plus unkeyed tests for AC "over-long id rejected", "ten-character id accepted" and item details with an unknown item.

## Red run

Run 1913d573-0c98-4152-b8a4-7f19b7a45933 (commit 97c4228): C-0191 assertion failure (foreign keys not enforced). C-0192, C-0204, C-0205 already passed (columns were already NOT NULL / primary key); regression guards.

## Green run

Run 33bf6e34-c91f-4a20-8c41-dbbe7f968ef2 (commit c07012e): all four cases pass. Full gate `bun run verify`: 27 files, 93 tests passed.

## Notes
