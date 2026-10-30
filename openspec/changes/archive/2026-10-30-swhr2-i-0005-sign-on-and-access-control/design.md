# Sign-on: legacy implementation notes

These notes record how Java Pet Store 1.3.2 implements sign-on and access control. The visible contract of each approved screen and behaviour is stated in `specs/sign-on/spec.md`; this file explains where it lives in the legacy code and what the extraction could not settle. No target design is proposed here.

Three independent sign-on mechanisms exist in the legacy suite: the storefront uses an application-level sign-on filter backed by its own credential store; the administration and supplier applications use container form login against the application server's realm. They share no code and no credential store.

## Source map

All paths are relative to `legacy-source/petstore1.3.2/`.

| Concern                      | Where it lives                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credential store             | `src/components/signon/src/ejb-jar.xml:52-65` (entity `UserEJB`, abstract schema `User`, CMP fields `userName` (primary key) and `password`); `UserEJB.java:53-58` accessors                                                                                                                                                                        |
| Credential creation rules    | `UserEJB.ejbCreate` (`UserEJB.java:64-76`): user ID length against `UserLocal.MAX_USERID_LENGTH = 25` (`UserLocal.java:46`), password length against `MAX_PASSWD_LENGTH` (`UserLocal.java:47`, redacted in this copy), `%` / `*` check                                                                                                              |
| Credential check             | `SignOnEJB.authenticate` (`SignOnEJB.java:68-78`): `findByPrimaryKey(userName)`, `FinderException` -> `false`; `UserEJB.matchPassword` (`UserEJB.java:88-90`) is `password.equals(getPassword())`                                                                                                                                                   |
| Storefront filter            | `src/components/signon/src/com/sun/j2ee/blueprints/signon/web/SignOnFilter.java`, mapped to `/*` in `src/apps/petstore/src/docroot/WEB-INF/web.xml:74-78`                                                                                                                                                                                           |
| Protected-page configuration | `src/apps/petstore/src/docroot/WEB-INF/signon-config.xml:40-79`, parsed by `SignOnDAO` (`SignOnDAO.java:137-160`) at filter `init` (`SignOnFilter.java:88-102`)                                                                                                                                                                                     |
| Storefront sign-in screen    | `src/apps/petstore/src/docroot/signon.jsp`; returning form posts to `j_signon_check`, new-customer form posts to `createuser.do` (account creation belongs to customer-account)                                                                                                                                                                     |
| Storefront sign-in error     | `signon_error.screen` -> `signon_failed.jsp` (`screendefinitions_en_US.xml:186-192`)                                                                                                                                                                                                                                                                |
| Storefront header            | `banner.jsp:51-68`, included as the `banner` of every screen definition; tests session attribute `j_signon`                                                                                                                                                                                                                                         |
| Post-sign-on set-up          | `SignOnNotifier.java:105-143` (session attribute listener on `j_signon` = true) fires `SignOnEvent`; `SignOnEJBAction.java:77-96` sets the shopping facade user id, reads `Profile.preferredLanguage`, sets the locale and `cart.setLocale`                                                                                                         |
| Storefront sign-out          | `signoff.do` -> `SignOffHTMLAction.java:69-82` (`mappings.xml:82-84`) -> `signoff.jsp`                                                                                                                                                                                                                                                              |
| Storefront session timeout   | `src/apps/petstore/src/docroot/WEB-INF/web.xml:161-163` (15 minutes)                                                                                                                                                                                                                                                                                |
| Error navigation             | `MainServlet.java:117-127` and `ScreenFlowManager.getExceptionScreen` (`ScreenFlowManager.java:164-182`, `isAssignableFrom` walk); `general_error.jsp:51-77`                                                                                                                                                                                        |
| Admin access                 | `src/apps/admin/src/docroot/WEB-INF/web.xml:67-101` (constraint on `/AdminRequestProcessor` GET/POST, role `administrator`, FORM login, `session-timeout` 54); `application.xml:55-57`; `sun-j2ee-ri.xml:45-56` (role -> principal `jps_admin`, group `administrator_group`)                                                                        |
| Admin screens                | `login.jsp:49-67`, `error.jsp:44-49`, `index.jsp:61-82` (landing), `logout.jsp:42-46` (invalidates, includes `index.html`)                                                                                                                                                                                                                          |
| Admin dispatch               | `AdminRequestProcessor.java:86-118`: `doGet` -> `index.jsp`; `doPost` on `currentScreen` = `manageorders` (JNLP) or `logout`                                                                                                                                                                                                                        |
| Admin data service           | `ApplRequestProcessor.java:88-112` (`getSession(false)` null check only); client URL built with `;jsessionid=` in `HttpPostPetStoreProxy.java:74-78`; client needs four arguments (`PetStoreAdminClient.java:451-457`)                                                                                                                              |
| Supplier access              | `src/apps/supplier/src/docroot/WEB-INF/web.xml:72-117` (constraint on `/RcvrRequestProcessor`, role `administrator`, transport `NONE`, timeout 54); `sun-j2ee-ri.xml:45-56` (principal `supplier`, group `administrator_group`); `displayinventory.jsp:66` repeats `isUserInRole`                                                                   |
| Supplier screens             | `login.jsp:50-67`, `error.jsp:46-51`, `logout.jsp:38-54` (`RcvrRequestProcessor.java:173-175` forwards `logout`)                                                                                                                                                                                                                                    |
| Provisioning                 | `setup.xml:174-196` target `create_users`: RealmTool `-add jps_admin admin default` and `-add supplier supplier default`                                                                                                                                                                                                                            |
| Data-layer permissions       | `<unchecked/>` method permissions with `use-caller-identity`: customer (`ejb-jar.xml:372-399`), contactinfo (`149-159`), creditcard (`69-82`), lineitem (`79-92`), purchaseorder (`401-408`), supplierpo (`318-346`), processmanager (`185-195`), asyncsender (`54-57`, `107-114`), catalog (`84-90`), OPC (`src/apps/opc/src/ejb-jar.xml:657-706`) |

