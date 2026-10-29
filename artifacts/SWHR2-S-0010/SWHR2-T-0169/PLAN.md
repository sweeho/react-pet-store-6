# PLAN — SWHR2-T-0169 Sign-on and access control

Change `swhr2-i-0005-sign-on-and-access-control`, all of `tasks.md` (groups 1–7, in order). Read `design.md` first: §Target design, then §Planning (Codebase findings, P1–P9, Phases) and §Spec discrepancies (SD1–SD6).

## Objective

The store tells its users apart. Storefront, administration and supplier each have their own server-owned session with its own sign-in and idle expiry. Account and checkout steps require a signed-on customer. The header shows Sign in or Sign out. Administration and supplier stay separate. Internal services stay unreachable from outside.

## Steps

1. Session core (design.md P1–P3, Phase 1): `services/session/store.ts`, rewrite `middleware/10.session.ts`, `dropCart` in `services/cart.ts`, rename the cookie to `ps_sid` in `routes/api/session/locale.post.test.ts`, and add a store unit test for the 15, 30 and 54 minute limits.
2. Storefront sign-on (P4–P6, Phase 2): the `signon_users` schema, its migration and the `j2ee` seed. Then `services/session/auth.ts`, `services/session/guards.ts`, the routes `session.get` (moved from `session/index.get.ts`), `session/sign-in.post` and `session/sign-out.post`. Then the sign-in screen, the signed-out screen, the `RequireSignOn` wrapper, guarded placeholders `/petstore/account` and `/petstore/checkout`, and a Checkout control on the cart page. Screen text goes into per-locale definitions in all three locales.
3. Header (P7, Phase 3): `StorefrontHeader` as the header on `/` and `/petstore/**`.
4. Staff areas (P8, Phase 4): `routes/api/admin/{sign-in.post,sign-out.post,session.get}`, `routes/api/supplier/{sign-in.post,sign-out.post,session.get}`, the admin sign-in, Login Error and landing screens, the supplier sign-in screen with the "sign out of administration first" message, and test credentials in both Playwright configs' `webServer.env`.
5. Template residue (P9): delete `middleware/auth.ts` and stop `routes/api/hello.ts` and its test reading `event.context.user`.
6. Internal services (Phase 5, SD4): import no hand-off or order-line module from any route this ticket adds.
7. Tests (Phase 6): an integration test beside each new route, UI tests beside each new screen and the header, and `e2e/sign-on.spec.ts`. Do not edit `tests/acceptance/**`.

## File/module ownership

`middleware/10.session.ts`, `middleware/auth.ts` (delete), `services/session/**` (new), `services/cart.ts`, `services/cart.test.ts`, `db/schema.ts`, `db/client.ts`, `drizzle/0003_*.sql`, `drizzle/meta/*`, `routes/api/session.get.ts` (new; replaces `routes/api/session/index.get.ts`), `routes/api/session/sign-in.post.ts`, `routes/api/session/sign-out.post.ts`, `routes/api/session/*.test.ts`, `routes/api/admin/**` (new), `routes/api/supplier/**` (new), `routes/api/hello.ts`, `routes/api/hello.test.ts`, `src/components/storefront/StorefrontHeader.tsx` (+ test), `src/components/storefront/RequireSignOn.tsx` (+ test), `src/components/shell/AppShell.tsx`, `src/pages/petstore.tsx`, `src/pages/petstore/signin.tsx`, `src/pages/petstore/signed-out.tsx`, `src/pages/petstore/account.tsx`, `src/pages/petstore/checkout.tsx`, `src/pages/petstore/cart.tsx`, `src/pages/admin.tsx`, `src/pages/admin/index.tsx`, `src/pages/supplier.tsx`, `src/pages/supplier/index.tsx`, page tests beside each, `src/locales/{en_US,ja_JP,zh_CN}/{header,petstore-signin,petstore-signed-out}.ts`, `src/locales/registry.ts`, `e2e/sign-on.spec.ts`, `playwright.config.ts`, `playwright.acceptance.config.ts` (`webServer.env` only).

## Definition of Done

AC-1 through AC-19 on the ticket hold. AC-4 is met by the store's per-area limit (SD1). For AC-7, AC-8 and AC-19, the only obligation in this sprint is that no route this ticket adds reaches those modules (SD4). These acceptance cases in `tests/acceptance/sign-on/` pass: C-0252, C-0253, C-0255–C-0262, C-0265–C-0267 and C-0269. C-0254, C-0263, C-0264 and C-0268 are expected red until checkout and order-fulfillment ship. The localization acceptance sign-in cases (`张伟`, `山田太郎`) reach the new sign-in route.

## Design reference

The approved mockups are in `artifacts/SWHR2-S-0010/design/MANIFEST.md`. Fetch each one with the command given there.

- SWHR2-MCK-13 `mockup-storefront-sign-in.html`: `/petstore/signin`, default, 1440.
- SWHR2-MCK-14 `mockup-storefront-header-signed-out-vs-signed-o.html`: header on `/petstore`, visitor and signed-on, 1440.
- SWHR2-MCK-15 `mockup-signed-out.html`: `/petstore/signed-out`, 1440.
- SWHR2-MCK-16 `mockup-administration-sign-in-and-login-error.html`: `/admin`, not signed in and rejected, 1440.
- SWHR2-MCK-17 `mockup-administration-landing-page.html`: `/admin`, signed in, 1440.
- SWHR2-MCK-18 `mockup-supplier-sign-in.html`: `/supplier`, not signed in, 1440.
