## 1. Credential store

- [ ] 1.1 Define the sign-on credential entity with user ID as its unique identity and a password
- [ ] 1.2 Generate and commit the migration for the credential table
- [ ] 1.3 Enforce the 25-character user ID limit with the legacy message
- [ ] 1.4 Reject user IDs containing "%" or "\*" with the legacy message
- [ ] 1.5 Enforce the maximum password length once the SME supplies the value
- [ ] 1.6 Implement the case-sensitive credential check that fails for an unknown user ID

## 2. Storefront sign-on

- [ ] 2.1 Load the sign-in page, error page and protected page list from per-application configuration at start-up, keeping the first of duplicate names and logging a warning
- [ ] 2.2 Guard the account view, account update, order information entry and sign-in welcome pages by exact path match, remembering the requested page
- [ ] 2.3 Serve every unprotected page, including catalog and cart, without sign-on
- [ ] 2.4 Let any signed-on user through protected pages without a role check
- [ ] 2.5 Handle sign-on submission: record user ID and signed-on state, redirect to the remembered page, or redirect to the error screen on failure
- [ ] 2.6 Write or clear the remembered user ID for 31 days on every submission
- [ ] 2.7 Associate the session with the user, load the customer record and switch session and cart language on sign-on, tolerating a missing customer record
- [ ] 2.8 Implement sign-out that ends the session, empties the cart, keeps the language and shows the signed-out screen
- [ ] 2.9 Expire idle storefront sessions after 15 minutes

## 3. Storefront screens

- [ ] 3.1 Build the sign-in screen with returning-customer and new-customer forms and the remembered-user pre-fill rules
- [ ] 3.2 Build the sign-in error screen with the "not found in our records" message
- [ ] 3.3 Add the sign-in / sign-out state to the storefront header with search, Account and Cart links
- [ ] 3.4 Build the signed-out screen with the link to sign in again

## 4. Error handling

- [ ] 4.1 Select the error screen by error kind, falling back to the nearest general kind, else a generic server error
- [ ] 4.2 Build the server error page showing the message and the notify-the-administrator request without a stack trace

## 5. Administration area

- [ ] 5.1 Restrict the administration area to the administrator role for page requests and submissions
- [ ] 5.2 Provision the built-in "jps_admin" account and grant the administrator role to "administrator_group"
- [ ] 5.3 Build the administration sign-in screen and its Login Error page
- [ ] 5.4 Build the administration landing page with the facility description, Launch Rich Client and logout controls
- [ ] 5.5 Implement the administration application launch bound to the administrator's session, returning an empty response for unknown actions
- [ ] 5.6 Refuse administration data requests without a session with the legacy "Session Timed Out" message and require the administrator role
- [ ] 5.7 Implement administration logout and the welcome page with the enter-admin link
- [ ] 5.8 Expire idle administration sessions after 54 minutes

## 6. Supplier area

- [ ] 6.1 Restrict the supplier inventory area to the supplier area's protected role
- [ ] 6.2 Provision the built-in "supplier" account and grant the role to "administrator_group"
- [ ] 6.3 Build the supplier sign-in screen and its Login Error page
- [ ] 6.4 Implement supplier logout and the page with the enter-supplier link
- [ ] 6.5 Expire idle supplier sessions after 54 minutes

## 7. Access control boundaries

- [ ] 7.1 Allow anonymous catalog browsing, lookup and search
- [ ] 7.2 Ensure customer, card, order, supplier order, workflow and order processing services are reachable only through a protected entry point

## 8. Verification

- [ ] 8.1 Unit-test the credential creation rules and the credential check
- [ ] 8.2 Integration-test protected-page redirection, sign-on submission and the remembered-user cookie
- [ ] 8.3 UI-test the storefront sign-in screen, error screen, header and signed-out screen
- [ ] 8.4 E2E-test sign-in, return to the requested page, language switch and sign-out
- [ ] 8.5 E2E-test administration and supplier sign-in, rejection, logout and role refusal
