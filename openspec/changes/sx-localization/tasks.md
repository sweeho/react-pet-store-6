## 1. Locale model and resolution

- [ ] 1.1 Define the supported locale set (en_US, ja_JP, zh_CN) and the en_US default as configuration
- [ ] 1.2 Implement locale-code interpretation (language_COUNTRY, "default", reject codes without an underscore)
- [ ] 1.3 Assign the default locale to any session that has none before request handling
- [ ] 1.4 Implement page locale resolution: request locale over session locale
- [ ] 1.5 Implement fallback to the default locale's page set and per-page fallback, with the "Definition for screen <name> not found" error

## 2. Changing locale

- [ ] 2.1 Implement the change-locale endpoint: update session locale on a valid code
- [ ] 2.2 Reject an unresolvable code with "Unable to change language to <code>" and leave the session unchanged
- [ ] 2.3 Apply the new locale to the shopping cart on locale change and on sign-on
- [ ] 2.4 Return the user to the originating page with its request data restored after a locale change
- [ ] 2.5 Add the English, Japanese and Chinese flag controls to the storefront header
- [ ] 2.6 Build the change-language screen with the locale selector, "Change Locale" control and confirmation screen (pending SME reachability decision)

## 3. Localized catalog and pricing

- [ ] 3.1 Key category, product and item details by locale in the db/ schema and generate the drizzle/ migration
- [ ] 3.2 Seed per-locale catalog text and separately stated per-locale prices
- [ ] 3.3 Select catalog content by the exact locale code of the request
- [ ] 3.4 Format catalog and cart prices in the currency of the page locale
- [ ] 3.5 Show cart lines from the catalog in the cart's locale, defaulting to en_US

## 4. Character encoding

- [ ] 4.1 Decode all storefront request data as UTF-8 before sign-on or any other handling
- [ ] 4.2 Render and declare all storefront pages as UTF-8
- [ ] 4.3 Make the request encoding a deployment setting with UTF-8 shipped
- [ ] 4.4 Write all business documents (order approvals, supplier orders, invoices) in UTF-8

## 5. Orders, invoices and e-mails

- [ ] 5.1 Record the order locale on each purchase order, defaulting to en_US, and restore it on read
- [ ] 5.2 Default an invoice's locale to en_US when none is stated
- [ ] 5.3 Format unit prices in customer e-mails per locale ($#,##0.00 for en_US and zh_CN, ￥#,##0 for ja_JP)

## 6. Administration and utilities

- [ ] 6.1 Drive administration tool labels, messages, tooltips and mnemonics from a text catalogue with English default and German translation
- [ ] 6.2 Provide locale-aware money and number formatting with fixed precision (pending SME reachability decision)
- [ ] 6.3 Provide locale-aware keyword splitting that discards blank words (pending SME reachability decision)

## 7. Verification

- [ ] 7.1 Write tests for locale-code interpretation and session default
- [ ] 7.2 Write tests for change-locale success, rejection and return-to-page
- [ ] 7.3 Write tests for page fallback and the missing-screen error
- [ ] 7.4 Write tests for per-locale catalog content, prices and cart relocalisation
- [ ] 7.5 Write tests for UTF-8 round-trip of Japanese and Chinese form input including sign-on
- [ ] 7.6 Write tests for order/invoice locale defaults and e-mail price formats
