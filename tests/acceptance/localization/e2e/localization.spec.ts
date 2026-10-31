import { expect, test, type Page } from "@playwright/test";

const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;
const body = (p: Page) => p.locator("body");
const setLocale = (p: Page, locale: string) =>
  p.request.post("/api/session/locale", { data: { locale } });
const addBtn = (p: Page) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));

async function signIn(page: Page) {
  await page.goto("/petstore/signin");
  await page.getByLabel(/^user id:?$/i).fill("j2ee");
  await page.getByLabel(/^password:?$/i).fill("j2ee");
  await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
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
    await addBtn(page).click();
    await changeLocale(page, "Simplified Chinese");
    await expect(body(page)).toContainText("zh_CN");
    await page.goto("/petstore/cart");
    const text = await body(page).innerText();
    expect(text).toMatch(HAN);
    expect(text).toMatch(/142/);
    expect(text).not.toMatch(/16\.50/);
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
    await signIn(page);
    await page.goto("/petstore/item/EST-1");
    await addBtn(page).click();
    await page.getByRole("link", { name: /cart/i }).first().click();
    await page
      .getByRole("button", { name: /check ?out/i })
      .or(page.getByRole("link", { name: /check ?out/i }))
      .click();
    await page
      .getByLabel(/^(first name|given name):?$/i)
      .first()
      .fill("山田太郎");
    await page
      .getByRole("button", { name: /continue|submit|place|next/i })
      .first()
      .click();
    const confirm = page.getByRole("button", { name: /confirm|place order|submit/i });
    if (await confirm.count()) await confirm.first().click();
    await expect(page.getByText("山田太郎").first()).toBeVisible();
  });
});
