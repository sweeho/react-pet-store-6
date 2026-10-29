## Test cases

SWHR2-C-0193, C-0194, C-0195, C-0196, C-0203, C-0210, C-0211, C-0280, C-0281, C-0282 in `services/catalog/queries.test.ts` and `services/catalog/data-access.test.ts`.

## Red run

dfa9e957-7f28-4746-a687-e89aeb6840df (commit f855556): all ten cases fail on the stub.

## Green run

f6e09ae7-4d01-4ad0-a9b5-5d173213210a (commit aabf5f5): all ten cases pass. `bun run verify`: 29 files, 104 tests passed.

## Notes

Ported from 8bca9b8 (tests) and 705ad6e (implementation) of cancelled SWHR2-T-0143 by checking out the files, not cherry-picking, so commits carry this ticket's run trailers.