## Storefront sign-on mechanics

- The filter strips the context root from the request URI and compares the remainder with each configured `url-pattern` by exact string equality; there is no wildcard matching and the query string is ignored.
- Session attributes: `j_signon` (Boolean signed-on flag; also read by `banner.jsp`), `j_signon_username`, `j_signon_original_url` (the remembered page).
- On a protected miss the filter forwards (not redirects) to the configured sign-in page. On submission to `j_signon_check` it redirects: to `j_signon_original_url` on success, to the configured error page on failure.
- The "remember my user name" cookie is `bp_signon`, max age 2,678,400 seconds, written or cleared before the credential check runs.
- Roles listed under `auth-constraint` in `signon-config.xml` are parsed into `ProtectedResource.roles` but `SignOnFilter` never reads them.
- The banner "Sign in" link targets the protected `signon_welcome.screen`, which is how the storefront triggers sign-in: the welcome page is the remembered target.
- After sign-on, `SignOnEJBAction` ignores `FinderException` on purpose, so a user with a credential but no customer record (the first sign-on after account creation) still signs on. `EventException` in the notifier is only printed.
- Sign-out saves the session locale, invalidates the session, creates a new session, restores the locale, initialises a new component manager (new cart) and returns a `ChangeLocaleEvent`. `mappings.xml` also names a `SignOffEvent` / `SignOffEJBAction` pair whose classes are not in this tree.

## Administration and supplier mechanics

- Both use the container's FORM login against realm `default`; the login pages post to `j_security_check`.
- Inside the supplier application the protected role is also named `administrator`; the spec calls it "the supplier area's protected role" to avoid confusing it with the administration role.
- The administration application is a Java Web Start rich client. The landing page's launch form returns a JNLP descriptor whose arguments are the proxy class, server name, server port and the HTTP session id; the client then calls `/admin/ApplRequestProcessor;jsessionid=<id>`. That endpoint is outside the web.xml security constraint, so the session id is the only credential it checks.
- Any `currentScreen` value other than `manageorders` or `logout` returns an empty response from `AdminRequestProcessor`.

