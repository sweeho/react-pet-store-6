# SWHR2-T-0098 summary

Verification tests for the localization change.

- `vitest.config.ts`: server project now includes `middleware/**` and `services/**` tests; client project excludes them.
- New: `shared/i18n/words.test.ts`, `src/components/storefront/LanguageFlags.test.tsx`, `services/{catalog,cart}.test.ts`, `e2e/localization.spec.ts`.
- Moved to planned names: `routes/api/encoding.test.ts` to `middleware/00.encoding.test.ts` (plus ordering-before-session test), `routes/api/session/session.test.ts` to `locale.post.test.ts`, `routes/api/catalog/items/item.test.ts` to `[itemId].get.test.ts` (cart cases moved to `services/cart.test.ts`).
- Already present from earlier tickets: `locale.test.ts`, `format.test.ts`, `resolveScreen.test.ts`, `change-language.test.tsx`, `locale.test.tsx`.
- Deviation: `e2e/localization.spec.ts` titles carry no case keys; the cases are cited by the vitest UI tests, and a keyed spec the vitest report cannot contain invalidated the red run.
- Not built (SD1, no sign-on/address/search/category/item pages): the C-0039 address form and C-0040 search are covered at the middleware level only; the C-0022 cart line is asserted through `/api/cart`, not a cart page.
- Design check: tests only, no UI built; mockups SWHR2-MCK-5/6/7 are asserted by text and options, not rendered side by side.

Verification: `bun run verify` green (lint, typecheck, vitest). `bun run test:e2e` not run: Chromium missing in the container.

CODE-REVIEW: self-review — tests only, no product code changed; checked that each moved test kept its case key.
