# Design notes: customer-account (legacy implementation)

These notes record how Java Pet Store 1.3.2 implements the capability. They are evidence for the requirements in `specs/customer-account/spec.md`. They do not describe the replacement system. Paths are relative to `legacy-source/petstore1.3.2/`.

## Source map

| Concern                             | Legacy location                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer, Account, Profile entities | `src/components/customer` (CMP 2.x `CustomerEJB`, `AccountEJB`, `ProfileEJB`; `ejb-jar.xml`)                                                                  |
| Contact information                 | `src/components/contactinfo` (`ContactInfoEJB`, `ContactInfo.dtd`)                                                                                            |
| Postal address                      | `src/components/address` (`AddressEJB`, `Address` value object, `Address.dtd`)                                                                                |
| Payment card                        | `src/components/creditcard` (`CreditCardEJB`)                                                                                                                 |
| Sign-on user (user name, password)  | `src/components/signon` (`SignOnEJB`, `UserEJB`)                                                                                                              |
| Storefront flow, forms, screens     | `src/apps/petstore` (`mappings.xml`, `CreateUserHTMLAction`, `CreateUserEJBAction`, `CustomerHTMLAction`, `CustomerEJBAction`, `CreateUserFlowHandler`, JSPs) |
| Browser-side empty-field check      | `src/waf` smart taglib (`FormTag`, `InputTag`)                                                                                                                |
| Deployed DDL                        | `src/apps/petstore/src/sun-j2ee-ri.xml` lines 112-418                                                                                                         |
| User documentation                  | `docs/using.html` lines 148-166                                                                                                                               |

## Data model as deployed

- `CustomerEJBTable` primary key `userId` VARCHAR(255), with key columns to account and profile (sun-j2ee-ri.xml:308).
- `AccountEJBTable.status` is a nullable VARCHAR with no CHECK. `AccountLocalHome` declares the constants `Active = "active"` and `Disabled = "disabled"`.
- `ProfileEJBTable`: `bannerPreference` and `myListPreference` BOOLEAN NOT NULL. `preferredLanguage` and `favoriteCategory` are nullable VARCHAR(255) (sun-j2ee-ri.xml:354). Defaults come from `ProfileLocalHome` constants: `en_US`, null, true, true.
- `ContactInfoEJBTable`, `AddressEJBTable` and `CreditCardEJBTable` are all VARCHAR(255) columns. Address and card have container-generated keys (`prim-key-class java.lang.Object`) and no finder other than by key.
- `UserEJBTable` primary key `userName`. The password is stored as given.
- Card expiry is a single string `"MM/YYYY"`, which `CustomerHTMLAction` (lines 175-178) builds from two select boxes. `CreditCardEJB.getExpiryMonth/Year` split it on the first `/`, with literal fallbacks `"01"` and `"2010"` (lines 95 and 106).
- Every relation is declared One/One with `<cascade-delete/>` on the dependent side (customer `ejb-jar.xml` 277-368; contactinfo `ejb-jar.xml` 139-146). Every container-transaction entry uses `Required`. Every data-component method permission is `<unchecked/>`, and the beans have local interfaces only.

## Sign-up and account flow

1. `signon.jsp` "new customer" form posts `j_username`, `j_password` and `j_password_2` to `createuser.do`. `CreateUserHTMLAction` (76-87) only null-checks the user name and the first password. Lines 77-78 are redacted in the ingested source.
2. `CreateUserEJBAction` (84-101) calls `SignOnLocal.createUser` and sets the facade `userId`. Any `ServiceLocatorException` or `CreateException` becomes `DuplicateAccountException`, which `mappings.xml:111` routes to `duplicate_account.screen` (message at `duplicate_account.jsp:44-48`).
3. `UserEJB.ejbCreate` (61-76) enforces user name length ≤ 25 (`UserLocal.MAX_USERID_LENGTH`), no `%` or `*`, and password length ≤ `MAX_PASSWD_LENGTH`. The value of that constant is redacted at `UserLocal.java:47`.
4. `create_customer.screen` (`create_customer.jsp`) posts `action=create` to `createcustomer.do`. `CustomerEJBAction` CREATE calls `facade.createCustomer(userId)` and then `updateCustomer`, which deep-copies into the contact, address, card and profile beans.
5. `CustomerHTMLAction.doEnd` (255-266) sets `SignOnFilter.SIGNED_ON_USER`, which fires the sign-on notifier. `CreateUserFlowHandler` (64-73) returns to `SignOnFilter.ORIGINAL_URL`, or to the main screen when that URL was `customer.do`.
6. View: `customer.do` (protected) leads to `customer.screen` (`customer.jsp`, read-only; language and category rendered through a non-editable select). The "Edit Your Account Information" link at line 213 goes to `update_customer.screen` (`edit_customer.jsp`), which posts `action=update` to `customer.do`.
7. `CustomerEJBAction.updateCustomer` ends with `machine.setAttribute("locale", locale)`. The key is the literal `"locale"`, but the rest of the store reads `PetstoreKeys.LOCALE` (`ChangeLocaleEJBAction`, `SignOnEJBAction`, `OrderEJBAction:126-127`). So the cart and order locale do not follow the save until the next sign-on.

