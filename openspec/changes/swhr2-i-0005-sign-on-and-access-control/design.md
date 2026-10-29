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

## Planning (sprint SWHR2-S-0011)

All the work is one FEATURE, **SWHR2-T-0173**, which owns every line of `tasks.md`. Its plan is `artifacts/SWHR2-S-0011/SWHR2-T-0173/PLAN.md`. The approved mockups are listed in `artifacts/SWHR2-S-0011/design/MANIFEST.md`. This plan supersedes the one for sprint SWHR2-S-0010, which was cancelled before execution together with its FEATURE SWHR2-T-0169. The findings below were re-verified against this branch, which forks from the same `dev` commit.

### Codebase findings

- `middleware/10.session.ts` already keeps a server-owned, in-memory `{ id, locale }` session under cookie `sid`. There is one session for every path, with no expiry and no sign-on state. `routes/api/session/locale.post.test.ts` builds requests with `sid=`.
- `GET /api/session` is `routes/api/session/index.get.ts` and returns `{ locale }` only. The acceptance suite imports `routes/api/session.get`.
- The cart (`services/cart.ts`) is a module-level `Map` keyed by session id. `routes/api/cart/*.ts` fall back to the id `"anonymous"` when there is no session.
- There is no `signon_users` table, no password hashing, no `services/session/` and no admin or supplier API route. `db/schema.ts` holds `users` (the template demo) and the catalog tables. The latest migration is `drizzle/0002_*`.
- `middleware/auth.ts` is template residue. It sets `event.context.user = { name: "Yeasin" }` on every request, and only `routes/api/hello.ts` reads it.
- `src/pages/petstore/signin.tsx`, `src/pages/admin/index.tsx` and `src/pages/supplier/index.tsx` are `EmptyFrame` placeholders. The per-locale `petstore-signin` screen definitions already exist in `src/locales/{en_US,ja_JP,zh_CN}/`.
- `AppShell` draws the header and fills its slot with `<SearchBox />` by default. `src/pages/petstore.tsx` renders `LanguageFlags` and `CategoryPanel`. `src/components/storefront/StorefrontHeader.tsx` does not exist; `tests/acceptance/sign-on/header.test.tsx` imports it as a default export that fetches the session.
- The cart page (`src/pages/petstore/cart.tsx`) has no Checkout control. No account or checkout page exists. Those belong to customer-account (SWHR2-I-0006) and checkout (SWHR2-I-0008).
- There is no message hand-off service (`services/messaging`), purchase-order document or order-line table. Those belong to order-fulfillment (SWHR2-I-0011) and checkout.
- The acceptance suite for this change is already on the branch under `tests/acceptance/sign-on/`. Its contracts are the cookies `ps_sid`, `admin_sid`, `supplier_sid` and `remembered_username`; the env `ADMIN_USERS` / `SUPPLIER_USERS` (`userId:hash`, hashed with `Bun.password`); and the routes `session/sign-in.post`, `session/sign-out.post`, `session.get`, `admin/sign-in.post`, `admin/session.get` and `supplier/sign-in.post`. In CI the acceptance unit and E2E steps run with `continue-on-error`.
- `tests/acceptance/localization/server.test.ts` signs in as `张伟` / `山田太郎` with a **form-encoded** body to `session/sign-in.post`, so that route must accept form-encoded as well as JSON bodies.

### Decisions

- **P1 Session store.** `services/session/store.ts` owns the sessions (`create`, `get`, `touch`, `drop`), with an idle limit for each area. `lastSeen` is read from `Date.now()`, because the acceptance tests fake only `Date`. `middleware/10.session.ts` picks the area from the path (`/api/admin/**` → `admin_sid`, `/api/supplier/**` → `supplier_sid`, else `ps_sid`) and sets `event.context.session`. The cookie `sid` is renamed `ps_sid`, and `routes/api/session/locale.post.test.ts` follows.
- **P2 Session read.** Move `routes/api/session/index.get.ts` to `routes/api/session.get.ts`. It returns `{ locale, signedOn, userId?, rememberedUserName? }`, where `rememberedUserName` is read from the `remembered_username` cookie.
- **P3 Cart follows the session id.** When a session expires or is signed out, its cart is dropped (`services/cart.ts` gains `dropCart(id)`). The new session id starts with an empty cart. The cart is still not stored in the session object.
- **P4 Minimal `signon_users`.** This change adds `signon_users (user_id text primary key, password_hash text not null)` and its migration `drizzle/0003_*`. customer-account later extends it and adds `customers`. `db/client.ts` seeds `j2ee` / `j2ee` (hashed) into an empty `signon_users` outside Vitest, the same way it seeds the catalog, so the E2E sign-in has an account. data-population (SWHR2-I-0014) later replaces this seed with its four users.
- **P5 Sign-in route.** `POST /api/session/sign-in` accepts JSON or form-encoded `{ userId, password, remember }`. Only after a successful credential check does it set `remembered_username=<userId>; Max-Age=2678400` or expire that cookie. This deliberately does not reproduce legacy defect D8. A rejected sign-in returns 401 and changes neither cookie.
- **P6 Customer guard and return.** `requireCustomer(event)` throws 401 `{ kind: "SignOnRequired" }`. On the SPA side, a `RequireSignOn` wrapper sends a visitor to `/petstore/signin?next=<path>`, and a successful sign-in navigates to `next` (D7: with no `next`, it goes to `/petstore`). This change adds guarded placeholder pages `/petstore/account` and `/petstore/checkout` and a Checkout control on the cart page. customer-account and checkout fill those pages later and put `requireCustomer` on their own API routes.
- **P7 Header.** `StorefrontHeader` reads `GET /api/session`. It draws the main-page link, `SearchBox`, an `Account` link (`/petstore/account`), a `Cart` link (`/petstore/cart`), and **Sign in** (`/petstore/signin`) or **Sign out** (`POST /api/session/sign-out`, then `/petstore/signed-out`). It is the shell's header on `/` and every `/petstore/**` page, because C-0253 starts at `/`. The admin and supplier areas keep their own header content. Its labels come from the existing `header` screen definitions in each locale.
- **P8 Staff areas.** The admin and supplier sign-in routes check credentials against `ADMIN_USERS` / `SUPPLIER_USERS` with `Bun.password.verify`. With a variable unset, every sign-in to that area is refused, so the store has no built-in account and no pre-filled credentials (D1). `POST /api/supplier/sign-in` returns 409 `{ kind: "AdminSignedIn" }` while the request carries a **live** `admin_sid`. Admin `GET /api/admin/session` is guarded by `requireAdmin`. Supplier gets `GET /api/supplier/session` (guarded by `requireSupplier`) and sign-out. The admin landing's "Launch the administration tool" links to `/admin/tool`, which order-approval builds. The E2E web servers get test-only `ADMIN_USERS` / `SUPPLIER_USERS` for `admin`/`admin-pw` and `supplier`/`supplier-pw` as precomputed hash literals in the Playwright configs' `webServer.env`, because the config is not loaded under Bun.
- **P9 Template residue.** `middleware/auth.ts` is deleted, and `routes/api/hello.ts` and its test stop reading `event.context.user`, so no middleware fakes an identity beside the real session.

