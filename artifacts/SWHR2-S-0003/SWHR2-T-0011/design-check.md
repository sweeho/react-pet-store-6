---
mockups: [SWHR2-MCK-2]
---

# Design check — SWHR2-T-0011

## SWHR2-MCK-2 · Site shell (mockup-site-shell.html, /, 1440×900)

Screenshots: none captured. Playwright's Chromium is not installed in this container, so the mockup and the built screen could not be rendered. The comparison was done by reading the mockup HTML against the built markup.

Differences left:

- Header search box and language switcher omitted: owned by the catalog and localization capabilities.
- Rail Catalog sub-list (Birds, Fish, ...), breadcrumbs and loading card omitted: page content, not shell.
- Colours and radii use design tokens (`bg-card`, `border-border`, `bg-primary`); their values equal the mockup palette.
- Rail link labels, groups (Shop / You / Store staff), lock icons, 56px header, 240px rail and 40px footer follow the mockup. Below `md` the rail becomes a horizontal strip (the mockup is desktop only).
