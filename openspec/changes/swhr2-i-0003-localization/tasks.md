## 1. Locale model and resolution

- [ ] 1.1 Define the supported locale set (en_US, ja_JP, zh_CN) and the en_US default as configuration
- [ ] 1.2 Implement locale-code interpretation (language_COUNTRY, "default", reject codes without an underscore)
- [ ] 1.3 Implement page locale resolution: request locale over session locale
- [ ] 1.4 Implement fallback to the default locale's screen definitions and per-screen fallback, with the "Definition for screen <name> not found" error

## 2. Changing locale

- [ ] 2.1 Add the English, Japanese and Chinese flag controls to the storefront header
- [ ] 2.2 Apply a locale change to both the session and the shopping cart
- [ ] 2.3 Build the change-language screen with the locale selector and "Change Locale" control
- [ ] 2.4 Show the confirmation stating the new locale after a successful change

## 3. Localized catalog and cart

- [ ] 3.1 Key category, product and item display details by locale in the db/ schema and generate the drizzle/ migration
- [ ] 3.2 Seed per-locale catalog display details for en_US, ja_JP and zh_CN
- [ ] 3.3 Show catalog display details in the shopper's current locale
- [ ] 3.4 Show cart line name, attribute and price in the cart's locale, defaulting to en_US

## 4. Character encoding

- [ ] 4.1 Decode all submitted storefront text as UTF-8
- [ ] 4.2 Establish the request encoding before sign-on or any other handling reads submitted values

## 5. Formatting utilities

- [ ] 5.1 Provide locale-aware money and number formatting with a caller-supplied precision
- [ ] 5.2 Provide locale-aware keyword splitting that discards blank words

## 6. Verification

- [ ] 6.1 Write tests for locale-code interpretation and the en_US default
- [ ] 6.2 Write tests for screen locale resolution, fallback and the missing-screen error
- [ ] 6.3 Write tests for the header switch and change-language screen, including cart relocalisation
- [ ] 6.4 Write tests for per-locale catalog content and cart line localisation
- [ ] 6.5 Write tests for UTF-8 round-trip of Japanese and Chinese input, including sign-on
- [ ] 6.6 Write tests for money/number formatting and keyword splitting
