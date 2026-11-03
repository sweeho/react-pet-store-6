import { expect, test, type Locator, type Page } from "@playwright/test";

const next = (p: Page) =>
  p.getByRole("link", { name: /next/i }).or(p.getByRole("button", { name: /next/i }));
const previous = (p: Page) =>
  p.getByRole("link", { name: /previous/i }).or(p.getByRole("button", { name: /previous/i }));
const addToCart = (p: Page | Locator) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));
/**
 * Product links on a category page that carry text (an image-only link is skipped). A product may
 * be one card link holding its name with other text (id, description), so a link is matched by the
 * name element it contains, never by its whole text.
 */
const productLinks = (p: Page) =>
  p.locator('a[href*="/petstore/product/"]').filter({ hasText: /\S/ });
/** The product link that contains an element whose whole text is `name`. */
const productLink = (p: Page, name: string) =>
  productLinks(p).filter({ has: p.getByText(name, { exact: true }) });
/** The category page lists exactly the products `names`, in that order, one link each. */
async function expectProducts(page: Page, names: string[]): Promise<void> {
  const links = productLinks(page);
  await expect(links).toHaveCount(names.length);
  for (const [i, name] of names.entries()) {
    await expect(links.nth(i).getByText(name, { exact: true }).first()).toBeVisible();
    await expect(productLink(page, name)).toHaveCount(1);
  }
}
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

/** Bulldog's product link on a category page: the one link holding the name Bulldog. */
async function bulldogLink(page: Page): Promise<Locator> {
  const link = productLink(page, "Bulldog");
  await expect(link).toHaveCount(1);
  return link;
}

/**
 * The cases' DOGS: en_US products Poodle, Bulldog and Dalmation, and nothing else. The shared
 * sqlite.db holds the six-product sample load that other specs rely on, and the product list is
 * cached for 5 minutes, so DOGS is not changed there. Instead the browser's call to the design's
 * `GET /api/catalog/categories/DOGS/products?start&size` is answered with these three, sorted by
 * name and paged by the start and size the page asks for (defaults 0 and 2), in the design's
 * `{ items, start, size, hasPrevious, hasNext }` shape.
 */
async function caseDogs(page: Page): Promise<void> {
  const dogs = [
    { productId: "K9-PO-02", name: "Poodle" },
    { productId: "K9-BD-01", name: "Bulldog" },
    { productId: "K9-DL-01", name: "Dalmation" },
  ].sort((a, b) => a.name.localeCompare(b.name));
  await page.route(
    (url) => url.pathname.endsWith("/api/catalog/categories/DOGS/products"),
    (route) => {
      const q = new URL(route.request().url()).searchParams;
      const start = Number(q.get("start") ?? 0);
      const size = Number(q.get("size") ?? 2);
      const items = dogs
        .slice(start, start + size)
        .map((d) => ({ ...d, productName: d.name, categoryId: "DOGS", description: d.name }));
      return route.fulfill({
        json: {
          items,
          start,
          size,
          hasPrevious: start > 0,
          hasNext: start + size < dogs.length,
        },
      });
    },
  );
}

test.describe("catalog browsing", () => {
  // case: SWHR2-C-0197@v1
  test("SWHR2-C-0197: the first page of DOGS shows Bulldog and Dalmation, with Next and no Previous", async ({
    page,
  }) => {
    await caseDogs(page);
    await page.goto("/petstore/category/DOGS");
    await expectProducts(page, ["Bulldog", "Dalmation"]);
    await expect(next(page)).toBeVisible();
    await expect(previous(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0198@v1
  test("SWHR2-C-0198: selecting Next on DOGS shows Poodle, with Previous and no Next", async ({
    page,
  }) => {
    await caseDogs(page);
    await page.goto("/petstore/category/DOGS");
    // Precondition: on the first page of DOGS (3 products).
    await expectProducts(page, ["Bulldog", "Dalmation"]);
    await next(page).click();
    await expectProducts(page, ["Poodle"]);
    await expect(previous(page)).toBeVisible();
    await expect(next(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0200@v1
  test("SWHR2-C-0200: Add to Cart on the EST-1 detail page adds EST-1 to the cart", async ({
    page,
  }) => {
    await page.goto("/petstore/item/EST-1");
    // The item page may show more than one Add to Cart control; any one of them adds EST-1.
    await addAndWait(page, addToCart(page).first());
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
    await (await bulldogLink(page)).click();
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
    await (await bulldogLink(page)).click();
    const row = page.getByRole("row").filter({ hasText: "Male Adult Bulldog" });
    await expect(row).toHaveCount(1);
    await addAndWait(page, addToCart(row));
    await openCart(page);
    // The cart page shows a Male Adult Bulldog line: the row linking to /item/EST-6.
    await expect(itemRow(page, "EST-6").filter({ hasText: "Male Adult Bulldog" })).toHaveCount(1);
  });
});
