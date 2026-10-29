# PLAN — SWHR2-T-0176 Sign-on and access control

Change: `swhr2-i-0005-sign-on-and-access-control`. Read its `design.md` FIRST — the Target design and the **Planning (sprint SWHR2-S-0012)** section (decisions P1–P8, discrepancies SD1–SD8) — then `specs/sign-on/spec.md` and `test-cases.md`.

## Objective

Storefront, administration and supplier sign-on with server-owned, area-separated sessions and idle expiry, the storefront header's Sign in / Sign out state, the signed-out screen, and one guard per area as the only authorisation point. Work the `tasks.md` groups 1 → 7 in order; every line is this ticket's.

## Steps

1. Session store, credential check and guards in `services/session/` (design.md Target design › Components; P1, P2). Rewrite `middleware/10.session.ts` on the store, keeping its default export. Cookies `ps_sid` / `admin_sid` / `supplier_sid`; idle 15 min storefront, 54 min admin; expiry and sign-out drop the session's cart.
2. `signon_users` in `db/schema.ts` + generated migration (P4). Seed `j2ee`/`j2ee` and EST-2 outside Vitest (P5).
3. Storefront routes: move `GET /api/session` to `routes/api/session.get.ts` (P3) returning `{ locale, signedOn, userId?, rememberedUserName? }`; add `session/sign-in.post.ts` (remembered-name cookie, `Max-Age=2678400` or expired) and `session/sign-out.post.ts` (new session keeps locale) (Interfaces table).
4. Storefront UI: `StorefrontHeader` (main-page link, search, Account, Cart, Sign in xor Sign out) mounted in the `/petstore` layout; returning-customer sign-in form (P7); `/petstore/signed-out`; guarded `/petstore/account` and `/petstore/checkout` placeholders and a cart Check Out control (P6). Screen text through per-locale definitions in en_US, ja_JP, zh_CN.
5. Admin and supplier routes and screens: `routes/api/admin/{sign-in.post,sign-out.post,session.get}.ts`, `routes/api/supplier/{sign-in.post,sign-out.post,session.get}.ts` with the 409 `AdminSignedIn` refusal; `/admin` sign-in → Login Error → landing (Launch tool, Log out); `/supplier` sign-in with the "sign out of administration first" message.
6. Internal rule (P8): no route reaches an internal service; guards are the only check.
7. Tests: make every linked case in `tests/acceptance/sign-on/` green; add route/UI tests beside new code; update `routes/api/session/locale.post.test.ts` for `ps_sid`; pass `ADMIN_USERS` / `SUPPLIER_USERS` (hashes of `admin-pw` / `supplier-pw`) to the acceptance Playwright `webServer.env` (P5).

## Linked test cases

SWHR2-C-0252, 0253, 0255, 0256, 0257, 0258, 0259, 0260, 0261, 0262, 0265, 0266, 0267, 0269. Deferred (not this ticket's to make pass): C-0254 → SWHR2-I-0008; C-0263, C-0264, C-0268 → SWHR2-I-0011. C-0251 is retired.

## Design reference

Approved mockups, listed in `artifacts/SWHR2-S-0012/design/MANIFEST.md` (fetch instructions there; viewport 1440 for all):

- `artifacts/SWHR2-S-0012/design/mockup-storefront-sign-in.html` — `/petstore/signin`, signed off
- `artifacts/SWHR2-S-0012/design/mockup-storefront-header-signed-out-vs-signed-o.html` — any `/petstore/**`, visitor vs signed-on
- `artifacts/SWHR2-S-0012/design/mockup-signed-out.html` — `/petstore/signed-out`
- `artifacts/SWHR2-S-0012/design/mockup-administration-sign-in-and-login-error.html` — `/admin`, not signed in / rejected
- `artifacts/SWHR2-S-0012/design/mockup-administration-landing-page.html` — `/admin`, signed in
- `artifacts/SWHR2-S-0012/design/mockup-supplier-sign-in.html` — `/supplier`, not signed in

## File / module ownership

- New: `services/session/{store,auth,guards}.ts` (+ tests), `routes/api/session.get.ts`, `routes/api/session/{sign-in,sign-out}.post.ts`, `routes/api/admin/{sign-in.post,sign-out.post,session.get}.ts`, `routes/api/supplier/{sign-in.post,sign-out.post,session.get}.ts` (+ tests), `src/components/storefront/StorefrontHeader.tsx`, `src/pages/petstore/{signed-out,account,checkout}.tsx`, sign-on screen definitions under `src/locales/<locale>/`, a `drizzle/0003_*.sql` migration and its `drizzle/meta/` snapshot.
- Modified: `middleware/10.session.ts`, `services/cart.ts`, `db/schema.ts`, `db/client.ts`, `routes/api/session/locale.post.test.ts`, `src/pages/petstore.tsx`, `src/pages/petstore/{signin,cart}.tsx`, `src/pages/admin/index.tsx`, `src/pages/supplier/index.tsx`, `src/components/shell/areas.ts` (Account entry target only), `src/locales/` registry, `playwright.acceptance.config.ts` (`webServer.env` only).
- Deleted: `routes/api/session/index.get.ts` (replaced by `routes/api/session.get.ts`).
- Not touched: `tests/acceptance/**` (authored by the test author), `openspec/**` (the platform ticks `tasks.md`).

## Definition of Done

AC-1 … AC-19 on the ticket (one per scenario). AC-4 (SD1), AC-7, AC-8, AC-19 (SD2) and AC-15 (SD3) are met by the rule in P8 / the guard and have no linked case this sprint; every other AC has a linked case that passes.
