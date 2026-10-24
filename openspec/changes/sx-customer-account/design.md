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
- **Q6 Stand-alone registration servlet.** `components/signon/.../CreateUserServlet` is excluded from the petstore build (`build.xml:204-205`), and no `web.xml` maps it. It is treated as dead code and kept out of the spec. Its record (signon `CUST-WF-0001`) is recommended for rejection.
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

| Requirement                                    | Source records (pass module)                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Customer identity and record structure         | CUST-ENT-0001, CUST-ENTITY-0001, CUST-BR-0008 (customer b); ACCT-ENT-0005, ACCT-ENT-0010 (petstore)                       |
| Duplicate customer refused                     | CUST-BR-0001 (customer a), CUST-ENTITY-0001                                                                               |
| Account attributes and status                  | CUST-ENT-0003, CUST-ENTITY-0005, CUST-BR-0005 (customer)                                                                  |
| Customer profile attributes                    | CUST-ENT-0002, CUST-ENTITY-0006 (customer)                                                                                |
| Contact information record                     | CUST-ENT-0001 (contactinfo)                                                                                               |
| Postal address record                          | CUST-ENT-0001, CUST-REQ-0002 (address)                                                                                    |
| Payment card record                            | CUST-ENT-0001 (creditcard)                                                                                                |
| Customer creation defaults                     | CUST-BR-0002, CUST-BR-0003 (customer)                                                                                     |
| Blank dependent records on account creation    | CUST-BR-0004 (customer); ACCT-REQ-0001 (creditcard); CUST-REQ-0001, CUST-BR-0003 (contactinfo); CUST-REQ-0001 (address b) |
| Atomic customer creation                       | CUST-BR-0008 (customer a), CUST-BR-0009 (customer)                                                                        |
| Cascading removal of customer data             | CUST-BR-0006, CUST-BR-0007 (customer); CUST-BR-0001, CUST-BR-0002 (contactinfo)                                           |
| No record-level access control                 | CUST-RULE-0005, CUST-RULE-0006 (address); CUST-REQ-0004 (contactinfo); CUST-REQ-0001 (creditcard)                         |
| Field-level update and detached copies         | CUST-REQ-0001 (address a, address b); CUST-REQ-0002 (contactinfo)                                                         |
| Address storage without content validation     | CUST-BR-0004, CUST-RULE-0001 (address)                                                                                    |
| Exchanged address document reading             | CUST-BR-0002, CUST-BR-0003, CUST-RULE-0002, CUST-RULE-0003 (address)                                                      |
| Exchanged address document writing             | CUST-BR-0001, CUST-RULE-0004 (address)                                                                                    |
| Payment card stored as supplied                | CUST-BR-0003 (creditcard), ACCT-BR-0007 (petstore)                                                                        |
| Card expiry month and year                     | CUST-BR-0001, CUST-BR-0002 (creditcard)                                                                                   |
| Two-step account sign-up                       | CUSTOMER-ACCOUNT-WF-0001 (docs), ACCT-WF-0001, ACCT-WF-0006, ACCT-REQ-0001 (petstore)                                     |
| Unique user names at sign-up                   | ACCT-BR-0002 (petstore), CUST-BR-0001 (signon), SIGN-REQ-0009 (signon)                                                    |
| Sign-up failures reported as a taken user name | ACCT-RULE-0002 (petstore)                                                                                                 |
| Sign-on user name and password rules           | CUST-BR-0002, CUST-BR-0003, CUST-BR-0004 (signon)                                                                         |
| Password entered twice at sign-up              | ACCT-BR-0003, ACCT-RULE-0003 (petstore)                                                                                   |
| Account information captured                   | ACCT-REQ-0004, ACCT-SCR-0004, ACCT-RULE-0009 (petstore)                                                                   |
| Required contact fields                        | ACCT-BR-0006, ACCT-RULE-0005 (petstore)                                                                                   |
| Browser-side empty-field check                 | CUST-BR-0007 (waf a), CUST-BR-0001 (waf b)                                                                                |
| Account screen (screen)                        | ACCT-SCR-0007, ACCT-SCR-0009 (petstore)                                                                                   |
| Account edit                                   | ACCT-REQ-0008 (petstore)                                                                                                  |
| Preferred language on account save             | ACCT-RULE-0011, ACCT-REQ-0008 (petstore)                                                                                  |
| My List panel                                  | ACCT-BR-0010, ACCT-RULE-0012 (petstore)                                                                                   |
| Pet-tips banner                                | ACCT-BR-0011, ACCT-RULE-0013 (petstore)                                                                                   |
| Not specified (dead code)                      | CUST-WF-0001 (signon)                                                                                                     |

Record keys are reused across modules: `CUST-BR-0001`, for example, names a different rule in the address, contactinfo, creditcard, customer, signon and waf passes. The module in parentheses identifies which one is meant.
