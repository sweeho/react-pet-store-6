# SWHR2-T-0094 summary

- Added `middleware/00.encoding.ts` (runs before `10.session.ts` by file-name order). For form-urlencoded, multipart and text bodies with no charset it replaces `event.req` with a Request whose content-type carries `charset=utf-8`; when given `next` it appends `charset=utf-8` to text/\* and JSON responses lacking one. Query strings are already decoded as UTF-8 by the URL parser.
- Added `routes/api/encoding.test.ts` (5 tests) citing C-0031, C-0032, C-0039, C-0040. It lives under `routes/` so the `server` Vitest project runs it; T-0098 widens that project.
- AC-1..AC-4 proved for the middleware in isolation only. The acceptance tests in `tests/acceptance/localization/server.test.ts` need sign-on/register/search routes (SD1) and are expected to stay red.
- Verification: `bun run lint`, `bun run typecheck`, `bun run test` all exit 0 (49 tests).

CODE-REVIEW: self-review — small single-file diff; checked that an explicit charset is untouched and non-text bodies are not rewritten.
