## 1. Data model

- [ ] 1.1 Define the account record with a status limited to "active" and "disabled"
- [ ] 1.2 Define the customer profile record with preferred language, optional favourite category, MyList and banner flags
- [ ] 1.3 Define the sign-on user record with user name and password
- [ ] 1.4 Define the customer record keyed by user id, owning one account and one profile
- [ ] 1.5 Define the contact-information and postal address records, with a read-only contact snapshot
- [ ] 1.6 Generate and commit the schema migration for the customer-account tables

## 2. Customer creation

- [ ] 2.1 Create a new account with status "active"
- [ ] 2.2 Create the customer profile with defaults en_US, no favourite category, MyList on and banners on
- [ ] 2.3 Allow profile values supplied by the creating flow to overwrite the defaults
- [ ] 2.4 Refuse a second customer for an existing user id
- [ ] 2.5 Create the customer, account, profile, contact and card records in one transaction
- [ ] 2.6 Run address reads, updates and removals inside the caller's transaction

## 3. Registration

- [ ] 3.1 Build the sign-up form with a user name and two password fields
- [ ] 3.2 Add the browser-side empty-field check on both password fields
- [ ] 3.3 Build the stand-alone new-user submission that creates the sign-on account and redirects onward
- [ ] 3.4 Redirect a refused registration to the user-creation error page
- [ ] 3.5 Add the sign-up form to the sign-in screen and show the User Creation Error screen for a name in use
- [ ] 3.6 Chain sign-up to the account information form before purchase

## 4. Payment card options

- [ ] 4.1 Offer card types Java(TM) Card, Duke Express and Meow Card on the account form
- [ ] 4.2 Offer card expiry years from the fixed list once the SME confirms the window

## 5. Account screen and preferences

- [ ] 5.1 Build the read-only account screen with contact, card and profile details and an edit control
- [ ] 5.2 Show the My List panel of up to 10 favourite-category products when MyList is on
- [ ] 5.3 Show the favourite-category pet-tips banner on the home and cart screens when banners are on

## 6. Tests

- [ ] 6.1 Cover new-account status and profile defaults with integration tests
- [ ] 6.2 Cover registration acceptance and refusal redirects with route tests
- [ ] 6.3 Cover the password empty-field check and card option lists with UI tests
- [ ] 6.4 Cover duplicate-customer refusal and all-or-nothing creation with integration tests
- [ ] 6.5 Cover the account screen, My List panel and banner with UI tests
