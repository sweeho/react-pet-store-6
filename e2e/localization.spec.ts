import { expect, test, type Page } from "@playwright/test";

const KANA = /[぀-ヿ]/;
const HAN = /[一-鿿]/;
const body = (page: Page) => page.locator("body");

async function changeLocale(page: Page, label: string) {
  await page.goto("/petstore/change-language");
  await page.getByRole("combobox").selectOption({ label });
  await page.getByRole("button", { name: "Change Locale" }).click();
}

test.describe("localization", () => {
  test("a shopper who has not chosen a locale sees US English", async ({ page }) => {
    await page.goto("/petstore");
    const text = await body(page).innerText();
    expect(text).not.toMatch(KANA);
    expect(text).not.toMatch(HAN);
    await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("[SWHR2-C-0028] activating the Japanese flag in the header switches the storefront to Japanese", async ({
    page,
  }) => {
    await page.goto("/petstore");
    await page.getByRole("button", { name: "Japanese" }).click();
    await expect(body(page)).toContainText(KANA);
    await page.goto("/petstore/cart");
    await expect(body(page)).toContainText(KANA);
    expect((await (await page.request.get("/api/session")).json()).locale).toBe("ja_JP");
  });

  test("[SWHR2-C-0021] selecting Japanese and submitting Change Locale sets ja_JP and confirms it", async ({
    page,
  }) => {
    await page.goto("/petstore/change-language");
    await expect(page.getByRole("combobox").locator("option")).toHaveText([
      "US English",
      "German",
      "Japanese",
      "Simplified Chinese",
    ]);
    await page.getByRole("combobox").selectOption({ label: "Japanese" });
    await page.getByRole("button", { name: "Change Locale" }).click();
    await expect(body(page)).toContainText("ja_JP");
    await page.goto("/petstore");
    await expect(body(page)).toContainText(KANA);
  });

  test("changing locale to zh_CN re-lists the EST-1 cart line with its zh_CN name and price", async ({
    page,
  }) => {
    expect((await page.request.post("/api/cart/items", { data: { itemId: "EST-1" } })).ok()).toBe(
      true,
    );
    await changeLocale(page, "Simplified Chinese");
    await expect(body(page)).toContainText("zh_CN");
    const cart = (await (await page.request.get("/api/cart")).json()) as {
      lines: { name: string; unitPrice: number }[];
    };
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ name: "大天使鱼", unitPrice: 14200 });
  });

  test("[SWHR2-C-0026] storefront screens render localized text in en_US, ja_JP and zh_CN", async ({
    page,
  }) => {
    for (const locale of ["en_US", "ja_JP", "zh_CN"]) {
      expect((await page.request.post("/api/session/locale", { data: { locale } })).ok()).toBe(
        true,
      );
      for (const path of ["/petstore", "/petstore/cart", "/petstore/signin"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const at = `${locale} ${path}`;
        if (locale === "en_US") await expect(body(page), at).not.toContainText(/[぀-ヿ一-鿿]/);
        if (locale === "ja_JP") await expect(body(page), at).toContainText(KANA);
        if (locale === "zh_CN") {
          await expect(body(page), at).toContainText(HAN);
          await expect(body(page), at).not.toContainText(KANA);
        }
      }
    }
  });

  test("[SWHR2-C-0295] after Change Locale to Japanese the main page is Japanese at its load event", async ({
    page,
  }) => {
    await changeLocale(page, "Japanese");
    await expect(body(page)).toContainText("ja_JP");
    await page.goto("/petstore");
    const text = await body(page).innerText();
    expect(text).toMatch(KANA);
    expect(text).not.toMatch(/sign in/i);
  });

  test("[SWHR2-C-0298] with session locale ja_JP the navigation and footer are Japanese and there is no Sign in", async ({
    page,
  }) => {
    expect(
      (await page.request.post("/api/session/locale", { data: { locale: "ja_JP" } })).ok(),
    ).toBe(true);
    await page.goto("/petstore");
    await expect(page.getByRole("navigation")).toContainText(KANA);
    await expect(page.getByRole("contentinfo")).toContainText(KANA);
    await expect(body(page)).not.toContainText(/sign in/i);
  });

  test("[SWHR2-C-0300] on the FISH page the header's Japanese flag turns the header Japanese in place", async ({
    page,
  }) => {
    await page.goto("/petstore/category/FISH");
    const header = page.getByRole("banner");
    await header.getByRole("button", { name: "Japanese" }).click();
    await expect(header).toContainText(KANA);
    await expect(header).not.toContainText(/sign in/i);
    expect(new URL(page.url()).pathname).toBe("/petstore/category/FISH");
  });
});
