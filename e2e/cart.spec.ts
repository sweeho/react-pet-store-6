import { expect, test, type Page } from "@playwright/test";

async function addBulldog(page: Page) {
  await page.goto("/");
  await page.getByRole("complementary").getByRole("link", { name: "Dogs" }).click();
  await page.getByRole("link", { name: "Bulldog" }).click();
  await page
    .getByRole("row")
    .filter({ hasText: "Male Adult Bulldog" })
    .getByRole("button", { name: /add to cart/i })
    .click();
  await expect(page).toHaveURL(/\/petstore\/cart/);
}

test.describe("shopping cart screen", () => {
  test("new session shows the empty cart with no rows, Update Cart or Check Out", async ({
    page,
  }) => {
    await page.goto("/petstore/cart");
    await expect(page.getByText("Your Shopping Cart is Empty.")).toBeVisible();
    await expect(page.getByRole("row")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /update cart/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /check out/i })).toHaveCount(0);
  });

  test("add, update quantity, check out link, remove, back to empty", async ({ page }) => {
    await addBulldog(page);
    const row = page.getByRole("row").filter({ hasText: "Male Adult Bulldog" });
    await expect(row.getByRole("link", { name: "Male Adult Bulldog" })).toBeVisible();
    await expect(row.getByRole("textbox")).toHaveValue("1");
    await row.getByRole("textbox").fill("3");
    await page.getByRole("button", { name: /update cart/i }).click();
    await expect(row.getByRole("textbox")).toHaveValue("3");
    await expect(page.getByRole("link", { name: /check out/i })).toHaveAttribute(
      "href",
      "/petstore/checkout",
    );
    await row.getByRole("button", { name: /remove/i }).click();
    await expect(page.getByText("Your Shopping Cart is Empty.")).toBeVisible();
  });

  test("two sessions have separate carts", async ({ page, browser }) => {
    await addBulldog(page);
    const other = await browser.newContext();
    const p2 = await other.newPage();
    await p2.goto("http://localhost:5178/petstore/cart");
    await expect(p2.getByText("Your Shopping Cart is Empty.")).toBeVisible();
    await other.close();
  });
});
