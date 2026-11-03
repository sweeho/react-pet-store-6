import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;
const body = (p: Page) => p.locator("body");
const setLocale = (p: Page, locale: string) =>
  p.request.post("/api/session/locale", { data: { locale } });
const addBtn = (p: Page) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));

/** The cart row whose name links to item `id`'s detail page (exact id, so EST-1 never picks EST-10). */
const itemRow = (p: Page, id: string) =>
  p.getByRole("row").filter({ has: p.locator(`a[href$="/item/${id}"]`) });

// The dev server's database file (db/client.ts resolves it from the project root), shared by every
// worker and kept between runs.
const DB_FILE = path.join(process.cwd(), "sqlite.db");
/**
 * Removes every row of a user from each table with a user_id column, so a name an earlier run
 * signed up is free again. Playwright runs under Node, where bun:sqlite does not exist, so the
 * deletes run in a bun child process against the same file.
 */
function forgetUser(userId: string) {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, userId] = JSON.parse(process.argv[1]);
    const db = new Database(file);
    try {
      db.exec("PRAGMA busy_timeout = 10000");
      const tables = db.query("select name from sqlite_master where type = 'table'").all().map((r) => r.name);
      for (const t of tables) {
        const cols = db.query("select name from pragma_table_info(?)").all(t).map((c) => c.name);
        if (cols.includes("user_id")) db.query("delete from " + t + " where user_id = ?").run(userId);
      }
    } finally { db.close(); }`;
  execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, userId])]);
}

async function changeLocale(page: Page, label: string) {
  await page.goto("/petstore/change-language");
  await page.getByRole("combobox").selectOption({ label });
  await page.getByRole("button", { name: "Change Locale" }).click();
}

test.describe("localization", () => {
  // case: SWHR2-C-0021@v1
  test("SWHR2-C-0021: selecting Japanese and submitting Change Locale sets ja_JP and confirms it", async ({
    page,
  }) => {
    await changeLocale(page, "Japanese");
    await expect(body(page)).toContainText("ja_JP");
    await page.goto("/petstore");
    expect(await body(page).innerText()).toMatch(KANA);
  });

  // case: SWHR2-C-0022@v1
  test("SWHR2-C-0022: changing locale to zh_CN with EST-1 in the cart shows the zh_CN name and price", async ({
    page,
  }) => {
    await page.goto("/petstore/item/EST-1");
    await addBtn(page).first().click();
    // precondition: the EST-1 cart line shows the en_US name and price (design.md: 16.50 en_US,
    // 142 zh_CN)
    await page.goto("/petstore/cart");
    const line = itemRow(page, "EST-1");
    await expect(line).toHaveCount(1);
    await expect(line).toContainText("Angelfish");
    await expect(line).toContainText("16.50");
    await changeLocale(page, "Simplified Chinese");
    await expect(body(page)).toContainText("zh_CN");
    await page.goto("/petstore/cart");
    await expect(line).toHaveCount(1);
    // the EST-1 line itself: its name is the zh_CN one (Chinese, not the en_US name) and its
    // price is the zh_CN 142, not the en_US 16.50
    const text = await line.innerText();
    expect(text).toMatch(HAN);
    expect(text).not.toContain("Angelfish");
    expect(text).toMatch(/(^|[^\d.])142(\.00)?([^\d]|$)/);
    expect(text).not.toContain("16.50");
  });

  // case: SWHR2-C-0026@v1
  test("SWHR2-C-0026: storefront screens render localized text in en_US, ja_JP and zh_CN", async ({
    page,
  }) => {
    for (const locale of ["en_US", "ja_JP", "zh_CN"]) {
      expect((await setLocale(page, locale)).ok()).toBe(true);
      for (const path of ["/petstore", "/petstore/category/FISH", "/petstore/cart"]) {
        await page.goto(path);
        const text = await body(page).innerText();
        if (locale === "en_US") expect(text, `${locale} ${path}`).toMatch(/sign in/i);
        if (locale === "ja_JP") expect(text, `${locale} ${path}`).toMatch(KANA);
        if (locale === "zh_CN") {
          expect(text, `${locale} ${path}`).toMatch(HAN);
          expect(text, `${locale} ${path}`).not.toMatch(KANA);
        }
        if (locale !== "en_US") expect(text, `${locale} ${path}`).not.toMatch(/sign in/i);
      }
    }
  });

  // case: SWHR2-C-0027@v1
  test("SWHR2-C-0027: a shopper who has not chosen a locale sees US English", async ({ page }) => {
    await page.goto("/petstore");
    const text = await body(page).innerText();
    expect(text).toMatch(/sign in/i);
    expect(text).not.toMatch(KANA);
    expect(text).not.toMatch(HAN);
  });

  // case: SWHR2-C-0028@v1
  test("SWHR2-C-0028: activating the Japanese flag in the header switches the storefront to Japanese", async ({
    page,
  }) => {
    await page.goto("/petstore/category/FISH");
    await page
      .getByRole("button", { name: /japan|ja_JP|日本/i })
      .or(page.getByRole("link", { name: /japan|ja_JP|日本/i }))
      .first()
      .click();
    await expect.poll(async () => KANA.test(await body(page).innerText())).toBe(true);
    await page.goto("/petstore");
    expect(await body(page).innerText()).toMatch(KANA);
  });

  // case: SWHR2-C-0039@v1
  test("SWHR2-C-0039: a Japanese name entered in an address form is displayed unchanged later", async ({
    page,
  }) => {
    // sign up, enter the account's address form and reopen it: each new screen may be a cold
    // Vite compile, so the test gets 120s and each new screen 20s
    test.setTimeout(120_000);
    const slowExpect = expect.configure({ timeout: 20_000 });
    // a signed-on shopper of this test's own (no other test uses the name, so saving a name on
    // its account changes nobody else's data); rows an earlier run left are removed first
    const user = "jpnameshopper";
    forgetUser(user);
    await page.goto("/petstore/signin");
    const signUp = page.locator("form").filter({ hasText: /new customer|sign ?up|register/i });
    await signUp.getByLabel(/^user (name|id):?$/i).fill(user);
    await signUp
      .getByLabel(/^password:?$/i)
      .first()
      .fill("secret1");
    await signUp
      .getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i)
      .last()
      .fill("secret1");
    await signUp.getByRole("button").first().click();
    // Step 1: the address form, with 山田太郎 as the first and last name, submitted
    await slowExpect(page.getByLabel(/^card number:?$/i)).toBeVisible();
    await page.getByLabel(/^(first|given) name:?$/i).fill("山田太郎");
    await page.getByLabel(/^(last|family) name:?$/i).fill("山田太郎");
    await page.getByLabel(/^(tele)?phone( number)?:?$/i).fill("555-0101");
    await page.getByLabel(/^e-?mail( address)?:?$/i).fill("yamada@example.com");
    await page
      .getByLabel(/^(street( address)?|address( line)? 1):?$/i)
      .first()
      .fill("1 Main St");
    await page.getByLabel(/^city:?$/i).fill("Palo Alto");
    await page.getByLabel(/^state( or province)?:?$/i).fill("CA");
    await page.getByLabel(/^(zip|postal)( code)?:?$/i).fill("94303");
    await page.getByLabel(/^country:?$/i).fill("USA");
    await page.getByLabel(/^card number:?$/i).fill("4111111111111111");
    await page.getByLabel(/^card type:?$/i).selectOption({ index: 0 });
    const saved = page.waitForResponse(
      (r) => r.request().method() !== "GET" && new URL(r.url()).pathname === "/api/account",
    );
    // the address form's own save button, not a button elsewhere on the page (a header Search)
    const save = page
      .locator("form")
      .filter({ has: page.getByLabel(/^card number:?$/i) })
      .getByRole("button", { name: /save|submit|create/i });
    await expect(save).toHaveCount(1);
    await save.click();
    expect((await saved).status()).toBeLessThan(300);
    // Step 2: the edit-account screen, opened afresh, displays the saved address
    await page.goto("/petstore/account");
    await slowExpect(page.getByLabel(/^(first|given) name:?$/i)).toBeVisible();
    await expect(page.getByLabel(/^(first|given) name:?$/i)).toHaveValue("山田太郎");
    await expect(page.getByLabel(/^(last|family) name:?$/i)).toHaveValue("山田太郎");
  });
});
