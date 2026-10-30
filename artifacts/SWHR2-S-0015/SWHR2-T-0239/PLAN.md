---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0015
ticket: SWHR2-T-0239
capability_brief: SWHR2-I-0006
change: swhr2-i-0006-customer-account-and-profil
branch: vortex/sprint/swhr2-s-0015-ba46b929
---

# PLAN — SWHR2-T-0239 Customer account and profile

## Objective

Deliver the whole change `swhr2-i-0006-customer-account-and-profil`, working through every `tasks.md` group in order (1 to 6). The scope is sign-up from the sign-in screen, the customer, account and profile records created all-or-nothing, the account information page, the card option lists, contact snapshots, transactional address operations, the My List panel and the pet-tips banner.

Read `design.md` first: the legacy notes, then **Target design**, then **Planning — SWHR2-S-0015**. The Planning section records the measured code state, decisions P1–P11, the interface contracts fixed by the locked acceptance suite, and the spec discrepancies. Then read `specs/customer-account/spec.md` and `test-cases.md`.

## Steps

1. **Data model** (tasks 1.1–1.6). Add the five tables to `db/schema.ts`, register them in `db/client.ts`, and generate and commit migration 0004 (design.md P1; column names in "Interface contracts").
2. **Customer service** (2.1–2.6). Build `services/customers/index.ts` and `services/customers/address.ts` with synchronous transaction bodies and an optional `tx` (P2). Defaults and status follow Target design → Components.
3. **Routes** (3.3, 3.4 and the data behind 5.x):
   - `routes/api/account/register.post.ts` (P3)
   - extend `routes/api/account/index.get.ts`, and add `index.post.ts` and `index.put.ts` (P5, P6)
   - `routes/api/account/my-list.get.ts` (P8)
   - `preferences` in `routes/api/session.get.ts` (P8)
   - card constants in `shared/account.ts` (P9)
4. **Screens** (3.1, 3.2, 3.5, 3.6, 4.x, 5.x):
   - wire the New customer form in `src/pages/petstore/signin.tsx` (P4)
   - `src/pages/petstore/user-creation-error.tsx`
   - the account information form in `src/pages/petstore/account.tsx` (P5; label rules in "Interface contracts")
   - `MyListPanel` and `PetTipsBanner`, mounted per P8
   - an `account` screen definition for en_US, ja_JP and zh_CN, and the `signon` label changes (P10)
5. **Dev seed** (P7). Give `j2ee` a customer and add the BIRDS product `AV-CB-01`, outside Vitest only.
6. **Tests** (6.1–6.5). Add colocated tests that mirror the nearest existing file:
   - service tests next to `services/customers/`
   - route tests under `routes/api/account/`
   - page and component tests next to each page or component
     The locked suite `tests/acceptance/customer-account/` must pass unmodified, except C-0174, which is deferred to SWHR2-I-0008.

## File/module ownership

| Path                                                                                                                     | Change                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| `db/schema.ts`, `db/client.ts`, `drizzle/0004_*.sql`, `drizzle/meta/*`                                                   | tables, registration, dev seed, migration                 |
| `services/customers/index.ts`, `services/customers/address.ts` (+ `*.test.ts`)                                           | new                                                       |
| `shared/account.ts`                                                                                                      | new — card types and expiry years                         |
| `routes/api/account/index.get.ts`, `index.post.ts`, `index.put.ts`, `register.post.ts`, `my-list.get.ts` (+ `*.test.ts`) | extend / new                                              |
| `routes/api/session.get.ts` (+ test)                                                                                     | add `preferences`                                         |
| `src/pages/petstore/signin.tsx`, `account.tsx`, `user-creation-error.tsx`, `cart.tsx`, `index.tsx` (+ `*.test.tsx`)      | sign-up wiring, account form, error screen, banner mounts |
| `src/pages/petstore.tsx`, `src/pages/index.tsx`                                                                          | mount My List panel and banner                            |
| `src/components/storefront/MyListPanel.tsx`, `PetTipsBanner.tsx` (+ `*.test.tsx`)                                        | new                                                       |
| `src/locales/{en_US,ja_JP,zh_CN}/account.ts`, `src/locales/{en_US,ja_JP,zh_CN}/signon.ts`, `src/locales/registry.ts`     | screen text                                               |

`tests/acceptance/**` is locked: read it, never edit it.

## Design reference

The approved mockups are listed in `artifacts/SWHR2-S-0015/design/MANIFEST.md`. The HTML could not be committed at planning, and the manifest says how to fetch it.

| Mockup       | File                                                                                 | Route and state                                                     | Viewport |
| ------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | -------- |
| SWHR2-MCK-19 | `artifacts/SWHR2-S-0015/design/mockup-account-information.html`                      | `/petstore/account`, signed on right after sign-up, empty form      | 1440     |
| SWHR2-MCK-20 | `artifacts/SWHR2-S-0015/design/mockup-user-creation-error.html`                      | `/petstore/user-creation-error`, after sign-up with a taken name    | 1440     |
| SWHR2-MCK-21 | `artifacts/SWHR2-S-0015/design/mockup-home-screen-my-list-panel-and-pet-tips-b.html` | `/`, signed on as `j2ee` with MyList and banner on, favourite BIRDS | 1440     |

Where a mockup label conflicts with a label rule in design.md "Interface contracts", the rule wins: the locked tests depend on it. Record the difference in the design check.

## Definition of Done

- AC-1 to AC-32 are met. Each is covered by its linked case (31 cases), except AC-32 (Account creation before purchase): its account-creation half is shown by C-0164 and the service cases, and its purchase half is owed by checkout (C-0174 deferred to SWHR2-I-0008).
- The locked suite `tests/acceptance/customer-account/` passes, except C-0174.
- Migration 0004 is committed, and the existing sign-on, catalog and cart tests still pass.
