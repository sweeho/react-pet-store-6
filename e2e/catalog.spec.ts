import { expect, test } from "@playwright/test";

async function openBulldog(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("complementary").getByRole("link", { name: "Dogs" }).click();
  await expect(page).toHaveURL(/\/petstore\/category\/DOGS/);
  await page.getByRole("link", { name: "Bulldog" }).click();
  await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
}

test.describe("browse from home to cart", () => {
  test("[SWHR2-C-0206] home to Dogs to Bulldog lists Bulldog's items, each with Add to Cart", async ({
    page,
  }) => {
    await openBulldog(page);
    const rows = page.getByRole("row").filter({ hasText: /Bulldog/ });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByRole("button", { name: /add to cart/i })).toHaveCount(1);
    }
  });

  test("[SWHR2-C-0207] Add to Cart on Male Adult Bulldog puts it on the cart page", async ({
    page,
  }) => {
    await openBulldog(page);
    await page
      .getByRole("row")
      .filter({ hasText: "Male Adult Bulldog" })
      .getByRole("button", { name: /add to cart/i })
      .click();
    await page.getByRole("link", { name: /cart/i }).first().click();
    await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
  });
});
