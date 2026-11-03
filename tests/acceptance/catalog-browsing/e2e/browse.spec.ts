import { expect, test, type Locator, type Page } from "@playwright/test";

const next = (p: Page) =>
  p.getByRole("link", { name: /next/i }).or(p.getByRole("button", { name: /next/i }));
const previous = (p: Page) =>
  p.getByRole("link", { name: /previous/i }).or(p.getByRole("button", { name: /previous/i }));
const addToCart = (p: Page | Locator) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));
/** Product links on a category page that carry a name (an image-only link is skipped). */
const productLinks = (p: Page) =>
  p.locator('a[href*="/petstore/product/"]').filter({ hasText: /\S/ });
/** A row that links to item `id`'s detail page (exact id, so EST-1 never picks EST-10). */
const itemRow = (p: Page, id: string) =>
  p.getByRole("row").filter({ has: p.locator(`a[href$="/item/${id}"]`) });
/** The side panel: the innermost aside that holds category links (a second aside is ignored). */
const sidePanel = (p: Page) =>
  p
    .getByRole("complementary")
    .filter({ has: p.locator('a[href*="/petstore/category/"]') })
    .filter({ hasNot: p.getByRole("complementary") });

/** Click an add-to-cart control and wait until the cart route has answered. */
async function addAndWait(page: Page, control: Locator): Promise<void> {
  const added = page.waitForResponse(
    (r) => r.url().includes("/api/cart") && r.request().method() === "POST",
  );
  await control.click();
  expect((await added).ok()).toBe(true);
}

/** Open the cart through a link that goes to the cart page, never an Add to Cart control. */
async function openCart(page: Page): Promise<void> {
  await page
    .locator('a[href$="/petstore/cart"]')
    .filter({ hasNotText: /add to cart/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/petstore\/cart$/);
}

test.describe("catalog browsing", () => {
  // case: SWHR2-C-0197@v1
  test("SWHR2-C-0197: the first page of DOGS shows Bulldog and Chihuahua, with Next and no Previous", async ({
    page,
  }) => {
    // The case's DOGS holds Poodle, Bulldog and Dalmation. This suite runs on the sample load
    // (its contents are data-population's SWHR2-C-0075, tested in data-population), whose DOGS
    // holds six products. The precondition is checked below rather than assumed.
    await page.goto("/petstore/category/DOGS");
    await expect(productLinks(page)).toHaveText(["Bulldog", "Chihuahua"]);
    await expect(next(page)).toBeVisible();
    await expect(previous(page)).toHaveCount(0);

    // Precondition: DOGS's products, read page by page, are these six in name order, 2 per page,
    // so Bulldog and Chihuahua are the first two by name.
    const seen: string[] = [...(await productLinks(page).allInnerTexts())];
    for (const pair of [
      ["Dalmation", "Golden Retriever"],
      ["Labrador Retriever", "Poodle"],
    ]) {
      await next(page).click();
      await expect(productLinks(page)).toHaveText(pair);
      seen.push(...pair);
    }
    expect(seen).toEqual([
      "Bulldog",
      "Chihuahua",
      "Dalmation",
      "Golden Retriever",
      "Labrador Retriever",
      "Poodle",
    ]);
  });

  // case: SWHR2-C-0198@v1
  test("SWHR2-C-0198: selecting Next on DOGS to the last page shows Labrador Retriever and Poodle, with Previous and no Next", async ({
    page,
  }) => {
    // Seed (SWHR2-C-0075): pages are Bulldog/Chihuahua, Dalmation/Golden Retriever, Labrador Retriever/Poodle.
    await page.goto("/petstore/category/DOGS");
    await next(page).click();
    await expect(page.getByText("Dalmation", { exact: true })).toBeVisible();
    await expect(page.getByText("Golden Retriever", { exact: true })).toBeVisible();
    await next(page).click();
    await expect(page.getByText("Labrador Retriever", { exact: true })).toBeVisible();
    await expect(page.getByText("Poodle", { exact: true })).toBeVisible();
    await expect(previous(page)).toBeVisible();
    await expect(next(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0200@v1
  test("SWHR2-C-0200: Add to Cart on the EST-1 detail page adds EST-1 to the cart", async ({
    page,
  }) => {
    await page.goto("/petstore/item/EST-1");
    await addAndWait(page, addToCart(page));
    await openCart(page);
    // The cart holds an EST-1 line: a row linking to /item/EST-1 (not EST-10 to EST-19).
    await expect(itemRow(page, "EST-1")).toHaveCount(1);
  });

  // case: SWHR2-C-0201@v1
  test("SWHR2-C-0201: the side panel lists exactly Birds, Cats, Dogs, Fish, Reptiles on the home, category, product and item screens", async ({
    page,
  }) => {
    for (const url of [
      "/",
      "/petstore/category/FISH",
      "/petstore/product/FI-SW-01",
      "/petstore/item/EST-1",
    ]) {
      await page.goto(url);
      const panel = sidePanel(page);
      await expect(panel).toHaveCount(1);
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
    await expect(page).toHaveURL(/\/petstore\/product\//);
    // Bulldog's items in the sample load are EST-6 Male Adult Bulldog and EST-7 Female Puppy
    // Bulldog. Every item row (a row linking to an item page) is one of them, and has add-to-cart.
    const rows = page.getByRole("row").filter({ has: page.locator('a[href*="/item/"]') });
    await expect(rows).toHaveCount(2);
    await expect(itemRow(page, "EST-6").filter({ hasText: "Male Adult Bulldog" })).toHaveCount(1);
    await expect(itemRow(page, "EST-7").filter({ hasText: "Female Puppy Bulldog" })).toHaveCount(1);
    for (let i = 0; i < 2; i++) await expect(addToCart(rows.nth(i))).toHaveCount(1);
  });

  // case: SWHR2-C-0207@v1
  test("SWHR2-C-0207: add-to-cart on Male Adult Bulldog adds it to the cart", async ({ page }) => {
    await page.goto("/petstore/category/DOGS");
    await page.getByRole("link", { name: "Bulldog" }).click();
    const row = page.getByRole("row").filter({ hasText: "Male Adult Bulldog" });
    await expect(row).toHaveCount(1);
    await addAndWait(page, addToCart(row));
    await openCart(page);
    // The cart page shows a Male Adult Bulldog line: the row linking to /item/EST-6.
    await expect(itemRow(page, "EST-6").filter({ hasText: "Male Adult Bulldog" })).toHaveCount(1);
  });
});
