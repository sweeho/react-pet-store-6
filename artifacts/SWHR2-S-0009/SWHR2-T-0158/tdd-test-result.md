## Test cases

SWHR2-C-0197, C-0198 (`src/pages/petstore/category/[categoryId].test.tsx`), C-0199, C-0200 (`src/pages/petstore/item/[itemId].test.tsx`), C-0201 (`CategoryPanel.test.tsx`, `src/pages/petstore.test.tsx`), C-0202 (`CategoryPanel.test.tsx`). The locked acceptance tests (`tests/acceptance/catalog-browsing/`) carry the keys without brackets and are not run by the platform's unit command, so these unit tests cite the cases. Further unkeyed tests cover PetMap, the product page and the search page.

## Red run

9bb8ecf5-f1c5-4576-9256-250636420f7f (commit 827b5f9): all six cases fail on stubs (C-0201 also on an assertion). An earlier attempt (9cd68a79) was invalid because no test cited the keys.

## Green run

0af56c9b-b74d-4d9e-9bb4-ea6999b15fce (commit c37870d): all six pass. `bun run verify`: 42 files, 141 tests passed; `bun run build` passed.

## Notes

E2E (`e2e/`, `tests/acceptance/**/e2e`) was not run: Chromium is not installed in this container.