## Validation as implemented

- `CustomerHTMLAction.extractContactInfo` (182-253) collects missing required contact fields into a `MissingFormDataException`, stores it in request attribute `missing_form_data_exception` (which no JSP reads) and returns null. `CustomerEJBAction` (114-116) then dereferences the null, so the customer sees a general error page.
- `extractCreditCard` and `extractProfileInfo` (140-178) build missing-field lists and then discard them. The card type, expiry month and expiry year checks all test the card-number field.
- `edit_customer.jsp` marks most contact fields for the waf browser-side check (not last name). `create_customer.jsp` is a plain form with no browser-side check. The waf check (`FormTag.java:84-111`) emits a `validate_<form>()` script that alerts `"<field> is empty."`.
- The address and card components validate nothing on store. `Address.fromDOM` (157-180) is the only address check, and it applies only to XML exchange (purchase orders).

## Screen and form implementation notes

- Account screen: `customer.jsp` lines 124-214. The card number is printed with `c:out` and is not masked. MyList and banner are rendered as green "Yes" / red "No".
- Sign-up account form: `create_customer.jsp` lines 44-229. Contact fields are pre-filled with demo values ("Duke", "1234 Moon Way", …). State options are California, New York and Texas only. Country values are USA, Canada, Japan and China. Card type values are "Java(TM) Card", "Duke Express" and "Meow Club" (label "Meow Card"). Expiry years are 2001-2004.
- Edit form: `edit_customer.jsp`. Card type value is "Meow Card" and expiry years are 2002-2005, so it disagrees with the sign-up form.
- My List: `mylist.jsp` 59-93 renders when `myListPreference` is true and queries catalog start 0, count 10 for `favoriteCategory`. A JSP comment notes the truncation.
- Banner: `advice_banner.jsp` plus `BannerHelper` (55-73), included only in the `main` and `cart` screen definitions (`screendefinitions_en_US.xml` 45-62). `BannerHelper.setCategoryId` lower-cases its argument without a null guard.

## Open questions and disputes (for SME / Intent)

- **Q1 Country on exchanged addresses.** `Address.dtd` declares `Country?` (optional), but `Address.fromDOM` requires it. The spec records the code behaviour (required). Whether country is mandatory goes to Intent.
- **Q2 Card types and expiry window.** The create and edit forms disagree ("Meow Club" vs "Meow Card"; 2001-2004 vs 2002-2005), and there is no server-side list. The canonical list is an SME decision.
- **Q3 Password maximum length.** Redacted in the ingested source. Needs the original 1.3.2 source.
- **Q4 Password confirmation.** Redacted lines 77-78 of `CreateUserHTMLAction` leave open whether a comparison exists. The visible condition does not compare.
- **Q5 Account status "disabled".** Declared but never set or read anywhere in the tree (unresolved reachability). The spec states the two values and attaches no behaviour to "disabled".
- **Q6 Stand-alone registration servlet.** `components/signon/.../CreateUserServlet` is excluded from the petstore build (`build.xml:204-205`), and no `web.xml` maps it. The SME approved its record (signon `CUST-WF-0001`), so it is specified as SWHR2-R-0013; whether it is deployed anywhere remains open.
- **Q7 Preferred language switch.** Pass a says the store language switches on save. Pass b shows the save writes a different session key from the one the cart and orders read. The spec follows pass b, which traces the key mismatch.

## Suspected legacy defects (for the Business Owner's defect register)