## Open questions and disputes

- **Q1 Password maximum length** (SIGN-RULE-0004). `UserLocal.MAX_PASSWD_LENGTH` is a redaction marker in this copy. An SME with the unredacted source or the live system must supply the number.
- **Q2 Stand-alone account-creation servlet** (SIGN-REQ-0010). `CreateUserServlet` is excluded from the storefront build (`src/apps/petstore/src/build.xml:204-205`) and no `web.xml` in the tree maps it. Left out of the spec; recommended for rejection unless some deployment maps it.
- **Q3 Orphaned sign-in flags** (SIGN-REQ-0011 in `src/waf/a.yaml`, SIGN-REQ-0002 in `src/waf/b.yaml`). `src/waf/src/docroot/WEB-INF/xml/requestmappings.xml` marks account editing and every checkout step `requiresSignin="true"`, but nothing loads that file and `URLMappingsXmlDAO` discards the flag. An SME approved SIGN-REQ-0011, so it is in the spec as "Pages that require a signed-on customer". It lists order placement and commit as sign-in steps that the live `signon-config.xml` does not protect (see D5), so the rebuild deliberately protects more than the legacy storefront did.
- **Q4 WAF sample session timeout** (SIGN-BR-0012, SIGN-REQ-0001 in `src/waf/b.yaml`). 30 minutes in the framework sample WAR only; the storefront declares 15. SIGN-BR-0012 was approved and is in the spec scoped to the framework sample application; the storefront keeps 15 minutes.
- **Q5 Admin-before-supplier sign-out** (SIGN-ON-REQ-0001, SIGN-ON-BR-0001). `docs/using.html:269-272` tells operators to log out of the admin client before using the supplier client. No code enforces it; the likely cause is that both applications authenticate against the same realm with role `administrator`. Both records were approved and are in the spec as written; no legacy code enforces the rule, so the rebuild has to decide how to enforce it.
- **Q6 Timeout literals.** 15 and 54 minutes are bare descriptor values with no rationale. They are written as requirements at the legacy values; the Business Owner may choose to change them.
- **Q7 Built-in accounts.** Whether the rebuild keeps the user IDs `jps_admin` and `supplier` and the shared group `administrator_group` is a business choice the source cannot settle.

## Suspected legacy defects (for the defect register)

Whether to correct each of these is the Business Owner's decision; the spec carries only the approved records.

- **D1 Pre-filled credentials.** The storefront sign-in form pre-fills `j2ee`/`j2ee`; the admin login pre-fills `jps_admin`/`admin`; the supplier login pre-fills `supplier`/`supplier`. Anyone reaching a sign-in page can sign in as the demo or privileged account.
- **D2 Clear-text passwords.** `UserEJB` stores the password as given and compares with `String.equals`. The realm passwords for `jps_admin` and `supplier` are literals in `setup.xml`. No lockout, attempt counting or delay exists anywhere.
- **D3 Admin data service checks only for a session.** `ApplRequestProcessor` accepts any live session, and `/ApplRequestProcessor` is not in the admin security constraint. A storefront-style or anonymous session in the admin web module would be accepted.
- **D4 Order processing administration is unchecked and remote.** `OPCAdminFacadeEJB` has a remote interface (`ejb/opc/opc/OPCAdminFacadeEJBRemote`) and `<unchecked/>` permissions; the OPC message handlers are likewise unchecked, so anyone able to post to their queues can approve orders.
- **D5 Unprotected storefront actions.** `order.do` (order submission), `update_customer.screen` and `createcustomer.do` are not in `signon-config.xml`. Only the screen leading to them is protected.
- **D6 Session handling.** The session is not renewed on sign-on (`validateSignOn` reuses it), and the admin client carries the session id in the URL.
- **D7 Missing return page.** `validateSignOn` redirects to `j_signon_original_url` without a null check; a submission to `j_signon_check` without first hitting a protected page redirects to a null target.
- **D8 Remember-me before authentication.** The `bp_signon` cookie is set or cleared before the credentials are checked, so a failed attempt with someone else's user ID remembers it on that browser.
- **D9 Stack trace on the error page.** `general_error.jsp` prints `exception.printStackTrace` into the response. The mapping that should reach it names `GeneralFailureException` in a package that does not contain it and targets `error.screen`, which no screen definition defines, so its reachability is doubtful.
- **D10 No transport encryption.** The supplier constraint declares `transport-guarantee NONE`; the admin and storefront declare none at all. Credentials travel unencrypted unless the deployment adds it.
- **D11 Roles parsed but ignored.** `SignOnDAO` reads per-page roles that `SignOnFilter` never enforces; a reader of `signon-config.xml` would believe role protection exists.

