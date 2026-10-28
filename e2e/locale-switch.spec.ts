import { expect, test, type Page } from "@playwright/test";

const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;
const body = (p: Page) => p.locator("body");
const setLocale = (p: Page, locale: string) =>
  p.request.post("/api/session/locale", { data: { locale } });

test.describe("locale switching", () => {
  test("[SWHR2-C-0021] selecting Japanese and submitting Change Locale sets ja_JP and confirms it", async ({
    page,
  }) => {
    await page.goto("/petstore/change-language");
    await page.getByRole("combobox").selectOption({ label: "Japanese" });
    await page.getByRole("button", { name: "Change Locale" }).click();
    await expect(body(page)).toContainText("ja_JP");
    await page.goto("/petstore");
    expect(await body(page).innerText()).toMatch(KANA);
  });

  // The cart-line part of this case needs the localized cart from SWHR2-T-0097.
  test("[SWHR2-C-0022] changing locale to zh_CN through the screen sets the zh_CN session locale", async ({
    page,
  }) => {
    await page.goto("/petstore/change-language");
    await page.getByRole("combobox").selectOption({ label: "Simplified Chinese" });
    await page.getByRole("button", { name: "Change Locale" }).click();
    await expect(body(page)).toContainText("zh_CN");
    expect((await (await page.request.get("/api/session")).json()).locale).toBe("zh_CN");
  });

  test("[SWHR2-C-0026] storefront screens render localized text in en_US, ja_JP and zh_CN", async ({
    page,
  }) => {
    for (const locale of ["en_US", "ja_JP", "zh_CN"]) {
      expect((await setLocale(page, locale)).ok()).toBe(true);
      for (const path of ["/petstore", "/petstore/cart", "/petstore/signin"]) {
        await page.goto(path);
        const text = await body(page).innerText();
        if (locale === "en_US") expect(text, `${locale} ${path}`).not.toMatch(KANA);
        if (locale === "ja_JP") expect(text, `${locale} ${path}`).toMatch(KANA);
        if (locale === "zh_CN") {
          expect(text, `${locale} ${path}`).toMatch(HAN);
          expect(text, `${locale} ${path}`).not.toMatch(KANA);
        }
      }
    }
  });

  test("[SWHR2-C-0027] a shopper who has not chosen a locale sees US English", async ({ page }) => {
    await page.goto("/petstore");
    await expect(page.getByRole("heading", { name: "Catalog" })).toBeVisible();
    const text = await body(page).innerText();
    expect(text).not.toMatch(KANA);
    expect(text).not.toMatch(HAN);
  });

  test("[SWHR2-C-0028] activating the Japanese flag in the header switches the storefront to Japanese", async ({
    page,
  }) => {
    await page.goto("/petstore");
    await page
      .getByRole("button", { name: /日本語|japanese/i })
      .first()
      .click();
    await expect.poll(async () => KANA.test(await body(page).innerText())).toBe(true);
    await page.goto("/petstore/cart");
    expect(await body(page).innerText()).toMatch(KANA);
  });
});
