# Proposal: Sign-on and access control (extracted from Java Pet Store 1.3.2)

## Why

Sign-on decides who may see account details, check out, administer orders and manage supplier stock. The rebuild must reproduce what the legacy storefront, administration area and supplier area show and accept when a user signs in and out, and the business needs a record of where the legacy access control is weak before deciding what to keep.

## What changes

Adds the `sign-on` capability, covering:

- The storefront credential store, its creation rules (user ID length and characters, password length) and the case-sensitive credential check.
- Storefront page protection: the protected pages, the return to the requested page after sign-on, the remembered user name, session set-up (customer record and language), sign-out and the 15-minute idle expiry.
- The storefront sign-in screen, its error screen and the header's sign-in / sign-out state.
- Error screen selection and the server error page.
- The administration area: role restriction, the built-in "jps_admin" account, the sign-in screen, the landing page, the rich-client launch bound to the session, the data service's session check, logout and the 54-minute expiry.
- The supplier area: role restriction, the built-in "supplier" account, the sign-in screen, logout and the 54-minute expiry.
- Anonymous catalog access, and the rule that internal data and back-office services rely on the user-facing entry points for access control.

## Impact

- Spec: `specs/sign-on/spec.md` (32 draft requirements, 5 of them screens). No requirement is approved yet, so none carries a key.
- Neighbouring capabilities: customer-account (account creation from the new-customer form, customer record and preferred language), localization (session and cart language), checkout (the protected order information screen), order-approval and sales-reporting (administration area consumers), order-fulfillment (supplier area consumer), catalog-browsing (anonymous access).
- Eleven suspected legacy defects and seven open questions are listed in `design.md` for the Business Owner and Intent.
