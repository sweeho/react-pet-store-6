## Why

The legacy Java Pet Store (1.3.2) e-mails customers about the progress of their orders through a queue-driven mail service in its order processing centre. These rules were never written down outside a configuration guide and the code itself: which e-mails exist, how each is switched on, what happens when a mail cannot be sent, and what an e-mail request must contain. The rebuild has to reproduce that behaviour, or knowingly change it, so it is captured here as a specification extracted from the legacy source (spec extraction SX-0001).

## What Changes

- Adds the `customer-notifications` capability as 12 draft requirements extracted from 22 distinct IR records (25 pass-file entries; duplicates across passes merged).
- Covers: asynchronous queued delivery, dedicated notification channels, the three-field e-mail request format, message composition (HTML, UTF-8, central sender), content delivered unchanged, recipient-list parsing, send-failure and malformed-request handling, the three order notifications, their independent switches, fail-on-missing-switch startup, and the configurable mail server/sender.
- Thirteen records are approved and each is one requirement carrying its requirement key; the remaining records are pending review and are Not specified.

## Open points for the SME / Business Owner

- **Default state of the notifications is disputed** (conflicting documentation, deployed values redacted). Routed to Intent; the spec states the switches but not the default.
- **Silent discard on send failure** is a suspected legacy defect (code comment: "user probably forgot to set up mail server"). Recorded as current behaviour; whether to keep it belongs in the defect register.
- **Multiple recipients per request** is inferred from a library call only (low confidence).

## Capabilities

### New Capabilities

- `customer-notifications`: order-status e-mails to customers and the mail-delivery service behind them.

### Modified Capabilities

- none

## Impact

- Producers of notifications live in order processing (order approval and order fulfilment capabilities); this spec defines the contract they hand requests over.
- No user interface: no screen records were extracted for this capability.
