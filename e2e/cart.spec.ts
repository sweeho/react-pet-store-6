import { expect, test, type Page } from "@playwright/test";

const row = (p: Page, text: string | RegExp) => p.getByRole("row").filter({ hasText: text });
async function addFromProduct(page: Page, id: string) {
  await page.goto("/petstore/product/FI-SW-01");
  await row(page, id)
    .getByRole("button", { name: /add to cart/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/petstore\/cart/);
}

test.describe("shopping cart", () => {
  test("[SWHR2-C-0093] [SWHR2-C-0096] adding from the product listing opens the cart with quantity 1", async ({
    page,
  }) => {
    await addFromProduct(page, "EST-1");
    await expect(row(page, "EST-1").getByRole("spinbutton")).toHaveValue("1");
  });

  test("[SWHR2-C-0088] Remove on the EST-1 row redisplays the cart showing only EST-2", async ({
    page,
  }) => {
    await addFromProduct(page, "EST-1");
    await addFromProduct(page, "EST-2");
    await row(page, "EST-1")
      .getByRole("button", { name: /remove/i })
      .click();
    await expect(page.getByText("EST-1")).toHaveCount(0);
    await expect(page.getByText("EST-2").first()).toBeVisible();
  });

  test("[SWHR2-C-0084] an item added in one session is not in another session's cart", async ({
    browser,
  }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    await addFromProduct(a, "EST-1");
    await b.goto("/petstore/cart");
    await expect(b.getByText("Your Shopping Cart is Empty.")).toBeVisible();
  });
});