| #    | Defect                                                                                                           | Evidence                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| SD1  | Full card number shown on the account screen, pre-filled on the edit form, and stored in clear text              | `customer.jsp:130-134`, `edit_customer.jsp:214-218`, sun-j2ee-ri.xml:112                                 |
| SD2  | Missing required contact fields end in a general server error instead of a message                               | `CustomerHTMLAction.java:245-249`, `CustomerEJBAction.java:114-116`                                      |
| SD3  | Card and profile missing-field checks are discarded and test the wrong field                                     | `CustomerHTMLAction.java:151-174`                                                                        |
| SD4  | Repeated password never compared                                                                                 | `CreateUserHTMLAction.java:76-87`                                                                        |
| SD5  | Infrastructure failure at sign-up reported as "user name in use"                                                 | `CreateUserEJBAction.java:84-92`                                                                         |
| SD6  | Abandoned sign-up leaves a sign-on user with no customer, who then cannot sign in (null profile)                 | `CreateUserEJBAction.java:93-98`, `PetstoreComponentManager.java:110-122`, `SignOnNotifier.java:133-141` |
| SD7  | Preferred-language save uses a different session key from the rest of the store                                  | `CustomerEJBAction.java:142-144`                                                                         |
| SD8  | Missing or malformed expiry reported as January 2010                                                             | `CreditCardEJB.java:95,106`                                                                              |
| SD9  | A stored address (blank fields, blank second line handling) can be written as XML the reader rejects             | `Address.java:144-180`                                                                                   |
| SD10 | A contact created from separate fields may be linked to a null address and fail on read                          | `ContactInfoEJB.java:81-127`                                                                             |
| SD11 | A failed sub-record lookup during customer creation is thrown as an application exception and does not roll back | customer `ejb-jar.xml:713-723`, `CustomerEJB.java:86-88`                                                 |
| SD12 | The stand-alone registration servlet writes the password to the server log (dead code, see Q6)                   | `CreateUserServlet.java`                                                                                 |
| SD13 | The account edit screen (`update_customer.screen`) is not in the sign-on protected list (filed under sign-on)    | `signon-config.xml:49-63`                                                                                |
| SD14 | Account creation's return step fails when no original page was recorded                                          | `CreateUserFlowHandler.java:64-73`                                                                       |

## Record-to-requirement map

| Requirement (ID)                                          | Source record (pass module)                   |
| --------------------------------------------------------- | --------------------------------------------- |
| Password entered twice at sign-up (SWHR2-R-0009)          | ACCT-BR-0003 (petstore a)                     |
| Payment card type and expiry year options (SWHR2-R-0010)  | ACCT-RULE-0009 (petstore b)                   |
| Customer profile defaults at creation (SWHR2-R-0011)      | CUST-BR-0003 (customer a; customer b agrees)  |
| Account status values (SWHR2-R-0012)                      | CUST-BR-0005 (customer a)                     |
| Stand-alone user registration (SWHR2-R-0013)              | CUST-WF-0001 (signon a)                       |
| My List panel for the favourite category (SWHR2-R-0053)   | ACCT-BR-0010 (petstore a)                     |
| Pet-tips banner for the favourite category (SWHR2-R-0054) | ACCT-BR-0011 (petstore a)                     |
| Sign-up from the sign-in screen (SWHR2-R-0055)            | ACCT-REQ-0001 (petstore b)                    |
| One customer per user id (SWHR2-R-0056)                   | CUST-BR-0001 (customer a)                     |
| Customer creation is all-or-nothing (SWHR2-R-0057)        | CUST-BR-0009 (customer b)                     |
| Customer record keyed by user id (SWHR2-R-0128)           | CUST-ENT-0001 (customer a)                    |
| Customer profile contents (SWHR2-R-0129)                  | CUST-ENT-0002 (customer a)                    |
| Account contents (SWHR2-R-0058)                           | CUST-ENT-0003 (customer a)                    |
| Contact information snapshot (SWHR2-R-0059)               | CUST-REQ-0002 (contactinfo b)                 |
| Address operations are transactional (SWHR2-R-0060)       | CUST-RULE-0006 (address b)                    |
| Account creation before purchase (SWHR2-R-0061)           | CUSTOMER-ACCOUNT-WF-0001 (docs a; b, c agree) |

