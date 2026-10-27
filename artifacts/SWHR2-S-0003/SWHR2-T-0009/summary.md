# Summary — SWHR2-T-0009

Light-mode design tokens from the Site shell mockup now sit under the existing shadcn variable names (`--primary` = brand, `--destructive` = danger, light `--destructive-foreground` = white). Sans font is Inter, mono is JetBrains Mono. Dark-mode tokens untouched.

Files: `src/index.css`, `configs/fonts.config.ts`, `src/design-tokens.test.ts`.

AC: tokens, fonts, names preserved covered by the new test; smoke AC relies on unchanged `e2e/smoke.spec.ts`, not run here (no Chromium).

Deviation: PLAN.md was missing and the ticket was a placeholder; self-authored PLAN.md from the AC. No mockup comparison made: this ticket adds no visible screen.

Verification: `bun run verify` green (30 tests).

CODE-REVIEW: self-review — small CSS/config diff; checked token names unchanged and dark mode untouched.
