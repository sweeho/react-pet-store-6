## 1. Locale model and resolution

- [ ] 1.1 Define the supported locale set (en_US, ja_JP, zh_CN) and the en_US default as configuration (SWHR2-T-0093; SWHR2-R-0078)
- [ ] 1.2 Implement locale-code interpretation (language_COUNTRY, "default", reject codes without an underscore) (SWHR2-T-0093; SWHR2-R-0077)
- [ ] 1.3 Implement page locale resolution: request locale over session locale (SWHR2-T-0093; SWHR2-R-0133)
- [ ] 1.4 Implement fallback to the default locale's screen definitions and per-screen fallback, with the "Definition for screen <name> not found" error (SWHR2-T-0093; SWHR2-R-0133)

## 2. Changing locale

- [ ] 2.1 Add the English, Japanese and Chinese flag controls to the storefront header (SWHR2-T-0095; SWHR2-R-0078)
- [ ] 2.2 Apply a locale change to both the session and the shopping cart (SWHR2-T-0095; SWHR2-R-0076)
- [ ] 2.3 Build the change-language screen with the locale selector and "Change Locale" control (SWHR2-T-0095; SWHR2-R-0020)
- [ ] 2.4 Show the confirmation stating the new locale after a successful change (SWHR2-T-0095; SWHR2-R-0020)

## 3. Localized catalog and cart

- [ ] 3.1 Key category, product and item display details by locale in the db/ schema and generate the drizzle/ migration (SWHR2-T-0097; SWHR2-R-0079)
- [ ] 3.2 Seed per-locale catalog display details for en_US, ja_JP and zh_CN (SWHR2-T-0097; SWHR2-R-0079, SWHR2-R-0081)
- [ ] 3.3 Show catalog display details in the shopper's current locale (SWHR2-T-0097; SWHR2-R-0079)
- [ ] 3.4 Show cart line name, attribute and price in the cart's locale, defaulting to en_US (SWHR2-T-0097; SWHR2-R-0081)

## 4. Character encoding

- [ ] 4.1 Decode all submitted storefront text as UTF-8 (SWHR2-T-0094; SWHR2-R-0134)
- [ ] 4.2 Establish the request encoding before sign-on or any other handling reads submitted values (SWHR2-T-0094; SWHR2-R-0080)

## 5. Formatting utilities

- [ ] 5.1 Provide locale-aware money and number formatting with a caller-supplied precision (SWHR2-T-0096; SWHR2-R-0018, SWHR2-R-0019)
- [ ] 5.2 Provide locale-aware keyword splitting that discards blank words (SWHR2-T-0096; SWHR2-R-0019)

## 6. Verification

- [ ] 6.1 Write tests for locale-code interpretation and the en_US default (SWHR2-T-0098; SWHR2-R-0077, SWHR2-R-0078)
- [ ] 6.2 Write tests for screen locale resolution, fallback and the missing-screen error (SWHR2-T-0098; SWHR2-R-0133)
- [ ] 6.3 Write tests for the header switch and change-language screen, including cart relocalisation (SWHR2-T-0098; SWHR2-R-0078, SWHR2-R-0020, SWHR2-R-0076)
- [ ] 6.4 Write tests for per-locale catalog content and cart line localisation (SWHR2-T-0098; SWHR2-R-0079, SWHR2-R-0081)
- [ ] 6.5 Write tests for UTF-8 round-trip of Japanese and Chinese input, including sign-on (SWHR2-T-0098; SWHR2-R-0134, SWHR2-R-0080)
- [ ] 6.6 Write tests for money/number formatting and keyword splitting (SWHR2-T-0098; SWHR2-R-0018, SWHR2-R-0019)
