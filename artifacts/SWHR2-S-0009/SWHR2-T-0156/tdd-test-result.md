## Test cases

SWHR2-C-0178, C-0179, C-0180, C-0181, C-0182, C-0208, C-0209 in `services/catalog/search.test.ts`, plus unkeyed tests for locale scoping, one row per item and literal `%`/`_`.

## Red run

978b11a4-54de-4a78-8de4-724e497dda70 (commit 35daa0e): all seven cases fail on the stub. An earlier attempt (64f7502d) was invalid because the red commit touched `services/catalog/index.ts`; I reverted that.

## Green run

8e2dad70-779b-4393-9dcd-4041f91bbb8d (commit 3949df4): all seven pass. `bun run verify`: 118 tests passed.

## Notes

`search.test.ts` changed after red only in its import path (`./search` to `./index`); `queries.test.ts` line for C-0210 now reads `.items`.
