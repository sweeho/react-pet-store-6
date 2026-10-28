# SWHR2-T-0094 — Localization 4: Character encoding

Change `swhr2-i-0003-localization`. Read `design.md` first (Target design → Components → UTF-8 request middleware; Spec discrepancies SD1).
Requirements: UTF-8 interpretation of submitted text (SWHR2-R-0134), Encoding established before sign-on (SWHR2-R-0080); tasks 4.1, 4.2.

## Objective

Every request is decoded as UTF-8 before the session middleware, sign-on or any handler reads a value, and every text response declares `charset=utf-8`.

## Steps

1. `middleware/00.encoding.ts`, default-export H3 handler. For a request whose `content-type` is form-urlencoded, multipart or text without a charset, make later readers decode the body as UTF-8 (e.g. replace `event.req` with a Request carrying `charset=utf-8` on its content-type); query strings are decoded with `decodeURIComponent` semantics (design.md, Components; tasks 4.1).
2. The `00.` prefix puts it ahead of `10.session.ts` and every handler (ARCHITECTURE.md §Routing; task 4.2). Leave `middleware/auth.ts` as is.
3. Append `charset=utf-8` to a text/\* or JSON response content-type that lacks one (e.g. an `onResponse` hook or setting the header before the handler).

## File/module ownership

Create: `middleware/00.encoding.ts`. Nothing else. Tests belong to SWHR2-T-0098.

## Design reference

No approved mockup applies to this ticket.

## Definition of Done

AC-1 to AC-4 on the ticket, proved for the middleware in isolation. The acceptance cases SWHR2-C-0031, SWHR2-C-0032, SWHR2-C-0039 and SWHR2-C-0040 also need sign-on, registration, checkout and catalog search, which no sprint has built (SD1); they are expected to stay red after this ticket, and that is not a reason to build those capabilities here.
