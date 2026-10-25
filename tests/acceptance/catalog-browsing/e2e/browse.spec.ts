import { expect, test, type Locator, type Page } from "@playwright/test";

const next = (p: Page) =>
  p.getByRole("link", { name: /next/i }).or(p.getByRole("button", { name: /next/i }));
const previous = (p: Page) =>
  p.getByRole("link", { name: /previous/i }).or(p.getByRole("button", { name: /previous/i }));
const addToCart = (p: Page | Locator) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));

test.describe("catalog browsing", () => {
  // case: SWHR2-C-0197@v1
  test("SWHR2-C-0197: the first page of DOGS shows Bulldog and Dalmation, with Next and no Previous", async ({
    page,
  }) => {
    await page.goto("/petstore/category/DOGS");
    await expect(page.getByText("Bulldog")).toBeVisible();
    await expect(page.getByText("Dalmation")).toBeVisible();
    await expect(next(page)).toBeVisible();
    await expect(previous(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0198@v1
  test("SWHR2-C-0198: selecting Next on DOGS shows Poodle, with Previous and no Next", async ({
    page,
  }) => {
    await page.goto("/petstore/category/DOGS");
    await next(page).click();
    await expect(page.getByText("Poodle")).toBeVisible();
    await expect(previous(page)).toBeVisible();
    await expect(next(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0200@v1
  test("SWHR2-C-0200: Add to Cart on the EST-1 detail page adds EST-1 to the cart", async ({
    page,
  }) => {
    await page.goto("/petstore/item/EST-1");
    await addToCart(page).click();
    await page.getByRole("link", { name: /cart/i }).first().click();
    await expect(page.getByText("EST-1")).toBeVisible();
  });

  // case: SWHR2-C-0201@v1
  test("SWHR2-C-0201: the side panel lists Birds, Cats, Dogs, Fish, Reptiles on every storefront screen", async ({
    page,
  }) => {
    for (const url of [
      "/",
      "/petstore/category/FISH",
      "/petstore/product/FI-SW-01",
      "/petstore/item/EST-1",
    ]) {
      await page.goto(url);
      const panel = page.getByRole("complementary");
      await expect(panel.getByRole("link")).toHaveText([
        "Birds",
        "Cats",
        "Dogs",
        "Fish",
        "Reptiles",
      ]);
    }
  });

  // case: SWHR2-C-0202@v1
  test("SWHR2-C-0202: selecting Reptiles in the side panel opens the REPTILES category page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("complementary").getByRole("link", { name: "Reptiles" }).click();
    await expect(page).toHaveURL(/\/petstore\/category\/REPTILES/);
  });

  // case: SWHR2-C-0206@v1
  test("SWHR2-C-0206: home to DOGS to Bulldog lists Bulldog's items, each with add-to-cart", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("complementary").getByRole("link", { name: "Dogs" }).click();
    await page.getByRole("link", { name: "Bulldog" }).click();
    await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
    const rows = page.getByRole("row").filter({ hasText: /Bulldog/ });
    const rowsCount = await rows.count();
    expect(rowsCount).toBeGreaterThan(0);
    for (let i = 0; i < rowsCount; i++) await expect(addToCart(rows.nth(i))).toHaveCount(1);
  });

  // case: SWHR2-C-0207@v1
  test("SWHR2-C-0207: add-to-cart on Male Adult Bulldog adds it to the cart", async ({ page }) => {
    await page.goto("/petstore/category/DOGS");
    await page.getByRole("link", { name: "Bulldog" }).click();
    await page
      .getByRole("row")
      .filter({ hasText: "Male Adult Bulldog" })
      .locator("button, a")
      .filter({ hasText: /add to cart/i })
      .click();
    await page.getByRole("link", { name: /cart/i }).first().click();
    await expect(page.getByText("Male Adult Bulldog")).toBeVisible();
  });
});