Every other record of the capability is pending SME review and is Not specified in `spec.md`. That includes the capability's one screen record (ACCT-SCR-0009, the account screen): the validator refuses a requirement without an approved `ID:` line, so the screen requirement is added once an SME approves the record (recommendation: approve with the card number masked, see SD1). The legacy notes above still cover the pending records as evidence for the reviewers.

Record keys are reused across modules: `CUST-BR-0003`, for example, names a different rule in the address, contactinfo, creditcard, customer and signon passes. The approved key `SWHR2-R-0011` is read as the customer-module record (profile defaults), the only one of them that both customer passes state identically. If the SME approved a different module's `CUST-BR-0003`, that requirement must be rewritten from that record. The same reading was applied to the other reused keys: `CUST-BR-0001`, `CUST-ENT-0001`, `CUST-ENT-0002` and `CUST-ENT-0003` are read as the customer-module records; `ACCT-REQ-0001` as the petstore pass-b record (sign-up), not the creditcard pass-a record (empty card at account creation); `CUST-REQ-0002` as the contactinfo record (contact snapshot), not the address record (system-generated address key).

Legacy notes behind the approved requirements:

- SWHR2-R-0009: `signon.jsp` carries `j_password` and `j_password_2`; `CreateUserHTMLAction.java:76-87` reads both (lines 77-78 redacted) and tests only for null. The empty-field check is the waf smart-form taglib. See Q4 and SD4.
- SWHR2-R-0010: option lists exist only in `create_customer.jsp:143-147` and `edit_customer.jsp`; the two disagree on the Meow value and the year window (see Q2). The requirement fixes the labels and that the year is chosen from a fixed list; the window itself is the SME decision in Q2.
- SWHR2-R-0011: `ProfileLocalHome.java:44-47` constants passed by `CustomerEJB.ejbPostCreate`; the sign-up flow may overwrite them with form values.
- SWHR2-R-0012: `AccountLocalHome.java:48-49`; only "active" is ever used, and nothing reads the status (see Q5). No behaviour is attached to "disabled".
- SWHR2-R-0013: `CreateUserServlet.java:70-74`, excluded by `apps/petstore/src/build.xml:204-205` and mapped by no `web.xml` (see Q6). The SME approved it as stated, so it is specified despite the reachability dispute.
- SWHR2-R-0053: `mylist.jsp:59-71,90-93`; the catalog query is start 0, count 10, so larger categories are cut off (the JSP comment admits it).
- SWHR2-R-0054: `advice_banner.jsp:59-68` and `BannerHelper.java:55-73` (lower-cases the category, defaults to `banner_dogs.gif`); only the `main` and `cart` screen definitions include the banner (`screendefinitions_en_US.xml:45-62`).
- SWHR2-R-0055: `signon.jsp:131-183` posts to `createuser.do`; `CreateUserEJBAction.java:93-101` turns every failure into `DuplicateAccountException`, routed by `mappings.xml:111` to `duplicate_account.jsp:44-48`.
- SWHR2-R-0056: uniqueness comes only from the `CustomerEJBTable` primary key on `userId` (`sun-j2ee-ri.xml:308`); there is no explicit check in the component.
- SWHR2-R-0057: every customer-module method is `Required` (`customer/src/ejb-jar.xml:675-683`), so the nested account, profile, contact and card creates share one transaction (`CustomerEJB.java:86-88`).
- SWHR2-R-0128 / SWHR2-R-0129 / SWHR2-R-0058: `CustomerEJB`, `ProfileEJB`, `AccountEJB` CMP fields and one-to-one CMRs in `customer/src/ejb-jar.xml`; `ProfileEJBTable` declares the two preference columns `BOOLEAN NOT NULL` (`sun-j2ee-ri.xml:354`); the account status column is nullable (`sun-j2ee-ri.xml:267`).
- SWHR2-R-0059: `ContactInfoEJB.getData()` (129-137) builds a value object, mapping telephone to `phone` and copying the address through `getAddress().getData()`.
- SWHR2-R-0060: `address/src/ejb-jar.xml:250-258,379-387` declares `Required` on the getters, setters, `getData` and `remove`; the create and find methods have no entry and take the container default.
- SWHR2-R-0061: `docs/using.html:148-166` ("Creating a New User"); the code flow is ACCT-WF-0001 / ACCT-WF-0006, still pending.
- Account screen (ACCT-SCR-0009): `customer.jsp:124-141,151-157,213-214`; the card number is printed unmasked (SD1).

