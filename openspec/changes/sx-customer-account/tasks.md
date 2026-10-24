## 1. Data model

- [ ] 1.1 Define the account record with a status limited to "active" and "disabled"
- [ ] 1.2 Define the customer profile record with preferred language, optional favourite category, MyList and banner flags
- [ ] 1.3 Define the sign-on user record with user name and password
- [ ] 1.4 Generate and commit the schema migration for the customer-account tables

## 2. Customer creation

- [ ] 2.1 Create a new account with status "active"
- [ ] 2.2 Create the customer profile with defaults en_US, no favourite category, MyList on and banners on
- [ ] 2.3 Allow profile values supplied by the creating flow to overwrite the defaults

## 3. Registration

- [ ] 3.1 Build the sign-up form with a user name and two password fields
- [ ] 3.2 Add the browser-side empty-field check on both password fields
- [ ] 3.3 Build the stand-alone new-user submission that creates the sign-on account and redirects onward
- [ ] 3.4 Redirect a refused registration to the user-creation error page

## 4. Payment card options

- [ ] 4.1 Offer card types Java(TM) Card, Duke Express and Meow Card on the account form
- [ ] 4.2 Offer card expiry years from the fixed list once the SME confirms the window

## 5. Tests

- [ ] 5.1 Cover new-account status and profile defaults with integration tests
- [ ] 5.2 Cover registration acceptance and refusal redirects with route tests
- [ ] 5.3 Cover the password empty-field check and card option lists with UI tests
