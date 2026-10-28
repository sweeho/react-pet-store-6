# SWHR2-T-0081 summary

Branded the scaffold as Pet Store.

- `package.json` name `pet-store`; `index.html` title `Pet Store`.
- `configs/fonts.config.ts`: Inter 400/500/600/700; `--font-sans` added to `@theme inline`.
- `src/index.css`: light-mode tokens now brand indigo `#4f46e5` (primary/ring/sidebar-primary) and slate neutrals from the site-shell mockup; `--destructive-foreground` light value fixed to white. Dark mode left as is. Hex values used instead of OKLCH to match the mockup exactly (deviation from PLAN step 4).
- `e2e/smoke.spec.ts`: added a title assertion.

AC coverage: AC-1 title/name, AC-2 tokens, AC-3 smoke spec.

Verification: `bun run verify` exit 0 (20 tests passed). `bun run test:smoke` could not run: Chromium is not installed in this container; E2E left to QA/CI.

CODE-REVIEW: self-review — CSS/config-only change, no logic; no findings.
