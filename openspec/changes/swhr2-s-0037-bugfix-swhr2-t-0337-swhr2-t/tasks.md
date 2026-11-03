## 1. Locale known at first render (SWHR2-T-0339)

- [x] 1.1 Keep a readable ps_locale cookie equal to the storefront session locale whenever a session starts or its locale changes (SWHR2-T-0339; SWHR2-R-0020)
- [x] 1.2 Initialise the client locale from that cookie before the session fetch returns (SWHR2-T-0339; SWHR2-R-0020)
- [x] 1.3 Mount one LocaleProvider around the app shell and remove the per-route providers (SWHR2-T-0339; SWHR2-R-0020)
- [x] 1.4 Unit tests for the cookie on session start and locale change and for the provider's initial locale (SWHR2-T-0339; SWHR2-R-0020)

## 2. Header and flags (SWHR2-T-0337)

- [x] 2.1 Make the storefront header read the shared locale (SWHR2-T-0337; SWHR2-R-0078)
- [x] 2.2 Move the language flags into the storefront header, on storefront pages only (SWHR2-T-0337; SWHR2-R-0078)
- [x] 2.3 Unit test that a flag change relabels the header without navigating (SWHR2-T-0337; SWHR2-R-0078)

## 3. Localized shell chrome (SWHR2-T-0338)

- [ ] 3.1 Add a shell screen definition per locale for the navigation labels, group headings, Home and footer, with en_US text unchanged (SWHR2-T-0338; SWHR2-R-0078)
- [ ] 3.2 Render the global navigation and the app shell footer from the shell definition in the session locale (SWHR2-T-0338; SWHR2-R-0078)
- [ ] 3.3 Unit tests for the ja_JP and zh_CN navigation, with existing English navigation and site-shell tests unchanged (SWHR2-T-0338; SWHR2-R-0078)
- [ ] 3.4 Confirm the locked localization browser cases C-0021, C-0026, C-0027 and C-0028 pass on the merged branch (SWHR2-T-0338; SWHR2-R-0078)