## Extraction coverage

The pass files carry 79 records with `capability_key: sign-on` across 29 pass files (47 distinct record keys; keys repeat across modules). Nine are `kind: screen` and describe five distinct surfaces: storefront sign-in (with its error screen), storefront header, admin sign-in (with its error page), admin landing page and supplier sign-in (with its error page). The server reports 30 records and 4 screens for this capability; the difference was not reconciled from the tree. Thirteen records are approved and each is one requirement in the spec; three of them are screens (storefront header, administration sign-in, administration landing page). The other screen records (storefront sign-in, its error screen, supplier sign-in) are not approved and are left out, so the spec carries 3 screen requirements against the server's count of 4. Two pass files (`src/components/cart/b.yaml`, `src/components/encodingfilter/b.yaml`) do not parse as YAML; a text search of them finds no `sign-on` record.

## Ambiguous approved keys

Three approved record keys are carried by more than one `sign-on` record in different pass files. The spec follows one record for each; an SME should confirm the choice:

- **SIGN-REQ-0003** (`SWHR2-R-0031`): written from `src/apps/admin/b.yaml` (administration sign-in screen). Other records with this key: `src/apps/petstore/a.yaml` (storefront sign-in error message), `src/apps/supplier/a.yaml` (54-minute supplier idle expiry).
- **SIGN-BR-0006** (`SWHR2-R-0120`): written from `src/apps/petstore/a.yaml` (15-minute storefront idle expiry). Other record: `src/apps/admin/b.yaml` (administration data service session check, D3).
- **SIGN-REQ-0005** (`SWHR2-R-0148`): written from `src/apps/petstore/a.yaml` (storefront sign-out). Other record: `src/apps/admin/a.yaml` (administration logout).

## Target design

### Components

- **Session store** `services/session/store.ts`: server-owned, in-memory sessions keyed by an opaque random id. Each session holds `area`, `locale`, `userId` (when signed on), `cart` (shopping-cart) and `lastSeen`. Session data is never written to SQLite, which keeps the cart session-only (shopping-cart SWHR2-R-0118).
- **Session middleware** `middleware/10.session.ts` runs after the UTF-8 middleware (localization SWHR2-R-0080). It reads the area cookie that matches the request path:
  - `ps_sid` for `/api/**` storefront routes
  - `admin_sid` for `/api/admin/**`
  - `supplier_sid` for `/api/supplier/**`

  It drops the session when the idle limit has passed, starts a fresh one when needed, attaches it as `event.context.session` and touches `lastSeen`. The idle limits are 15 minutes for storefront sessions, which discards the cart and sign-on state (SWHR2-R-0120), and 54 minutes for administration sessions (SWHR2-R-0032). No idle limit is specified for the supplier area, so supplier sessions end at sign-out or server restart until one is decided.