## Target design

### Components

- **Customer service** `services/customers/index.ts`:
  - `registerUser(userId, password)` creates the sign-on user. It fails with `UserExists` when the id is taken (SWHR2-R-0013, SWHR2-R-0055).
  - `createCustomer(userId, account, profile?)` creates the customer, the account, the contact information, the address, the payment card and the profile in one transaction, so that if any insert fails none of them are kept (SWHR2-R-0057). It refuses a user id that already has a customer (SWHR2-R-0056). The account status is "active" (SWHR2-R-0012). A missing profile uses the defaults: preferred language en_US, no favourite category, MyList on and banner on (SWHR2-R-0011).
  - `getCustomer(userId)` and `updateCustomer(userId, changes)`.
  - `listCustomers()` (data-population SWHR2-R-0068).
- **Address operations** `services/customers/address.ts`: field reads and updates, the whole-address read and address removal. Each takes an optional Drizzle transaction `tx`, runs inside it when given, and opens its own transaction otherwise (SWHR2-R-0060).
- **Contact snapshot**: `contactSnapshot(contactId)` returns a frozen plain-object copy of the given name, family name, telephone, e-mail and a copy of the address. Changing the snapshot never writes back (SWHR2-R-0059).
- **Sign-up flow** (SWHR2-R-0009, SWHR2-R-0055, SWHR2-R-0061):
  1. On the sign-in screen, the new-customer form takes a user name and the password twice. Each password field is checked as not empty before submit. Whether the two match is not checked, which is the specified suspected legacy defect.
  2. Submit calls `POST /api/account/register`. If the name is taken, the SPA shows `src/pages/petstore/user-creation-error.tsx` ("the user name is in use; choose another") with a route back to sign-in.
  3. On success the user is signed on and continues to the account form.
- **Account information page** `src/pages/petstore/account.tsx`, guarded by sign-on. It holds the contact details and address; the card type, offering only Java(TM) Card, Duke Express and Meow Card; the card expiry year, a select over a fixed year list with no free-text entry (SWHR2-R-0010); and the profile preferences (preferred language, favourite category, MyList, banner). Saving a new account calls `POST /api/account`, and saving an existing one calls `PUT /api/account`.
- **My List panel** `src/components/storefront/MyListPanel.tsx`. While a signed-on customer's MyList preference is on, it lists up to the first 10 products of the favourite category, each linking to its product page. It reads them through the catalog service by name order, with start 0 and size 10. It is not rendered when the preference is off (SWHR2-R-0053).
- **Pet-tips banner** `src/components/storefront/PetTipsBanner.tsx`. While the banner preference is on, the Home and Cart screens only render the banner for the favourite category (dogs, cats, reptiles, birds or fish), and the dogs banner for any other category (SWHR2-R-0054).

### Data

These tables are in `db/schema/storefront.ts`, and building them produces one new drizzle-kit migration in `drizzle/`.

- `signon_users`: `user_id` text primary key and `password_hash` not null.
- `customers`: `user_id` primary key, referencing `signon_users`. One customer per user id (SWHR2-R-0128).
- `customer_accounts`: `user_id` primary key, referencing `customers`.
  - `status` text not null, with `CHECK(status IN ('active','disabled'))` and default 'active'.
  - `contact_id` not null, referencing `contact_info`.
  - The payment card fields `card_number`, `card_type` and `card_expiry_month` / `card_expiry_year`, all not null.

  An account therefore has exactly one contact and one card (SWHR2-R-0058).

- `contact_info`: `id` primary key, `given_name`, `family_name`, `telephone`, `email`, and `address_id` not null, referencing `addresses`. A contact links an existing address rather than copying it (data-population SWHR2-R-0070).
- `addresses`: `id`, `street1`, `street2`, `city`, `state`, `zip` and `country`.
- `customer_profiles`: `user_id` primary key, referencing `customers`.
  - `preferred_language` not null, default 'en_US'.
  - `favourite_category` nullable.
  - `my_list_on` and `banner_on`, integer booleans, not null, default 1 (SWHR2-R-0129).

The fixed expiry-year list and the three card types are constants in `shared/account.ts`. They are used by the form and validated by the route.

### Interfaces

