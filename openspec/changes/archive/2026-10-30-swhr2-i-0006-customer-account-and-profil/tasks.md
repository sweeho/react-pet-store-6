## 1. Data model

- [x] 1.1 Define the account record with a status limited to "active" and "disabled" (SWHR2-T-0239; SWHR2-R-0012, SWHR2-R-0058)
- [x] 1.2 Define the customer profile record with preferred language, optional favourite category, MyList and banner flags (SWHR2-T-0239; SWHR2-R-0129)
- [x] 1.3 Define the sign-on user record with user name and password (SWHR2-T-0239; SWHR2-R-0013)
- [x] 1.4 Define the customer record keyed by user id, owning one account and one profile (SWHR2-T-0239; SWHR2-R-0128, SWHR2-R-0056)
- [x] 1.5 Define the contact-information and postal address records, with a read-only contact snapshot (SWHR2-T-0239; SWHR2-R-0058, SWHR2-R-0059)
- [x] 1.6 Generate and commit the schema migration for the customer-account tables (SWHR2-T-0239; SWHR2-R-0128)

## 2. Customer creation

- [x] 2.1 Create a new account with status "active" (SWHR2-T-0239; SWHR2-R-0012)
- [x] 2.2 Create the customer profile with defaults en_US, no favourite category, MyList on and banners on (SWHR2-T-0239; SWHR2-R-0011)
- [x] 2.3 Allow profile values supplied by the creating flow to overwrite the defaults (SWHR2-T-0239; SWHR2-R-0011)
- [x] 2.4 Refuse a second customer for an existing user id (SWHR2-T-0239; SWHR2-R-0056)
- [x] 2.5 Create the customer, account, profile, contact and card records in one transaction (SWHR2-T-0239; SWHR2-R-0057)
- [x] 2.6 Run address reads, updates and removals inside the caller's transaction (SWHR2-T-0239; SWHR2-R-0060)

## 3. Registration

- [x] 3.1 Build the sign-up form with a user name and two password fields (SWHR2-T-0239; SWHR2-R-0009)
- [x] 3.2 Add the browser-side empty-field check on both password fields (SWHR2-T-0239; SWHR2-R-0009)
- [x] 3.3 Build the stand-alone new-user submission that creates the sign-on account and redirects onward (SWHR2-T-0239; SWHR2-R-0013)
- [x] 3.4 Redirect a refused registration to the user-creation error page (SWHR2-T-0239; SWHR2-R-0013)
- [x] 3.5 Add the sign-up form to the sign-in screen and show the User Creation Error screen for a name in use (SWHR2-T-0239; SWHR2-R-0055)
- [x] 3.6 Chain sign-up to the account information form before purchase (SWHR2-T-0239; SWHR2-R-0061)

## 4. Payment card options

- [x] 4.1 Offer card types Java(TM) Card, Duke Express and Meow Card on the account form (SWHR2-T-0239; SWHR2-R-0010)
- [x] 4.2 Offer card expiry years from the fixed list once the SME confirms the window (SWHR2-T-0239; SWHR2-R-0010)

## 5. Account screen and preferences

- [x] 5.1 Build the read-only account screen with contact, card and profile details and an edit control (SWHR2-T-0239; SWHR2-R-0058, SWHR2-R-0129)
- [x] 5.2 Show the My List panel of up to 10 favourite-category products when MyList is on (SWHR2-T-0239; SWHR2-R-0053)
- [x] 5.3 Show the favourite-category pet-tips banner on the home and cart screens when banners are on (SWHR2-T-0239; SWHR2-R-0054)

## 6. Tests

- [x] 6.1 Cover new-account status and profile defaults with integration tests (SWHR2-T-0239; SWHR2-R-0011, SWHR2-R-0012)
- [x] 6.2 Cover registration acceptance and refusal redirects with route tests (SWHR2-T-0239; SWHR2-R-0013)
- [x] 6.3 Cover the password empty-field check and card option lists with UI tests (SWHR2-T-0239; SWHR2-R-0009, SWHR2-R-0010)
- [x] 6.4 Cover duplicate-customer refusal and all-or-nothing creation with integration tests (SWHR2-T-0239; SWHR2-R-0056, SWHR2-R-0057)
- [x] 6.5 Cover the account screen, My List panel and banner with UI tests (SWHR2-T-0239; SWHR2-R-0053, SWHR2-R-0054, SWHR2-R-0058)
