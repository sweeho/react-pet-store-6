# Design check — SWHR2-T-0011

Mockup: `mockup-site-shell` (design block 04820015), 1440×900, route `/` and others.

Side-by-side screenshots were NOT captured: Playwright's Chromium is not installed in this container.
Compared by reading the mockup HTML against the built markup instead.

Differences left:

- Header search box, language switcher: omitted (catalog / localization capabilities).
- Rail Catalog sub-list (Birds, Fish, ...), breadcrumbs, loading card: page content, not shell.
- Colours/radius use design tokens (`bg-card`, `border-border`, `bg-primary`), values equal the mockup palette.
- Landing page body keeps its existing dark hero; its redesign (mockup-landing-page) is not part of this ticket.