- **Credential check** `services/session/auth.ts`. `verifyCustomer(userId, password)` compares against the hashed password in `signon_users` (customer-account). `verifyAdmin` and `verifySupplier` compare against operator-configured credentials. Passwords are stored and compared hashed (PRD constraints).
- **Guards** `services/session/guards.ts`. `requireCustomer(event)` returns 401 with failure kind `SignOnRequired`, and the SPA answers that by sending the visitor to the sign-in screen and then back to where they were. It guards account editing, the sign-in landing page, placing and committing an order, and entering or validating billing and shipping information (SWHR2-R-0028). `requireAdmin(event)` and `requireSupplier(event)` guard every route under `/api/admin/**` and `/api/supplier/**`. Every administration and supplier route makes this explicit authorisation decision (PRD constraints). There is no data-population route (data-population).
- **Area separation** (SWHR2-R-0029, SWHR2-R-0030). Administration and supplier sessions use separate cookies and separate credentials. `POST /api/supplier/sign-in` is refused with failure kind `AdminSignedIn` while the request carries a live `admin_sid` session, and the supplier sign-in screen tells the user to sign out of administration first.
- **In-process hand-off** (SWHR2-R-0121, SWHR2-R-0124). The message enqueue function (order-fulfillment) and the order-line data functions (checkout, order-fulfillment) are server modules with no HTTP route. Only in-process callers can reach them, they apply no role check of their own, and they run under the identity their caller passes in. Access control sits on the API route that calls them.
- **SPA screens**:
  - `src/pages/petstore/signin.tsx`: the returning-customer form with Remember My User Name, and the new-customer form, which customer-account owns.
  - `src/pages/petstore/signed-out.tsx`: "You are signed out" with a link to sign in again (SWHR2-R-0148).
  - `src/pages/admin/index.tsx`: shows the administration sign-in screen (User ID, Password, submit) when not signed in. On rejection it shows "Login Error", "You could not be authenticated with the information provided. Please check your Username and Password." and a link back to sign-in (SWHR2-R-0031). When signed in, it shows the landing page describing the sales, revenue, order-status and approve/deny facilities, with "launch the administration tool" (link to `/admin/tool`) and "log out" (SWHR2-R-0123).
  - `src/pages/supplier/index.tsx`: supplier sign-in with a login error on failure, then the supplier home.
- **Storefront page header** `src/components/storefront/StorefrontHeader.tsx` (SWHR2-R-0122): main-page link, keyword search box, Account, Cart, and "Sign in" or "Sign out" depending on `GET /api/session`, plus the localization flags.
- **Remembered user name** (SWHR2-R-0119). On a storefront sign-on with the option ticked, the response sets the cookie `remembered_username` with `Max-Age=2678400`. Without the option, it expires the cookie. The sign-in screen pre-fills the field from `GET /api/session`.
- **Framework sample application** (SWHR2-R-0027). The PRD defines no framework sample application in the target, so no component carries its 30-minute expiry. The requirement needs a Business Owner disposition.

### Data

- **In memory, not persisted**: the session records described above.
- **Persisted credentials**: the hashed customer password in `signon_users` (customer-account, `db/schema/storefront.ts`).
- **Administration and supplier credentials**: operator-supplied environment configuration (`ADMIN_USERS` and `SUPPLIER_USERS`, each a list of `userId:passwordHash`). The spec seeds only the four storefront users (data-population SWHR2-R-0072), so the administration and supplier credentials stay out of the seed data.
- Sign-on adds no new table.

### Interfaces

| Route                                                       | Body / response                                                    | Authorisation    |
| ----------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- |
| `GET /api/session`                                          | `{ locale, signedOn, userId?, rememberedUserName?, preferences? }` | none             |
| `POST /api/session/sign-in`                                 | `{ userId, password, remember }` → 200 or 401                      | none             |
| `POST /api/session/sign-out`                                | ends the session, starts a new one carrying the old locale         | none             |
| `POST /api/admin/sign-in`, `POST /api/admin/sign-out`       | `{ userId, password }` → 200 or 401                                | none for sign-in |
| `GET /api/admin/session`                                    | 200 when signed in, 401 otherwise                                  | admin            |
| `POST /api/supplier/sign-in`, `POST /api/supplier/sign-out` | `{ userId, password }` → 200, 401 or 409 `AdminSignedIn`           | none for sign-in |

The session cookies are `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` when served over HTTPS.

### Stack choices

