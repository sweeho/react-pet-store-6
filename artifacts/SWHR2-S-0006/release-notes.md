---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0006
capability_brief: SWHR2-I-0002
branch: vortex/sprint/swhr2-s-0006-cae7cae1
upstream: [artifacts/SWHR2-S-0006/qa-test-report.md]
---

# Release notes — SWHR2-S-0006

## Added

- Opening the store's address now shows the Pet Store landing page, with a "Browse the catalog" button and a card for every area of the store. (SWHR2-T-0082)
- Every page now sits in the same frame: a header with the Pet Store brand, a left navigation rail and a footer. (SWHR2-T-0083)
- The navigation lists Home plus every area, grouped as Shop, Account, Administration and Supplier. (SWHR2-T-0083)
- Areas that have not shipped yet (catalog, cart, sign in, administration, supplier) open a page that says there is nothing here yet, with a link home. (SWHR2-T-0082)
- Pages now show one shared "nothing to show", "could not load — Try again" and "Loading…" display. (SWHR2-T-0084)

## Changed

- The generic placeholder home page is replaced; the app is named Pet Store in the browser tab and uses the Pet Store colours and Inter type. (SWHR2-T-0081)
- The Users page now loads its list from the server and shows the shared loading, error and empty displays. (SWHR2-T-0084)

## Not included

Header search, the language switch, cart and account controls in the header, the "Choose a pet" panel and per-area card descriptions shown in the mockups belong to later capabilities. Checkout and the shopping cart share one placeholder page for now, so both navigation entries highlight together there.

## Verification

Verified at integration QA — see `artifacts/SWHR2-S-0006/qa-test-report.md` (PASS, all five scenarios, no defects).

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                   | Status    | Exception |
| ---------------------------- | --------------- | ------------------------------------------ | --------- | --------- |
| Release contents recorded    | this file       | `artifacts/SWHR2-S-0006/release-notes.md`  | Satisfied | —         |
| Release verified before land | QA PASS verdict | `artifacts/SWHR2-S-0006/qa-test-report.md` | Satisfied | —         |
