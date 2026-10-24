# Proposal: customer-account (spec extraction SX-0001)

## Why

The Java Pet Store 1.3.2 rebuild needs a verifiable statement of how customer accounts behave today: how a visitor signs up, what an account and profile hold, what is validated (and what is not), how the account screen and edit form work, and how profile preferences change what the storefront shows. These rules are spread over the storefront web tier and five data components (customer, contact information, address, credit card, sign-on) and are documented almost nowhere.

## What changes

- Adds the `customer-account` capability as a draft delta spec of 31 requirements extracted from the legacy source, covering:
  - the customer / account / profile / contact / address / payment-card record structure and its one-to-one ownership;
  - customer creation defaults, blank dependent records, atomic creation and cascading removal;
  - two-step sign-up, user-name uniqueness and user-name/password rules;
  - captured account fields, required contact fields and the browser-side empty-field check;
  - the account screen (one screen requirement), account edit and preferred-language handling;
  - the My List panel and pet-tips banner driven by profile preferences;
  - address document exchange rules and payment-card storage rules.
- None of the requirements carries an `ID:` line: no record of this capability has been approved yet.

## Impact

- Source modules: `src/apps/petstore`, `src/components/customer`, `contactinfo`, `address`, `creditcard`, `signon`, `src/waf`, `docs`.
- Several requirements describe legacy behaviour that is a suspected defect (unmasked card number, unchecked password confirmation, swallowed validation, every sign-up failure reported as a taken user name). They are written as observed and listed in `design.md` for the Business Owner's defect register; the SME recommendations are in `legacy-analysis/ir/_recommendations/customer-account.yaml`.
- Neighbouring capabilities: sign-on (session, protected screens), checkout (shares contact/address records and the empty-field check), customer-notifications.
