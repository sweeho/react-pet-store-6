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

| Requirement (ID)                                         | Source record (pass module)                  |
| -------------------------------------------------------- | -------------------------------------------- |
| Password entered twice at sign-up (SWHR2-R-0009)         | ACCT-BR-0003 (petstore a)                    |
| Payment card type and expiry year options (SWHR2-R-0010) | ACCT-RULE-0009 (petstore b)                  |
| Customer profile defaults at creation (SWHR2-R-0011)     | CUST-BR-0003 (customer a; customer b agrees) |
| Account status values (SWHR2-R-0012)                     | CUST-BR-0005 (customer a)                    |
| Stand-alone user registration (SWHR2-R-0013)             | CUST-WF-0001 (signon a)                      |

Every other record of the capability is pending SME review and is Not specified in `spec.md`; that includes the account-screen record, so `spec.md` carries no screen requirement until it is approved. The legacy notes above still cover those records as evidence for the reviewers.

Record keys are reused across modules: `CUST-BR-0003`, for example, names a different rule in the address, contactinfo, creditcard, customer and signon passes. The approved key `SWHR2-R-0011` is read as the customer-module record (profile defaults), the only one of them that both customer passes state identically. If the SME approved a different module's `CUST-BR-0003`, that requirement must be rewritten from that record.

Legacy notes behind the approved requirements:

- SWHR2-R-0009: `signon.jsp` carries `j_password` and `j_password_2`; `CreateUserHTMLAction.java:76-87` reads both (lines 77-78 redacted) and tests only for null. The empty-field check is the waf smart-form taglib. See Q4 and SD4.
- SWHR2-R-0010: option lists exist only in `create_customer.jsp:143-147` and `edit_customer.jsp`; the two disagree on the Meow value and the year window (see Q2). The requirement fixes the labels and that the year is chosen from a fixed list; the window itself is the SME decision in Q2.
- SWHR2-R-0011: `ProfileLocalHome.java:44-47` constants passed by `CustomerEJB.ejbPostCreate`; the sign-up flow may overwrite them with form values.
- SWHR2-R-0012: `AccountLocalHome.java:48-49`; only "active" is ever used, and nothing reads the status (see Q5). No behaviour is attached to "disabled".
- SWHR2-R-0013: `CreateUserServlet.java:70-74`, excluded by `apps/petstore/src/build.xml:204-205` and mapped by no `web.xml` (see Q6). The SME approved it as stated, so it is specified despite the reachability dispute.