### Phases

1. **Session core** (tasks 1.5, 3.1, 4.4): store, middleware, per-area idle limits, cart drop, cookie rename (P1–P3).
2. **Storefront sign-on** (tasks 1.1–1.4): `signon_users` and the seed, the sign-in, sign-out and session routes, `requireCustomer`, the sign-in and signed-out screens, the guarded placeholders (P4–P6).
3. **Header** (tasks 2.1–2.2), per P7.
4. **Staff areas** (tasks 4.1–4.3, 5.1–5.2): admin and supplier routes, guards, screens (P8).
5. **Internal services** (tasks 6.1–6.2): no route this change adds may import a hand-off or order-line module. See SD4.
6. **Test harness**: route integration tests beside each new route (real `H3Event`, fake `Date`), a store unit test covering 15, 30 and 54 minutes, UI tests for the header and the sign-in, signed-out, admin and supplier screens, and one product E2E spec under `e2e/` for sign in → sign out and admin → supplier. The approved acceptance cases in `tests/acceptance/sign-on/` are the oracle and stay unedited.
7. **CI**: no workflow change is needed. `.github/workflows/ci.yml` already runs the unit, E2E and acceptance tiers on `vortex/**` pushes and PRs. The only CI-visible change is the `webServer.env` credentials (P8). Acceptance steps stay `continue-on-error` until every capability has shipped.

## Spec discrepancies

Each item was found while planning and is recorded on SWHR2-T-0173 as well. None of them edits the delta spec.

- **SD1 Framework sample application (SWHR2-R-0027).** This repository has no framework sample application, and its only test case (SWHR2-C-0251) is retired. The FEATURE gives the session store a per-area idle limit and covers a 30-minute limit in a store unit test. It builds no sample application. The requirement still needs the Business Owner disposition this design asks for.
- **SD2 Checkout and account pages do not exist.** SWHR2-R-0028's scenarios are about placing an order, editing the account and entering shipping information, and those screens belong to SWHR2-I-0006 and SWHR2-I-0008. This change delivers the guard and guarded placeholders (P6), so C-0252 and C-0253 can pass now. C-0254 asserts a "first name" field on the shipping form, so it stays red until checkout ships.
- **SD3 `signon_users` is customer-account's table.** The design names customer-account as the owner, but sign-on is built first and cannot verify a customer without it. The FEATURE creates the minimal table (P4), and customer-account extends it rather than recreating it.
- **SD4 The hand-off service and order lines do not exist.** C-0263, C-0264 and C-0268 import `tests/acceptance/checkout/harness.ts`, `tests/acceptance/order-fulfillment/harness.ts`, `services/documents/purchase-order` and the `messages` / `op_po_line_items` tables. All of these belong to SWHR2-I-0008 and SWHR2-I-0011. In this sprint, SWHR2-R-0121 and SWHR2-R-0124 constrain only what the FEATURE adds (no route that reaches them, no role check placed in them). The three cases are expected red until those capabilities ship.
- **SD5 Remembered name written before the check (D8).** The legacy store sets or clears the cookie before checking credentials. The approved scenarios only cover a successful sign-on, and the FEATURE writes the cookie only after success (P5).
- **SD6 The supplier area has no idle limit.** No approved requirement gives one (the 54-minute supplier record, SIGN-REQ-0003 in `src/apps/supplier/a.yaml`, was not approved). A supplier session ends at sign-out or server restart.
