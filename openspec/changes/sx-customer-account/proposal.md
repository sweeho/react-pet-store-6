# Proposal: customer-account (spec extraction SX-0001)

## Why

The Java Pet Store 1.3.2 rebuild needs a verifiable statement of how customer accounts behave today: how a visitor signs up, what an account and profile hold, what is validated (and what is not), how the account screen and edit form work, and how profile preferences change what the storefront shows. These rules are spread over the storefront web tier and five data components (customer, contact information, address, credit card, sign-on) and are documented almost nowhere.

## What changes

- Adds the `customer-account` capability as a delta spec of the 5 requirements an SME approved, each carrying its minted key:
  - `SWHR2-R-0009` (ACCT-BR-0003) password entered twice at sign-up, with only an empty-field check;
  - `SWHR2-R-0010` (ACCT-RULE-0009) payment card type and expiry year options;
  - `SWHR2-R-0011` (CUST-BR-0003, customer module) customer profile defaults at creation;
  - `SWHR2-R-0012` (CUST-BR-0005) account status values;
  - `SWHR2-R-0013` (CUST-WF-0001, signon module) stand-alone user registration.
- The other 25 records of the capability, including the one account-screen record (ACCT-SCR-0009, with its pass-b counterparts ACCT-SCR-0004 / ACCT-SCR-0007), are not yet approved and are Not specified here. Recommendations for them are in `legacy-analysis/ir/_recommendations/customer-account.yaml`.

## Impact

- Source modules: `src/apps/petstore`, `src/components/customer`, `contactinfo`, `address`, `creditcard`, `signon`, `src/waf`, `docs`.
- Several requirements describe legacy behaviour that is a suspected defect (unmasked card number, unchecked password confirmation, swallowed validation, every sign-up failure reported as a taken user name). They are written as observed and listed in `design.md` for the Business Owner's defect register; the SME recommendations are in `legacy-analysis/ir/_recommendations/customer-account.yaml`.
- Neighbouring capabilities: sign-on (session, protected screens), checkout (shares contact/address records and the empty-field check), customer-notifications.
