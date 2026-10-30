# PLAN — SWHR2-T-0230 Sign-on and access control

Change `swhr2-i-0005-sign-on-and-access-control`, all task groups 1–7 in order. Read `design.md` first: §Target design (Components, Data, Interfaces, Stack choices), then §Sprint plan (P1–P7, SD1–SD8). The scenarios are in `specs/sign-on/spec.md`.

## Objective

Storefront, administration and supplier sessions are server-owned, area-scoped and idle-limited. Customers sign on with a remembered-name option and sign out to a "You are signed out" screen. The storefront header shows Sign in or Sign out. Administration has its own sign-in, Login Error and landing page, and the supplier area refuses a user who is still signed in to administration.

## Steps

1. **Credential table** (P2). Add `signon_users (user_id text primary key, password_hash text not null)` to `db/schema.ts`, register it in `db/client.ts`, and commit the generated migration. Seed `j2ee` with a `Bun.password` hash only outside Vitest and only when the table is empty (P3).
2. **Session middleware** (§Components: Session middleware; P5, SD1). Rework `middleware/10.session.ts`:
   - Pick the cookie by path: `admin_sid` for `/api/admin/**`, `supplier_sid` for `/api/supplier/**`, `ps_sid` otherwise.
   - Each session holds `area`, `locale`, `userId?` and `lastSeen`.
   - Drop a session past its idle limit (storefront 15 min, admin 54 min, supplier none) and start a fresh one. The cart in `services/cart.ts` is keyed by session id, so a fresh id is an empty cart. Discard the old id's cart when the session is dropped.
   - Keep the default export's `(event) => void` contract, which the acceptance harness calls. Update `routes/api/session/locale.post.test.ts` to `ps_sid`. Leave `middleware/auth.ts` untouched, and never read `event.context.user` for identity (P7).
3. **Credentials and guards** (§Components: Credential check, Guards). Add:
   - `services/session/auth.ts`: `verifyCustomer` against `signon_users`, and `verifyAdmin` / `verifySupplier` against `ADMIN_USERS` / `SUPPLIER_USERS`.
   - `services/session/guards.ts`: `requireCustomer`, `requireAdmin` and `requireSupplier`. Each answers 401 with `SignOnRequired`.
4. **Storefront routes** (§Interfaces; SD3).
   - Move `routes/api/session/index.get.ts` to `routes/api/session.get.ts` and extend it to `{ locale, signedOn, userId?, rememberedUserName? }`.
   - Add `routes/api/session/sign-in.post.ts`. It writes or expires `remembered_username` (`Max-Age=2678400`) only AFTER the credential check (D8). Renew the session id on sign-on (D6).
   - Add `routes/api/session/sign-out.post.ts`: a new session that keeps the locale, with an empty cart.
   - Add `routes/api/account/index.get.ts` guarded by `requireCustomer`. It returns `{ userId }`, and customer-account extends it (P6).
5. **Admin and supplier routes.** Add `routes/api/admin/{sign-in.post,sign-out.post,session.get}.ts` and `routes/api/supplier/{sign-in.post,sign-out.post,session.get}.ts`. Supplier sign-in answers 409 `AdminSignedIn` while the request carries a live `admin_sid` session (§Area separation).
6. **Storefront screens.**
   - Header: add `src/components/storefront/StorefrontHeader.tsx` with the main-page link, `SearchBox`, Account (to `/petstore/account`), Cart (to `/petstore/cart`) and Sign in / Sign out from `GET /api/session`. Render it as the header of `AppShell`, without a duplicate logo link.
   - Sign-in: replace `src/pages/petstore/signin.tsx` with the MCK-13 two-form screen. The returning form has User ID, Password and Remember My User Name, pre-filled from `rememberedUserName` and never with credentials (D1). The new-customer form is UI only; customer-account wires it. After sign-in, go back to the `return` path.
   - Add `src/pages/petstore/signed-out.tsx` (MCK-15) and `src/pages/petstore/account.tsx`. The account page sends a 401 to `/petstore/signin?return=/petstore/account`.
   - Add screen strings for en_US, ja_JP and zh_CN in `src/locales/*`. Point the `areas.ts` Account entry at `/petstore/account`.
