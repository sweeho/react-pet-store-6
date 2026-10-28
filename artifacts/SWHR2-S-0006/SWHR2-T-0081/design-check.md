# Design check — SWHR2-T-0081

Mockup `artifacts/SWHR2-S-0006/design/mockup-site-shell.html` (SWHR2-MCK-2, 1440px), used for tokens only.

Screenshots: none. Playwright Chromium is not installed in this container, so no side-by-side render was possible. This ticket builds no screen; it defines tokens and the font.

Compared by reading the mockup's `:root` block against `src/index.css`:

- brand `#4f46e5` -> `--primary`, `--ring`, `--sidebar-primary`: match.
- text `#0f172a`, muted `#64748b`, border `#e2e8f0`, surface `#f8fafc`: match.
- `--on-brand #ffffff` -> `--primary-foreground`: match. `--danger #dc2626` not mapped (existing `--destructive` kept).
- sans `Inter, system-ui, sans-serif` -> `--font-sans`: match.

Visual comparison of real screens belongs to the shell and landing tickets.