| Route                                   | Behaviour                                                                                                                       | Authorisation |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `POST /api/account/register`            | `{ userId, password, passwordRepeat }`. Rejects a blank field with 400. 409 `UserExists` routes the SPA to User Creation Error. | none          |
| `GET /api/account`                      | Returns the signed-on customer's account and profile.                                                                           | customer      |
| `POST /api/account`, `PUT /api/account` | Create or update; 400 on invalid card type or year.                                                                             | customer      |
| `GET /api/account/my-list`              | Returns `[]` when the preference is off.                                                                                        | customer      |

`GET /api/session` (sign-on) carries `preferences: { myList, banner, favouriteCategory }`, so the shell can decide whether to render the panel and the banner.

### Stack choices

- Drizzle ORM over SQLite (`drizzle-orm/bun-sqlite`), with `db.transaction()` for all-or-nothing creation and an optional `tx` parameter to join a caller's transaction.
- `Bun.password` hashing (sign-on).
- Nitro (H3) routes under `routes/api/account/`, and SPA pages and components with Tailwind and the shadcn/ui-style primitives.
- Tests: route integration tests covering duplicate user, failed profile rolling back the account, and profile defaults; UI tests for the account form choices, My List limits and banner placement; a Playwright sign-up spec.

## Planning — SWHR2-S-0015

Added at sprint planning (SWHR2-T-0238). The FEATURE SWHR2-T-0239 owns every task group and works them in order. Its per-ticket steps are in `artifacts/SWHR2-S-0015/SWHR2-T-0239/PLAN.md`.

### Codebase findings (measured on the sprint branch, 2026-10-30)

- `db/schema.ts` is a single file. There is no `db/schema/` directory. `signon_users (user_id, password_hash)` already exists: sign-on created it in migration `drizzle/0003_kind_gladiator.sql`, and its comment reserves the table for this change. The latest migration is 0003.
- `db/client.ts` registers every table in the drizzle `schema` map, runs migrations, turns foreign keys on, and seeds dev data outside Vitest. That data is the `j2ee`/`j2ee` sign-on user (no customer row) and a catalog with FISH, REPTILES and other products, but no BIRDS product. Under Vitest it is an in-memory database.
- `services/session/auth.ts#verifyCustomer` checks `signon_users` with `Bun.password.verify`. `routes/api/session/sign-in.post.ts` signs on with `renewSession(event, userId)`. `services/session/guards.ts#requireCustomer` returns the user id or a 401 `SignOnRequired`.
- `routes/api/account/index.get.ts` returns only `{ userId }`. `src/pages/petstore/account.tsx` shows "Signed in as …", and on a 401 it sends the visitor to `/petstore/signin?return=/petstore/account`.
- `src/pages/petstore/signin.tsx` already draws the New customer form: user name and two pass-phrase fields. Its submit is a no-op, the fields are not `required`, and its labels ("Choose a pass phrase") do not contain the word "password".
- `routes/api/session.get.ts` returns `{ locale, signedOn, userId?, rememberedUserName? }` and no preferences.
- Screens: `/` (`src/pages/index.tsx`, the app home with PetMap and CategoryPanel, inside its own `LocaleProvider`). `/petstore/*` (`src/pages/petstore.tsx` layout with LanguageFlags, CategoryPanel and an outlet). `/petstore` (storefront home). `/petstore/cart`.
- Screen text comes from `src/locales/<locale>/<screen>.ts` registered in `src/locales/registry.ts`, read with `useScreen`.
- `services/catalog#listProducts(categoryId, locale, start, size)` returns a name-ordered page through the 5-minute list cache.
- The locked acceptance suite `tests/acceptance/customer-account/` already exists (`harness.ts`, `service.test.ts`, `register.test.ts`, `forms.test.tsx`, `e2e/account.spec.ts`). It is the binding contract for the module paths, export names, table and column names, and labels listed under Interface contracts below.
- CI: `.github/workflows/ci.yml` runs on pull requests to `vortex/**`, `dev` and `main`, and on pushes to `dev`. It runs the unit suite, `test:acceptance`, and `test:acceptance:e2e` (continue-on-error while the suite is red), plus the red-green replay on pull requests into a sprint branch.

### Planning decisions

