---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0007
capability_brief: SWHR2-I-0003
branch: vortex/sprint/swhr2-s-0007-9dc90a91
upstream: [artifacts/SWHR2-S-0007/qa-test-report.md]
---

# Release notes — SWHR2-S-0007

## Added

- The storefront is available in US English, Japanese and Simplified Chinese. First-time visitors see US English. (SWHR2-T-0093)
- EN / JA / ZH flags at the top of the store switch the whole storefront to that language for the rest of the visit. (SWHR2-T-0095)
- A Change language page, reached from **Language** in the navigation, offers US English, German, Japanese and Simplified Chinese. **Change Locale** confirms the chosen language. German shows the English pages. (SWHR2-T-0095)
- A link can ask for a language for one page. A page that has not been translated falls back to English, and a page that exists in no language shows "Definition for screen <name> not found". (SWHR2-T-0093)
- The catalog holds names, descriptions and prices per language, and the cart lists its items in the cart's language, re-listing them after a language switch. (SWHR2-T-0097)
- Prices and quantities use the shopper's number format, for example "$1,234.50" and "1,951", and search phrases split into words by the shopper's language rules. (SWHR2-T-0096)
- Japanese and Chinese text sent to the store is read as UTF-8 before anything else, sign-on included, so it is stored and shown exactly as typed. (SWHR2-T-0094)

## Changed

- The shopping cart page now lists the items in the cart with their localized names and prices, replacing the empty placeholder when the cart has items. (SWHR2-T-0097)
- The **Language** navigation entry now opens the Change language page. (SWHR2-T-0095)

## Not included

Sign-on, account, address, search, category and item pages are not built yet. The UTF-8 behaviour for those forms is in place at the server but cannot yet be used from a page. The language flags sit above the store content rather than in the site header. The Change language page has no Cancel button and no "What changes when you switch" panel. After a full page load in Japanese or Chinese, English shows briefly before the page switches.

## Known issues

Seven localization acceptance cases fail in the official CI run and are open as defects SWHR2-T-0104 to SWHR2-T-0117. The sprint summary lists them.

## Verification

Verified at integration QA: `artifacts/SWHR2-S-0007/qa-test-report.md` passed all 24 scenarios. One test race was fixed in place.

## Compliance / Control Evidence

| Control                      | Evidence        | Location                                   | Status    | Exception                             |
| ---------------------------- | --------------- | ------------------------------------------ | --------- | ------------------------------------- |
| Release contents recorded    | this file       | `artifacts/SWHR2-S-0007/release-notes.md`  | Satisfied | —                                     |
| Release verified before land | QA PASS verdict | `artifacts/SWHR2-S-0007/qa-test-report.md` | Satisfied | 7 official-CI acceptance defects open |