7. **Admin and supplier screens.** `src/pages/admin/index.tsx` shows sign-in (MCK-16) or the landing page (MCK-17): a facility description, "Launch administration tool" linking to `/admin/tool`, and "Log out". `src/pages/supplier/index.tsx` shows sign-in (MCK-18), the "sign out of administration first" refusal on 409, and a signed-in supplier home with Log out.
8. **Internal services** (tasks 6.1, 6.2; SD5). There is no code to change: the message hand-off and order-line modules do not exist. Add no HTTP route that enqueues messages or touches order lines. SWHR2-I-0011 builds them under that rule.
9. **Framework sample application** (task 3.1; SD4). There is nothing to build. Record in the work log that AC-4 has no target component and its case is retired.
10. **Browser-test credentials** (P4). Give `webServer.env` in `playwright.config.ts` and `playwright.acceptance.config.ts` the `ADMIN_USERS` / `SUPPLIER_USERS` entries for `admin`/`admin-pw` and `supplier`/`supplier-pw`. The configs run under Node, so use precomputed hashes.
11. **Tests** (group 7):
    - Route tests beside each new route, using a fake clock for the 15- and 54-minute expiries.
    - UI tests for `StorefrontHeader`, the sign-in, signed-out and admin pages.
    - An `e2e/sign-on.spec.ts` for admin sign-out before supplier use.

## File/module ownership

- Database: `db/schema.ts`, `db/client.ts`, new `drizzle/0003_*.sql` and `drizzle/meta/*`.
- Middleware: `middleware/10.session.ts`.
- Services: new `services/session/*`, `services/cart.ts`.
- Routes:
  - `routes/api/session/index.get.ts` moves to `routes/api/session.get.ts`.
  - New `routes/api/session/{sign-in,sign-out}.post.ts`.
  - `routes/api/session/locale.post.test.ts`.
  - New `routes/api/account/*`, `routes/api/admin/*` and `routes/api/supplier/*`.
- Pages and components:
  - `src/components/shell/AppShell.tsx` and `src/components/shell/areas.ts`, with their tests.
  - New `src/components/storefront/StorefrontHeader.tsx` (and its test).
  - `src/pages/petstore/signin.tsx`, new `src/pages/petstore/{signed-out,account}.tsx`.
  - `src/pages/admin/index.tsx` and `src/pages/supplier/index.tsx`.
  - `src/locales/{en_US,ja_JP,zh_CN}/*`.
- Test config: `playwright.config.ts`, `playwright.acceptance.config.ts`, new `e2e/sign-on.spec.ts`.
- Not owned: `tests/acceptance/**`, `openspec/**` and the root docs.

## Definition of Done

- AC-1, AC-2, AC-3, AC-5, AC-6, AC-9–AC-12, AC-14 and AC-16–AC-18 hold. Linked cases C-0253, C-0255–C-0262, C-0265–C-0267 and C-0269 pass in `tests/acceptance/sign-on/`.
- AC-13 and AC-15 hold to the extent this sprint builds them: `requireCustomer` exists and guards the account route. Their cases C-0252 and C-0254 are deferred to SWHR2-I-0008.
- AC-7, AC-8 and AC-19 hold because no public route reaches message hand-off or order lines. Their cases are deferred to SWHR2-I-0011.
- AC-4 has no target component (SD4).
- The existing localization, catalog and cart tests still pass with the `ps_sid` cookie.

## Design reference

Approved mockups SWHR2-MCK-13 to SWHR2-MCK-18, each at a 1440 viewport. Routes, states and block ids are in `artifacts/SWHR2-S-0014/design/MANIFEST.md`, which also explains how to fetch the HTML to `artifacts/SWHR2-S-0014/design/mockup-<slug>.html`:

- `/petstore/signin` (MCK-13)
- the storefront header on `/petstore`, visitor and signed on (MCK-14)
- `/petstore/signed-out` (MCK-15)
- `/admin`, sign-in and Login Error (MCK-16)
- `/admin`, signed in (MCK-17)
- `/supplier`, sign-in (MCK-18)