- **P1 Schema location.** The six new tables go into the existing `db/schema.ts` and are registered in `db/client.ts`. They are `customers`, `customer_accounts`, `contact_info`, `addresses` and `customer_profiles`, with `signon_users` kept as it is. This replaces the `db/schema/storefront.ts` named under Data. One drizzle-kit migration (0004) is generated and committed.
- **P2 Transactions are synchronous.** `drizzle-orm/bun-sqlite` runs a `db.transaction` callback synchronously, so `createCustomer` and the address operations must do all their writes inside a synchronous callback, with no `await` inside it. The exported functions may still return promises.
  - Address operations take an optional `tx`. Without one they call `db.transaction` on the module's `db` binding at call time. Acceptance C-0173 spies on `db.transaction`, so a captured reference would miss it.
- **P3 Registration answers with JSON, not HTTP redirects.** `POST /api/account/register` behaves as follows:
  - success: it hashes the password with `Bun.password`, signs the visitor on with `renewSession`, and answers 2xx with `{ userId, next: "/petstore/account" }`;
  - user id taken: 409 `{ kind: "UserExists" }`;
  - blank field: 400.
    The SPA does the "redirect": it navigates to `/petstore/account` on success and to `/petstore/user-creation-error` on 409. Acceptance C-0155/C-0156 assert the status codes.
- **P4 Sign-up form.** The existing New customer form submits to the route above.
  - All three inputs are `required`, so an empty field never reaches the server and the browser reports it (SWHR2-R-0009.02).
  - Labels: "User name", "Password", "Repeat password". The two passwords are not compared.
- **P5 Account information page** (`/petstore/account`). `GET /api/account` returns `{ userId, customer? }`.
  - No customer: the page shows the empty form and saves with `POST`.
  - Customer exists: it pre-fills and saves with `PUT`.
  - Any 2xx response without `customer` (including one carrying only session fields) renders the empty form.
  - On save the page returns to `/petstore`.
  - The response never carries the full card number: last four digits only (SD1). In edit mode the card-number field starts empty, and leaving it blank keeps the stored number.
- **P6 `PUT /api/account` is a partial update** of `{ profile?, contact?, card?, status? }`, applied in one transaction. A signed-on user with no customer gets 404 `NoCustomer`.
- **P7 Dev seed.** Outside Vitest, `db/client.ts` gives the seeded `j2ee` a full customer through `createCustomer` with the default profile, so the e2e `PUT /api/account` is always an update. It also adds one BIRDS product, `AV-CB-01` (Amazon Parrot) in all three locales, with one item. Data-population (SWHR2-I-0014) replaces both seeds.
- **P8 Preferences reach the shell through the session.** For a signed-on customer, `GET /api/session` adds `preferences: { myList, banner, favouriteCategory }`, read from `customer_profiles` on each call.
  - `PetTipsBanner` takes `screen` and renders only for `home` or `cart` with the banner preference on. It carries `data-testid="pet-tips-banner"` and `data-category` set to `dogs|cats|reptiles|birds|fish`, with `dogs` for any other value. It is mounted on `/`, `/petstore` and `/petstore/cart`.
  - `MyListPanel` (`data-testid="my-list"`) renders only with the MyList preference on. It reads `GET /api/account/my-list` → `{ items: [{ productId, name }] }`, which comes from `listProducts(favourite, locale, 0, 10)`, and it links each item to `/petstore/product/<productId>`. It is mounted in the `/petstore` layout and on `/`.
- **P9 Card constants** live in `shared/account.ts`:
  - `CARD_TYPES` = Java(TM) Card, Duke Express, Meow Card;
  - `EXPIRY_YEARS` = a fixed list, 2026 to 2035. It is provisional until Q2 is answered, and it must contain 2030, the year the acceptance fixture uses.
    The account routes reject other values with 400. The service stores what it is given, as the legacy components did.
- **P10 Screen text** goes in a new `account` screen definition for en_US, ja_JP and zh_CN (account form and User Creation Error), plus the sign-up label changes in `signon`.
- **P11 Language save.** Saving the profile's preferred language does not change the session locale. No approved requirement covers it (Q7, SD7).

### Interface contracts fixed by the locked acceptance suite

- **`services/customers/index.ts`** exports:
  - `registerUser(userId, password)`
  - `createCustomer(userId, { contact: { givenName, familyName, telephone, email, address: { street1, street2, city, state, zip, country } }, card: { cardNumber, cardType, expiryMonth, expiryYear } }, profile?: { preferredLanguage?, favouriteCategory?, myListOn?, bannerOn? })`. It rejects a duplicate.
  - `getCustomer(userId)`, which returns one object
  - `updateCustomer(userId, { profile?, status?, contact?, card? })`
  - `contactSnapshot(contactId)`, which returns a fresh copy each call, with the address copied too
