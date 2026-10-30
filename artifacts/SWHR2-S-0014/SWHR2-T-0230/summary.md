# Summary — SWHR2-T-0230 Sign-on and access control

CODE-REVIEW: sub-agent — fixed: expired sessions were never swept (added a once-a-minute sweep in `store.ts`); rejected: stale-cookie race after sign-in (rare, needs an alias scheme beyond the ticket) and `Secure` behind a TLS-terminating proxy (deployment config, not in this change).

## What changed

- `signon_users` table and migration 0003; `j2ee` demo customer seeded outside Vitest; EST-2 added to the dev catalog fixture (the acceptance e2e adds it to the cart).
- Area sessions (`ps_sid`, `admin_sid`, `supplier_sid`) in `services/session/store.ts`, with idle limits 15 min (storefront, cart discarded), 54 min (admin), none (supplier). Credential checks and `requireCustomer/Admin/Supplier` guards.
- Routes: `session.get`, `session/sign-in`, `session/sign-out`, `account`, `admin/*`, `supplier/*`. Supplier sign-in answers 409 `AdminSignedIn` while an admin session is live. The remembered-name cookie (31 days) is written only after the credential check.
- Screens: `StorefrontHeader` (now the AppShell header), sign-in, signed-out, account, admin sign-in / Login Error / landing, supplier sign-in. Strings in a new `signon` screen for en_US, ja_JP, zh_CN.
- `ADMIN_USERS` / `SUPPLIER_USERS` (`userId:hash`, entries joined by `;`) given to both Playwright web servers.

## AC coverage

AC-1, 2, 3, 5, 6, 9–12, 14, 16–18 covered by linked cases C-0253, C-0255–C-0262, C-0265–C-0267, C-0269 (platform red `6866dfed`, green `bd0019e2`). AC-13/15 only to the extent `requireCustomer` guards the account route (C-0252/0254 deferred to SWHR2-I-0008). AC-7, 8, 19: no HTTP route reaches message hand-off or order lines (deferred C-0263/0264/0268 to SWHR2-I-0011). AC-4: no target component exists (SD4); nothing built.

## Deviations

- No `e2e/sign-on.spec.ts`: Chromium is absent here, and an unexecuted spec must not be committed. The acceptance e2e covers the same flows. No Playwright design-check screenshots for the same reason (see `design-check.md`).
- `middleware/auth.ts` untouched; no guard reads `event.context.user`.
- The acceptance C-0258 link query (`/sign ?in|…|back/`) may match more than one link on `/admin` (header and nav "Sign in" plus "Back to sign-in"); not verifiable without a browser.

## Verification

`bun run lint`, `bun run typecheck`, `bun run test` (50 files, 173 tests): pass. `bun run test:acceptance`: sign-on `session.test.ts` and `header.test.tsx` pass; remaining failures are other capabilities or the deferred cases. `bun run test:e2e`: not runnable (no Chromium).