- Nitro (H3) middleware and file-based routes, pinned by the PRD constraints. H3's cookie helpers are used, but not `useSession`, because its sealed-cookie sessions keep state in the browser and the PRD requires server-owned sessions.
- An in-process `Map` session store, valid for the single-process deployment (`ecosystem.config.js`, `instances: 1`). Sessions do not survive a restart, which the session-only cart allows.
- `Bun.password` (argon2id), built into the Bun runtime, for password hashing. No auth library is added.
- Tests: route integration tests for the sign-in and sign-out routes, the guards, the idle expiry (with a fake clock) and the admin-before-supplier refusal; UI tests for the sign-in, signed-out and admin screens.

## Sprint plan (SWHR2-S-0014)

Planning record for sprint SWHR2-S-0014. The sections above are the adopted specification and are not changed. One FEATURE, **SWHR2-T-0230**, owns every task group in `tasks.md`, worked in order. Its plan is `artifacts/SWHR2-S-0014/SWHR2-T-0230/PLAN.md`.

### Codebase findings

- `middleware/10.session.ts` holds an in-memory `Map` of `{ id, locale }` sessions under one cookie `sid`. There is no area, no `lastSeen`, no idle expiry and no `userId`.
- `services/cart.ts` keeps carts in a separate `Map` keyed by session id (`cartFor(id)`). A new session id therefore means an empty cart, so ending a session empties the cart without moving the cart into the session record.
- `middleware/auth.ts` is boilerplate: it sets `event.context.user = { name: "Yeasin" }` on every request. Nothing reads it.
- `GET /api/session` lives at `routes/api/session/index.get.ts` and returns `{ locale }` only. The acceptance suite imports `routes/api/session.get`. `routes/api/session/locale.post.test.ts` sends the cookie as `sid=`.
- `db/schema.ts` is a single file (no `db/schema/storefront.ts`). It has no `signon_users` table. `db/client.ts` migrates from `drizzle/` and seeds the dev db (catalog fixture) only when `VITEST` is unset.
- Storefront: `src/pages/petstore.tsx` wraps pages in `LocaleProvider`, `LanguageFlags` and `CategoryPanel`. `src/components/shell/AppShell.tsx` renders the global header (logo link and `SearchBox`) for every route via `src/main.tsx`. There is no `StorefrontHeader`, and no Account or Sign in/out control in a header; `areas.ts` points "Sign in" and "Account & profile" at `/petstore/signin`.
- `src/pages/petstore/signin.tsx`, `src/pages/admin/index.tsx` and `src/pages/supplier/index.tsx` are `EmptyFrame` placeholders. Screen text comes from `src/locales/<locale>/` through `useScreen`.
- There are no checkout, account-edit, order-fulfilment, messaging or order-line modules in the repo.
- Acceptance suite `tests/acceptance/sign-on/` pins these paths: `middleware/10.session.ts` (default export), `routes/api/session.get.ts`, `routes/api/session/sign-in.post.ts`, `routes/api/admin/sign-in.post.ts`, `routes/api/admin/session.get.ts`, `src/components/storefront/StorefrontHeader.tsx`, cookies `ps_sid` / `admin_sid` / `remembered_username`, table `signon_users (user_id, password_hash)` and env `ADMIN_USERS` / `SUPPLIER_USERS` (`userId:Bun.password hash`). The e2e spec signs in as `j2ee`/`j2ee`, and as `admin`/`admin-pw` and `supplier`/`supplier-pw` unless `E2E_*` env overrides them.

### Planning decisions

