# PLAN — SWHR2-T-0182 Sign-on and access control

Change `swhr2-i-0005-sign-on-and-access-control`. Read its `design.md` FIRST: the Target design, then the "Planning (sprint SWHR2-S-0013)" section (P1–P11, SD1–SD7). Then the delta spec `specs/sign-on/spec.md` and `test-cases.md`.

## Objective

Storefront, administration and supplier sign-on with server-owned area sessions, idle expiry, the remembered user name, sign-out, the header sign-in state and the guards every protected route calls, so the 13 linked sign-on acceptance cases pass.

## Steps

Work `tasks.md` in group order; every line is tagged with this ticket.

1. **Group 1, storefront sign-on**: session store and area cookies (P1, P2); `signon_users` table, migration, seed of `j2ee` and EST-2 (P3); `verifyCustomer` with `Bun.password`; `requireCustomer`; `session.get.ts` move (P5); sign-in / sign-out routes and the `remembered_username` cookie (Target design "Remembered user name"); sign-in, signed-out and guarded account screens with per-locale definitions (P8, SD3).
2. **Group 2, header**: `StorefrontHeader` in the `AppShell` slot (P6).
3. **Group 3, sample app**: the `sample` idle limit and its store test (P7).
4. **Group 4, administration**: `verifyAdmin` from `ADMIN_USERS` (P4), `requireAdmin`, admin routes, sign-in / Login Error / landing screen (Target design "SPA screens"; P10).
5. **Group 5, separation**: supplier routes, `verifySupplier`, `requireSupplier`, 409 `AdminSignedIn` and the "sign out of administration first" message (Target design "Area separation").
6. **Group 6, internal services**: no new route imports a hand-off or order-line function (P9).
7. **Group 7, verification**: route integration tests (fake clock for 15 / 30 / 54 minutes), UI tests per screen, a Playwright admin-then-supplier spec in `e2e/`, credential env in both Playwright configs (P4).

## File/module ownership

- `middleware/10.session.ts`
- `services/session/store.ts`, `auth.ts`, `guards.ts` and their `*.test.ts`
- `services/cart.ts`, `services/cart.test.ts` (drop a cart by session id)
- `db/schema.ts`, `db/client.ts`, new migration under `drizzle/`
- `routes/api/session.get.ts` (new), `routes/api/session/index.get.ts` (delete), `routes/api/session/sign-in.post.ts`, `routes/api/session/sign-out.post.ts`, `routes/api/session/locale.post.test.ts`, with tests
- `routes/api/admin/sign-in.post.ts`, `sign-out.post.ts`, `session.get.ts`, with tests
- `routes/api/supplier/sign-in.post.ts`, `sign-out.post.ts`, `session.get.ts`, with tests
- `src/components/storefront/StorefrontHeader.tsx` (+ test), `src/components/shell/AppShell.tsx` (+ its test)
- `src/pages/petstore/signin.tsx`, `signed-out.tsx`, `account.tsx`; `src/pages/admin/index.tsx`; `src/pages/supplier/index.tsx`; their `*.test.tsx`
- `src/locales/{en_US,ja_JP,zh_CN}/petstore-signin.ts`, `petstore-signed-out.ts`, `header.ts`, admin and supplier screen definitions if added; `src/locales/registry.ts`
- `e2e/sign-on.spec.ts`; `playwright.config.ts`, `playwright.acceptance.config.ts` (webServer env only)

Not owned: `tests/acceptance/**`, `openspec/**`, `.github/workflows/**`, `middleware/auth.ts`.

## Design reference

Approved mockups, 1440 px viewport (`artifacts/SWHR2-S-0013/design/MANIFEST.md` has the block ids and how to fetch each one):

| Mockup                                   | File                                                                                 | Route and state                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| SWHR2-MCK-13 Storefront sign-in          | `artifacts/SWHR2-S-0013/design/mockup-storefront-sign-in.html`                       | `/petstore/signin`, not signed on                       |
| SWHR2-MCK-14 Header                      | `artifacts/SWHR2-S-0013/design/mockup-storefront-header-signed-out-vs-signed-o.html` | any storefront page, visitor and signed on              |
| SWHR2-MCK-15 Signed out                  | `artifacts/SWHR2-S-0013/design/mockup-signed-out.html`                               | `/petstore/signed-out` after Sign out                   |
| SWHR2-MCK-16 Admin sign-in / Login Error | `artifacts/SWHR2-S-0013/design/mockup-administration-sign-in-and-login-error.html`   | `/admin`, not signed in, and after rejected credentials |
| SWHR2-MCK-17 Admin landing               | `artifacts/SWHR2-S-0013/design/mockup-administration-landing-page.html`              | `/admin`, signed in                                     |
| SWHR2-MCK-18 Supplier sign-in            | `artifacts/SWHR2-S-0013/design/mockup-supplier-sign-in.html`                         | `/supplier`, not signed in                              |

## Definition of Done

- AC-1 … AC-19 on the ticket hold (one per scenario of the delta spec).
- AC-7, AC-8 and AC-19 (internal services) hold as P9 states; their cases are deferred to SWHR2-I-0011, and AC-13 / AC-15's cases to SWHR2-I-0008 (P11).
- The 13 linked acceptance cases (SWHR2-C-0253, 0255–0262, 0265–0267, 0269) pass.
- Every `tasks.md` line is done.
