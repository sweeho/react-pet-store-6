---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0015
capability_brief: SWHR2-I-0006
branch: vortex/sprint/swhr2-s-0015-ba46b929
upstream: [artifacts/SWHR2-S-0015/qa-test-report.md]
---

# Release notes — SWHR2-S-0015

## Added

- **Sign up from the sign-in screen.** A new visitor picks a user name and types the password twice. Both boxes must be filled in, and the first password is kept. If the name cannot be registered, the **User Creation Error** screen says it is in use and asks for another. (SWHR2-T-0239)
- **Account information** screen for new and signed-on customers. It holds given name, family name, telephone, e-mail, postal address, payment card and profile preferences. Card type is one of Java(TM) Card, Duke Express or Meow Card, and the expiry year is chosen from a fixed list. (SWHR2-T-0239)
- New profiles default to US English, no favourite category, My List on and banner on. (SWHR2-T-0239)
- Each user name has exactly one customer, with one account and one profile, saved together or not at all. New accounts are _active_ and can be set to _disabled_. (SWHR2-T-0239)
- **My List** panel shows the first 10 products of the favourite category, each linking to its product page, while My List is on. (SWHR2-T-0239)
- **Pet-tips banner** on the Home and Cart screens shows the favourite category's banner (dogs, cats, reptiles, birds or fish) while the banner is on. Any other category shows the dogs banner. (SWHR2-T-0239)
- Account screens in English, Japanese and Chinese. (SWHR2-T-0239)

## Changed

- None.

## Fixed

- Anonymous Home visits no longer log a 401 console error from My List. (SWHR2-T-0240, SWHR2-T-0241)
- My List now fills in right after sign-up or sign-in, without a page reload. (SWHR2-T-0240)

## Upgrade notes

- Database migration `drizzle/0004_watery_jasper_sitwell.sql` adds the customer, account and profile tables. (SWHR2-T-0239)
- `GET /api/account/my-list` returns `200 {items: []}` when nobody is signed on. (SWHR2-T-0241)

## Not included

- The purchase step after sign-up. Checkout arrives with SWHR2-I-0008.
- Acceptance cases SWHR2-C-0157 and SWHR2-C-0269 are still red in CI and disputed as test faults. Tracked in SWHR2-T-0244.

## Verification

Verified at integration QA: `artifacts/SWHR2-S-0015/qa-test-report.md` (PASS, 32/32 scenarios, 205 unit tests, 15/15 e2e).

## Compliance / Control Evidence

| Control                      | Evidence            | Location                                   | Status    | Exception                            |
| ---------------------------- | ------------------- | ------------------------------------------ | --------- | ------------------------------------ |
| Release contents recorded    | this file           | `artifacts/SWHR2-S-0015/release-notes.md`  | Satisfied | —                                    |
| Release verified before land | QA PASS verdict     | `artifacts/SWHR2-S-0015/qa-test-report.md` | Satisfied | 2 acceptance cases red, SWHR2-T-0244 |
| Migrations disclosed         | Upgrade notes above | `drizzle/0004_watery_jasper_sitwell.sql`   | Satisfied | —                                    |
| New configuration disclosed  | none required       | —                                          | N/A       | —                                    |
