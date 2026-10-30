---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0014
capability_brief: SWHR2-I-0005
branch: vortex/sprint/swhr2-s-0014-2256b050
upstream: [artifacts/SWHR2-S-0014/qa-test-report.md]
---

# Release notes — SWHR2-S-0014

## Added

- Every store page header shows the main-page link, the search box, Account, Cart and either **Sign in** (visitors) or **Sign out** (signed-on customers), never both. (SWHR2-T-0230)
- A sign-in screen with a Returning customer form (user name, password, _Remember My User Name_) and a New customer form (user name, password twice). (SWHR2-T-0230)
- A remembered user name is filled in on later visits for 31 days; signing on without the box ticked forgets it. (SWHR2-T-0230)
- Japanese and Chinese user names and passwords are accepted without corruption. (SWHR2-T-0230)
- Editing the account asks a visitor to sign in first and then returns them to where they were. (SWHR2-T-0230)
- **Sign out** ends the session and empties the cart but keeps the language, then shows "You are signed out" with a link to sign in again. (SWHR2-T-0230)
- After 15 minutes without activity the shopper is signed out and the cart is emptied. (SWHR2-T-0230)
- Administration area sign-in (User ID, Password), a "Login Error" screen with a link back to sign-in, and a landing page that describes the sales, revenue, order-status and approve/deny facilities, with Launch administration tool and Log out. The administration session ends after 54 minutes idle. (SWHR2-T-0230)
- Supplier area sign-in with the same login error. It refuses with "Sign out of Administration first, then sign in to the supplier area." while an administration session is live. (SWHR2-T-0230)

## Changed

- A supported `?locale=` on a page address sets the store language, and the page's `lang` attribute follows the language. (SWHR2-T-0236)
- The administration and supplier areas no longer show the customer Sign in / Sign out link in the header or navigation. (SWHR2-T-0236)
- In Japanese and Chinese, Add to Cart buttons carry "Add to Cart" as screen-reader text. (SWHR2-T-0236)

## Fixed

- None.

## Upgrade notes

- Database migration `drizzle/0003_kind_gladiator.sql` adds the `signon_users` table (user id, password hash). (SWHR2-T-0230)
- Set `ADMIN_USERS` and `SUPPLIER_USERS` in the server environment: `userId:hash` entries joined by `;`. Without them nobody can sign in to the administration or supplier areas. They are not seeded. (SWHR2-T-0230)
- Sessions and carts live in server memory, and a sweep removes idle sessions once a minute. The server must keep running as a single process.

## Not included

- Sign-in before placing an order or entering shipping details: the guard exists, but checkout arrives with SWHR2-I-0008.
- Message hand-off and order-line services (SWHR2-I-0011), and the framework sample application idle limit, which has no target in this store.
- Mockup details not built: "User name" label (the screen says "User ID"), the language switch inside the header, and the nested sidebar catalog (see `qa-test-report.md`, Design fidelity).

## Verification

Verified at integration QA — `artifacts/SWHR2-S-0014/qa-test-report.md` (PASS; no product defect; checkout and messaging scenarios deferred).

## Compliance / Control Evidence

| Control                      | Evidence            | Location                                   | Status    | Exception                        |
| ---------------------------- | ------------------- | ------------------------------------------ | --------- | -------------------------------- |
| Release contents recorded    | this file           | `artifacts/SWHR2-S-0014/release-notes.md`  | Satisfied | —                                |
| Release verified before land | QA PASS verdict     | `artifacts/SWHR2-S-0014/qa-test-report.md` | Satisfied | 6 scenarios deferred / not built |
| Migrations disclosed         | Upgrade notes above | `drizzle/0003_kind_gladiator.sql`          | Satisfied | —                                |
| New configuration disclosed  | Upgrade notes above | `playwright.config.ts` (test values)       | Satisfied | No `.env.example` entry exists   |
