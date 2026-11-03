# PLAN — SWHR2-T-0339 UAT: SWHR2-C-0021 (locale known at first render)

Change: `swhr2-s-0037-bugfix-swhr2-t-0337-swhr2-t`. Read its `design.md` FIRST (Root cause R1/R2, Decisions D1, D2, D6), then `specs/localization/spec.md`. This is the first of three chained fixes; SWHR2-T-0337 and SWHR2-T-0338 build on it.

## Objective

Make the storefront render in the session locale from its first paint, and give the whole app one locale state.

## Steps

Work `tasks.md` §1 in order. Tick nothing yourself.

1. Server side: keep a readable `ps_locale` cookie equal to the storefront session locale on session start and on every locale change, including the `?locale=` middleware branch (D1). Leave `ps_sid` HttpOnly.
2. Initialise `LocaleProvider` from `ps_locale` when it holds a supported code. Keep the `/api/session` fetch as the authority (D1).
3. Wrap `AppShell` in one `LocaleProvider` in `src/main.tsx`, and remove the providers in `src/pages/index.tsx` and `src/pages/petstore.tsx`, leaving `LanguageFlags` in place for SWHR2-T-0337 (D2).
4. Unit tests beside the changed modules (session route tests in `routes/api/session/`, a provider test in `src/components/storefront/`). Do not edit `tests/acceptance/**`.

## File/module ownership

- Modify: `services/session/store.ts`, `routes/api/session/locale.post.ts`, `middleware/10.session.ts`, `src/components/storefront/LocaleProvider.tsx`, `src/main.tsx`, `src/pages/index.tsx`, `src/pages/petstore.tsx`, `routes/api/session/locale.post.test.ts`.
- Create: `src/components/storefront/LocaleProvider.test.tsx`.

## Definition of Done

AC-1 and AC-2 on the ticket. Locked case SWHR2-C-0021 passes, and SWHR2-C-0022 and C-0027 stay green.
