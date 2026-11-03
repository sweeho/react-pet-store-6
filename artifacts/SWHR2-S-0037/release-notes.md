---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR2-S-0037
capability_brief: none
branch: vortex/sprint/swhr2-s-0037-dbc051b2
upstream: [artifacts/SWHR2-S-0037/qa-test-report.md]
---

# Release notes — SWHR2-S-0037

## Fixed

- **Choosing Japanese or Chinese now takes effect straight away.** After you change the language, on the Change Language page or with a flag, the next page opens in that language instead of showing English first. (SWHR2-T-0339)
- **The language flags work from the header.** The EN / JA / ZH flags now sit in the page header, and clicking one switches the whole page, header included, without reloading. (SWHR2-T-0337)
- **No more English left on Japanese and Chinese pages.** The left-hand menu, its group headings, the Home link and the footer are now shown in the chosen language. English pages are unchanged. (SWHR2-T-0338)

## Changed

- **Flags moved.** The language flags are in the header instead of at the top of the store page. (SWHR2-T-0337)
- **Staff pages follow the shopper's language in the menu.** If a shopper's language is Japanese or Chinese, the left-hand menu on the administration and supplier pages shows in that language too. Those pages' own content stays English. (SWHR2-T-0338)

## Upgrade notes

- The store now sets a small `ps_locale` cookie that holds only the chosen language code (for example `ja_JP`). It carries no personal data. The session cookie is unchanged.
- No migration, configuration or dependency change.