- **`services/customers/address.ts`** exports `updateAddressField(addressId, field, value, tx?)`.
- **Tables and columns:**
  - `customers(user_id)`
  - `customer_accounts(user_id, status, contact_id, card_number, …)`, with `status` checked to `active|disabled`, default `active`
  - `contact_info(id, given_name, family_name, telephone, email, address_id)`
  - `addresses(id, street1, street2, city, state, zip, country)`
  - `customer_profiles(user_id, preferred_language, favourite_category, my_list_on, banner_on)`. The two flags are `integer NOT NULL default 1`.
- **Routes:** `routes/api/account/register.post.ts` and `routes/api/account/my-list.get.ts`.
- **Components:** `src/pages/petstore/account.tsx` and `src/components/storefront/PetTipsBanner.tsx` (default exports).
- **Labels:**
  - On the account page, exactly one control matches /card type/i (a select of the three types).
  - Exactly one control matches /(expir|year)/i: the expiry-year `<select>`. The month control's label must contain neither word, for example "Month".
  - Text inputs are labelled given name, family name, phone, e-mail, street, city, state, zip and country, plus card number. State and country are text inputs.
- **Sign-up form:** it is the `<form>` containing "New customer". Its user field matches /user (name|id)/i, and its first and last /password/i fields are the two passwords.

### Phases

1. Data model and migration (tasks 1.x).
2. Customer service and address operations (2.x).
3. Routes: register, account GET/POST/PUT, my-list, and session preferences (3.3, 3.4, 5.x data).
4. Screens: sign-up wiring, User Creation Error, account page, My List panel, pet-tips banner, locale definitions (3.1, 3.2, 3.5, 3.6, 4.x, 5.x).
5. Dev seed (P7).
6. **Test harness.** Colocated tests follow the existing patterns: `routes/api/**` route tests in the server project, page and component tests in jsdom, and service tests next to `services/customers/`. The locked acceptance suite `tests/acceptance/customer-account/` is run unmodified and must go green except the deferred C-0174. No new harness is needed: the suite reuses the sign-on and shopping-cart harnesses.
7. **CI.** No workflow change. The existing `ci.yml` already runs the unit, acceptance and acceptance-e2e tiers on pull requests into `vortex/**`, and the red-green replay on the FEATURE's pull request.

### Test cases deferred

- SWHR2-C-0174 (Account creation before purchase): its last step checks out and expects an order id. It is deferred to checkout (SWHR2-I-0008). Sign-up and account creation are covered by C-0164, C-0149, C-0150 and the service cases.

### Spec discrepancies

Recorded, not edited into the delta spec.

- **SD-P1 (SWHR2-R-0013, SWHR2-R-0055)** "Redirected onward" and "redirected to the user-creation error page" describe a server-side page flow. The replacement is an SPA over a JSON API, and the approved cases assert 2xx and 409 `UserExists`. The redirect is done by the SPA (P3).
- **SWHR2-R-0061:** the scenario ends in a purchase, which needs checkout (SWHR2-I-0008). The account part is built here, and the case is deferred.
- **Account screen (task 5.1):** there is no approved requirement for it (ACCT-SCR-0009 is pending). It is built as the account information page described in P5, tagged to the account and profile contents requirements, and it masks the card number (SD1).
- **Task 4.2** waits for the SME's expiry window (Q2). A provisional fixed list is built (P9).
- **SWHR2-R-0054 "Home screen":** this repository has two home screens, `/` and `/petstore`. Case C-0160 opens `/`. The banner is shown on both, and on the cart.
- **Data section:** it names `db/schema/storefront.ts` and creates `signon_users`. In this repository the schema is the single `db/schema.ts`, and `signon_users` already exists (P1).

### Assumptions

- The provisional expiry years 2026–2035 are acceptable until the SME answers Q2.
- The password maximum length (Q3) is not enforced beyond the existing sign-on limits. User ids keep the legacy limit of 25 characters with no `%` or `*`. The route answers 400 on a breach, which is not a "user name in use" message (SD5 is not reproduced).
