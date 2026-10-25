# Proposal: Sign-on and access control (extracted from Java Pet Store 1.3.2)

## Why

Sign-on decides who may edit an account, check out, administer orders and use the supplier tools. The rebuild must reproduce what the legacy storefront and administration area show and accept when a user signs in and out, and the business needs a record of where the legacy access control is weak before deciding what to keep.

## What changes

Adds the `sign-on` capability with the 13 SME-approved requirements:

- Storefront: the pages that require a signed-on customer, the remembered user name, sign-out with its signed-out screen, the 15-minute idle expiry and the header's sign-in / sign-out state.
- Framework sample application: the 30-minute idle expiry.
- Administration area: the sign-in screen and its error, the landing page and the 54-minute idle expiry.
- Separation of the administrator and supplier areas, and signing out of the administrator application before using the supplier one.
- Internal services (message hand-off, order lines) that apply no role check of their own and rely on their callers.

## Impact

- Spec: `specs/sign-on/spec.md` (13 requirements, each carrying its approved key; 3 of them screens). Records not yet approved are left out and listed in `legacy-analysis/ir/_recommendations/sign-on.yaml`.
- Neighbouring capabilities: customer-account (account editing), checkout (the protected order steps), localization (language kept across sign-out), order-approval and sales-reporting (administration area consumers), order-fulfillment (supplier area and order lines).
- Suspected legacy defects and open questions are listed in `design.md` for the Business Owner and Intent.
