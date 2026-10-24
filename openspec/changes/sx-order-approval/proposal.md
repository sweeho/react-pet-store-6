## Why

The legacy Java Pet Store 1.3.2 holds every order above a locale-dependent threshold until an administrator approves or denies it. The rebuild has to reproduce that gate: which orders are auto-approved, how an administrator reviews and decides the rest, and how decisions reach order processing. This change records the behaviour extracted from the legacy source (spec extraction SX-0001) as a reviewable delta spec. Every requirement in it is a draft until an SME approves it.

## What Changes

- Adds the `order-approval` capability with 18 draft requirements extracted from 31 distinct IR record keys in the pass files (the server reports 25 ingested):
  - automatic approval of small orders by locale (US under 500, Japan under 50000, every other locale never);
  - the administrator's review surfaces: the Process Pending Orders screen, its status colour coding, and the View Non-Pending Orders screen;
  - bulk marking, commit (approvals batch, then denials batch), the uncommitted-refresh warning, the busy state and fatal-error handling;
  - the orders-by-status query and the order fields shown to the administrator;
  - server handling of a status update, asynchronous delivery on the order-approval channel, and the approval decision batch format.
- Carries the legacy defects and document conflicts found during extraction to the SME. They are listed in `design.md` and in `legacy-analysis/ir/_recommendations/order-approval.yaml`.

## Capabilities

### New Capabilities

- `order-approval`: Automatic and administrator approval or denial of placed orders, and delivery of those decisions to order processing.

### Modified Capabilities

- None.

## Impact

- New spec: `specs/order-approval/spec.md`.
- Related capabilities, extracted separately: `sign-on` (administrator-only access to the admin area), `sales-reporting` (the same admin tool's charts share the refresh, busy-state and fatal-error mechanics), and order fulfilment, which consumes the approval channel.
- Open SME decisions that change what gets built: the exactly-500 boundary, auto-approval for locales other than US and Japan, server-side validation of submitted status values, and whether a communication failure should close the tool.
