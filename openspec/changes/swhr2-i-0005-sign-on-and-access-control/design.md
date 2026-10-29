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

## Planning (sprint SWHR2-S-0013)

Added at sprint planning. The sections above are the adopted specification and are unchanged; this section records what the repository already holds, the decisions that resolve conflicts between it and the target design, the spec discrepancies, and the delivery phases. One FEATURE, SWHR2-T-0182, owns every task group.

### Codebase findings

- **Session**: `middleware/10.session.ts` already keeps an in-memory `{ id, locale }` session in a module-level `Map`, keyed by one cookie `sid` for every path. There is no idle expiry, no area split, no sign-on state. `routes/api/session/locale.post.ts` writes the locale into it; its test (`routes/api/session/locale.post.test.ts`) sends `sid=`.
- **Session read route**: `routes/api/session/index.get.ts` returns `{ locale }` only. The sign-on acceptance suite imports `routes/api/session.get` (a file beside the `session/` directory, not inside it).
- **Cart**: `services/cart.ts` keys a module-level `Map` by session id (`cartFor(sessionId)`); `routes/api/cart/items.post.ts` and `index.get.ts` read `event.context.session.id`. A new session id therefore already means an empty cart; nothing deletes the old one.
- **Credentials**: no `signon_users` table exists. `db/schema.ts` has the boilerplate `users` table and the catalog tables. customer-account's change (`swhr2-i-0006-customer-account-and-profil`, design.md Data) defines `signon_users(user_id text primary key, password_hash text not null)`, and the sign-on, checkout and shopping-cart acceptance harnesses seed into exactly that shape.
- **Seed**: `db/client.ts` seeds catalog items EST-1, EST-6, EST-7 only. The sign-on e2e (SWHR2-C-0269) adds EST-1 and EST-2 to the cart, and every e2e signs in as `j2ee` / `j2ee`; neither EST-2 nor any storefront user is seeded.
- **Screens**: `src/pages/petstore/signin.tsx`, `src/pages/admin/index.tsx` and `src/pages/supplier/index.tsx` are `EmptyFrame` placeholders. `src/locales/<locale>/petstore-signin.ts` holds a placeholder title and message; `header.ts` holds only the language-flag labels. No signed-out screen, no account route.
- **Header**: `src/components/shell/AppShell.tsx` draws the "Pet Store" brand link and, in its `header` slot, defaults to `SearchBox`. No Account, Cart, Sign in or Sign out link exists. The acceptance UI test renders `src/components/storefront/StorefrontHeader` on its own and expects a main-page link, a search box, Account, Cart and Sign in / Sign out from a stubbed `GET /api/session`.
- **Internal services**: no message hand-off (`services/messaging`), no purchase-order document and no order-line table exist. checkout (SWHR2-I-0008) and order fulfilment (SWHR2-I-0011) build them.
- **Boilerplate**: `middleware/auth.ts` sets a fixed `event.context.user` read by `routes/api/hello.ts`. It is the template's example, not access control, and this change leaves it alone.
- **Acceptance suite** (`tests/acceptance/sign-on/`, red until built) fixes the interfaces: cookies `ps_sid`, `admin_sid`, `remembered_username` (`Max-Age=2678400`, or expired); routes `routes/api/session.get.ts`, `routes/api/session/sign-in.post.ts`, `routes/api/admin/sign-in.post.ts`, `routes/api/admin/session.get.ts`; harness env `ADMIN_USERS` / `SUPPLIER_USERS` as `userId:<Bun.password hash>`; the e2e finds every sign-in field by the label "User ID" (storefront included), the supplier refusal by the text "sign out of (the) admin…", and the signed-out screen at a URL containing `signed-out`.
- **CI**: `.github/workflows/ci.yml` runs `test:acceptance` and `test:acceptance:e2e` under `continue-on-error` and triggers on `vortex/**`. Neither Playwright config passes any environment to its dev server, so the e2e server would start with no administration or supplier credentials.

### Planning decisions

