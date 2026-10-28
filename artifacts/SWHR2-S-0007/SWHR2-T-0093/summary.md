# SWHR2-T-0093 summary

Built the shared locale model and the per-locale screen resolution (tasks 1.1-1.4).

- `shared/i18n/locale.ts`: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `parseLocale` (two-part code, `default` any case, no underscore -> null).
- `src/locales/`: `registry.ts` (named + default export), `resolveScreen.ts` (request locale over session, en_US fallback, "Definition for screen <name> not found"), `useScreen.tsx` (renders `ErrorFrame` on failure), `types.ts`, and en_US/ja_JP/zh_CN definitions for petstore-home, petstore-cart, petstore-signin, change-language, change-language-success, header.
- `services/locale.ts`: `requestLocale(event)`.
- `tsconfig.json` / `tsconfig.node.json`: added `shared` (and `services` on the node side).
- Tests: `shared/i18n/locale.test.ts`, `src/locales/resolveScreen.test.ts` (keys SWHR2-C-0023/24/25/35/36/37/38). Red and green recorded by the platform; none already passing.

Verification: typecheck, lint, test (51 passed), build all exit 0.

Deviations: the design mockups were not in the worktree and the export to disk did not write them, so no `design-check.md`. No page renders `useScreen` yet (pages belong to SWHR2-T-0095), so the not-found frame cannot be compared against SWHR2-MCK-7 here; the ErrorFrame title/message wiring is minimal and T-0095 should check it. Tests were added here (PLAN assigned them to T-0098) because the platform needs bracket-keyed tests in the default run; the acceptance files are excluded from it.

CODE-REVIEW: self-review — sub-agent not run; diff is small and read through for fallback order, null handling and unused code.
