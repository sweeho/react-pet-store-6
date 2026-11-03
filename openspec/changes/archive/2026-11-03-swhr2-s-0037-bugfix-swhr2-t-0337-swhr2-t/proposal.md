## Why

UAT round 1 at rc-2026.11.4 found three locked localization cases failing in the browser:

- SWHR2-C-0021 (defect SWHR2-T-0339): after Change Locale → Japanese, the main page has no Japanese text.
- SWHR2-C-0026 (SWHR2-T-0338): ja_JP and zh_CN storefront screens still show English, including "Sign in".
- SWHR2-C-0028 (SWHR2-T-0337): activating the Japanese flag does not switch the storefront.

The Japanese and Chinese translations exist, and the server stores and returns the chosen locale correctly. The faults are in how the client applies it: every screen first renders in US English and adopts the session locale only after an asynchronous request; the header keeps its own stale copy of the locale; and the site's global navigation and footer are hard-coded English.

## What Changes

- The storefront knows the session locale at its first render, so a page opened after a locale change is in that locale from the start.
- One shared locale state covers the whole application, header included, and the language flags sit in the header as the requirement says.
- The global navigation and footer are shown in the session locale. US English text is unchanged.
- Regression scenarios are added to the localization requirements "Change-language screen" and "Supported storefront locales and header language switch".

## Impact

- Affected capability: `localization` (two MODIFIED requirements).
- Code: the session store and locale route, the session middleware, the client locale provider and app root, the storefront header and flags, the global navigation and app shell, and new per-locale shell text definitions.
- A new readable `ps_locale` cookie carries only the locale code. No data, API shape or dependency change.

## Follow-ups / out of scope

- Administration and supplier screens are English-only by specification. The shared navigation follows the storefront locale on those pages too (design.md D5). Whether staff areas should pin their chrome to US English is left for a later decision.
- SWHR2-C-0039 (Japanese name in an address form) also failed at UAT round 1, but it is not committed to this sprint and was not root-caused here.