- **P1. Area sessions in one store.** `services/session/store.ts` replaces the module-level map in `middleware/10.session.ts`. A session carries `area` (`storefront`, `admin`, `supplier`), `locale`, `userId?` and `lastSeen`. The middleware picks the cookie by path as the Target design says (`/api/admin/**` → `admin_sid`, `/api/supplier/**` → `supplier_sid`, every other path → `ps_sid`), and the cookie `sid` is retired; `locale.post.test.ts` moves to `ps_sid`.
- **P2. Idle limits are one table in the store**, read through `Date.now()` so fake timers drive it: storefront 15 minutes, admin 54, a `sample` area 30 (P7), supplier none. An expired session is dropped together with its cart (`services/cart.ts` gains a drop by session id) and a fresh session is issued in its place.
- **P3. `signon_users` is created here.** Sign-on cannot verify a customer without it, and customer-account plans after this sprint. The table is exactly customer-account's shape, with a drizzle-kit migration; customer-account adds `customers` and the sign-up flow on top. `db/client.ts` seeds `j2ee` (hashed `j2ee`) and catalog item EST-2 when empty, outside Vitest. The full four-user sample stays with sample data population (SWHR2-I-0014).
- **P4. Operator credentials, no built-in accounts.** `ADMIN_USERS` and `SUPPLIER_USERS` are read at request time (the harness sets them after module load). When unset, administration and supplier sign-in reject every attempt; product code never falls back to a default account (avoids legacy D1). Both Playwright configs pass both variables to their dev server, with precomputed argon2id hashes of the e2e defaults (`admin` / `admin-pw`, `supplier` / `supplier-pw`).
- **P5. `GET /api/session` moves to `routes/api/session.get.ts`** and returns `{ locale, signedOn, userId?, rememberedUserName? }`. The old `session/index.get.ts` is deleted, since two files for one route conflict.
- **P6. Header in the shell slot.** `StorefrontHeader` holds the main-page link, `SearchBox`, Account (`/petstore/account`), Cart (`/petstore/cart`) and Sign in (`/petstore/signin`) or Sign out. `AppShell` renders it by default in place of its brand link and `SearchBox`, so every page carries one header (ARCHITECTURE.md Key Decision "One shell"). Header words come from `src/locales/<locale>/header.ts`.
- **P7. Framework sample application.** There is no framework sample application in this repository (Target design). Task 3.1 is met in the session store: the `sample` area's 30-minute limit, covered by a store unit test that a sample session idle 31 minutes is replaced and its state is gone. No route or screen is added for it. See SD1.
- **P8. Protected pages this sprint.** `requireCustomer` is built and unit-tested now. The only protected storefront screen that exists this sprint is `/petstore/account`, a guarded placeholder that sends a visitor to sign in and returns them after sign-on; customer-account fills it. checkout applies `requireCustomer` to its order, billing and shipping routes when it builds them. The SPA sends a visitor to `/petstore/signin?return=<path>` and returns there after sign-on.
- **P9. Internal services (tasks 6.1, 6.2) are a constraint, not code, this sprint.** No route added by this change imports a hand-off or order-line function, and the guards sit on routes only. The modules themselves, and the cases that exercise them, belong to SWHR2-I-0008 / SWHR2-I-0011.
- **P10. Supplier home after sign-in** is the existing placeholder content behind the supplier sign-in; supplier-inventory (SWHR2-I-0010) replaces it. "Launch the administration tool" links to `/admin/tool`, which order-approval (SWHR2-I-0009) builds.
- **P11. Test cases deferred.** SWHR2-C-0252 and SWHR2-C-0254 (Check Out control, shipping form) are deferred to SWHR2-I-0008; SWHR2-C-0263, SWHR2-C-0264 and SWHR2-C-0268 (messages, order lines, fulfilment harness) to SWHR2-I-0011. SWHR2-C-0251 (sample app) is retired. The 13 remaining approved cases are linked to SWHR2-T-0182.

### Spec discrepancies

- **SD1. SWHR2-R-0027 names a framework sample application the target does not have.** Resolved for this sprint by P7; the requirement still needs a Business Owner disposition (keep, or retire with the sample).
- **SD2. `signon_users` ownership.** The Target design places the table in customer-account (`db/schema/storefront.ts`); the repository has a single `db/schema.ts` and customer-account has not been built. Resolved by P3: the table is created here, in `db/schema.ts`, in customer-account's shape.
- **SD3. Storefront field label.** The spec and the brief say "user name"; the approved e2e finds the storefront field by the label "User ID". The storefront sign-in field is labelled "User ID" in en_US, which satisfies the test; the Japanese and Chinese definitions use their own words for it.
- **SD4. R-0028 vs the screens that exist.** The requirement protects order placement and shipping entry, which checkout builds later. Built as P8 (guard now, applied by checkout); C-0252 and C-0254 deferred (P11).
- **SD5. R-0121 / R-0124 describe services that do not exist yet.** Resolved by P9; C-0263, C-0264, C-0268 deferred.
- **SD6. Supplier idle limit.** The legacy supplier web module declares 54 minutes (design.md "Ambiguous approved keys", SIGN-REQ-0003 in `src/apps/supplier/a.yaml`), but no approved requirement states it, so the supplier session has no idle limit (Target design). Business Owner to confirm.
- **SD7. The admin landing's "launch" target** (`/admin/tool`) has no screen until order-approval ships; the link is present and leads to the not-found screen until then (P10).

### Phases

One ticket, SWHR2-T-0182, works the phases in this order.

1. **Storefront sign-on** (tasks 1.x): session store and middleware areas, idle limits, `signon_users` table and migration, seed, credential check, `requireCustomer`, sign-in, sign-out and session routes, remembered-name cookie, sign-in, signed-out and account screens.
2. **Storefront header** (tasks 2.x): `StorefrontHeader`, header words in three locales, `AppShell` slot.
3. **Framework sample application** (task 3.1): the `sample` idle limit in the store (P7).
4. **Administration area** (tasks 4.x): admin credential check, `requireAdmin`, admin routes, sign-in / Login Error / landing screen.
5. **Administrator and supplier separation** (tasks 5.x): supplier routes, `requireSupplier`, the `AdminSignedIn` refusal and its message on the supplier sign-in screen.
6. **Internal service access control** (tasks 6.x): confirm no route exposes an internal service (P9).
7. **Verification (test harness)** (tasks 7.x): route integration tests with a fake clock, UI tests for the header, sign-in, signed-out, admin and supplier screens, a Playwright admin-then-supplier spec, and the Playwright configs' credential environment (P4); the 13 linked sign-on acceptance cases pass.
8. **CI**: no workflow change. CI already runs the acceptance suites on every `vortex/**` push under `continue-on-error`; the credential environment lives in the Playwright configs, so CI picks it up with no workflow edit.