- **P1 One FEATURE.** No SPIKE: Q1–Q7 do not block the build. Q5 is settled by "Area separation" above, and Q7 by operator env credentials.
- **P2 Credential table.** The FEATURE adds `signon_users (user_id text primary key, password_hash text not null)` to `db/schema.ts`, with its drizzle migration. Sign-on cannot sign anyone in without it. customer-account (SWHR2-I-0006) writes to the same table later and keeps these two columns.
- **P3 Dev/e2e demo customer.** Outside Vitest, `db/client.ts` seeds `j2ee` with a hashed password when `signon_users` is empty, the same way the catalog fixture is seeded. data-population (SWHR2-I-0014) replaces it. Nothing pre-fills the sign-in form (D1).
- **P4 Operator credentials for browser tests.** The Playwright web servers get `ADMIN_USERS` / `SUPPLIER_USERS` for the test accounts through their `webServer.env`. The app ships no default admin or supplier credential.
- **P5 Session store stays in the middleware module.** The acceptance harness loads `middleware/10.session.ts` and expects a fresh store on module reset. Its store `Map` may move into `services/session/store.ts` only if the middleware's default export keeps that contract.
- **P6 Guard reach this sprint.** `requireCustomer` is applied to the routes that exist now: the account-edit entry that the header's Account link opens, and the sign-in landing page. Checkout (SWHR2-I-0008) applies it to order placement and billing/shipping when it builds those routes. Order-line and message hand-off modules (SWHR2-I-0011) are built with no role check.
- **P7 Leave `middleware/auth.ts` alone; never read `event.context.user`.** Its fixed fake user feeds only the boilerplate `routes/api/hello.ts` example and its test, so deleting it is unrelated churn. The sign-on identity lives only on `event.context.session.userId`, and no guard reads `event.context.user`. Removing the boilerplate pair is a separate improvement ticket.

### Phases

1. **Session and credentials.** Area cookies, idle limits, `signon_users`, `services/session/auth.ts`, guards and the session/sign-in/sign-out routes (task groups 1, 3, 4.4, 5).
2. **Screens.** Storefront header, sign-in, signed-out, administration sign-in / Login Error / landing, and supplier sign-in, built from the approved mockups (task groups 1.4, 2, 4.1–4.3, 5.2).
3. **Internal services.** Task group 6 is recorded as the access-control rule for SWHR2-I-0011. No code exists to change this sprint.
4. **Test harness.** Route integration tests beside each new route (`server` Vitest project), UI tests beside each new component or page, and the browser flows in `e2e/` (task group 7). The acceptance specs in `tests/acceptance/sign-on/` turn green for every linked case.
5. **CI.** `.github/workflows/ci.yml` already runs on `vortex/**` pushes and PRs: doc links, typecheck, lint, unit, build, E2E and the acceptance tiers. The only CI-adjacent change is P4's `webServer.env`. No workflow edit is planned.

### Test cases

- Linked to SWHR2-T-0230: C-0253, C-0255–C-0262, C-0265–C-0267 and C-0269.
- Deferred to checkout (SWHR2-I-0008): C-0252 and C-0254.
- Deferred to order fulfilment (SWHR2-I-0011): C-0263, C-0264 and C-0268.
- C-0251 is retired.

### Spec discrepancies

Recorded here and on the ticket. The adopted spec and the target design above are not edited.

- **SD1** The target design places the session store in `services/session/store.ts` with per-area cookies `ps_sid` / `admin_sid` / `supplier_sid`. The code has a single cookie `sid` in `middleware/10.session.ts`. Resolved by P5; the existing locale test moves to `ps_sid`.
- **SD2** The design attributes `signon_users` to customer-account in `db/schema/storefront.ts`. Neither the table nor that file exists. Resolved by P2 in `db/schema.ts`.
- **SD3** The design names `GET /api/session` without a file. The code has `routes/api/session/index.get.ts`, and the acceptance suite imports `routes/api/session.get.ts`. Both map to the same URL, so the route moves to `routes/api/session.get.ts`.
- **SD4** SWHR2-R-0027 (framework sample application, 30 minutes) has no target component, and its only case, C-0251, is retired. Task 3.1 builds nothing, and its criterion cannot be observed in this product. It needs a Business Owner disposition.
- **SD5** SWHR2-R-0028.01 / .03, SWHR2-R-0121 and SWHR2-R-0124 describe behaviour of modules that do not exist yet (checkout, order fulfilment). This sprint delivers the guard and records the no-role-check rule. Their cases are deferred, see P6.
- **SD6** `middleware/auth.ts` attaches a fixed fake user to every request, which neither the spec nor the design mentions. Left in place and ignored by every guard (P7); its removal is an improvement ticket.
- **SD7** The brief's five user stories carry no story ids, so they cannot be linked to the ticket.
- **SD8** The supplier area has no idle limit in the spec. Supplier sessions end only at sign-out or server restart, as the design says.
