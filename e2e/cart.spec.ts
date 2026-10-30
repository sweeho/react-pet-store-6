import { expect, test, type Page } from "@playwright/test";

const EMPTY = "Your Shopping Cart is Empty.";
const row = (p: Page, text: string | RegExp) => p.getByRole("row").filter({ hasText: text });
const addIn = (p: Page, scope: ReturnType<typeof row>) =>
  scope.getByRole("button", { name: /add to cart/i }).first();

async function signIn(page: Page) {
  await page.goto("/petstore/signin");
  await page.locator("#signin-user").fill("j2ee");
  await page.locator("#signin-password").fill("j2ee");
  await page.getByRole("button", { name: /^sign ?in$/i }).click();
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
}
async function addItem(page: Page, id: string) {
  await page.goto(`/petstore/item/${id}`);
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page).toHaveURL(/\/petstore\/cart/);
}

test.describe("shopping cart", () => {
  test("[SWHR2-C-0084] an item added in one session does not appear in another session's cart", async ({
    browser,
  }) => {
    const a = await (await browser.newContext()).newPage();
    const b = await (await browser.newContext()).newPage();
    await addItem(a, "EST-1");
    await expect(a.getByText("EST-1").first()).toBeVisible();
    await b.goto("/petstore/cart");
    await expect(b.getByText(EMPTY)).toBeVisible();
  });

  test("[SWHR2-C-0085] signing out with EST-1 in the cart leaves the cart empty", async ({
    page,
  }) => {
    await signIn(page);
    await addItem(page, "EST-1");
    await page.getByText(/^sign out$/i).click();
    await page.goto("/petstore/cart");
    await expect(page.getByText(EMPTY)).toBeVisible();
    await signIn(page);
    await page.goto("/petstore/cart");
    await expect(page.getByText(EMPTY)).toBeVisible();
  });

  test("[SWHR2-C-0088] Remove on the EST-1 row redisplays the cart showing only EST-2", async ({
    page,
  }) => {
    await addItem(page, "EST-1");
    await addItem(page, "EST-2");
    await row(page, "EST-1")
      .getByRole("button", { name: /remove/i })
      .click();
    await expect(page.getByText("EST-1")).toHaveCount(0);
    await expect(page.getByText("EST-2").first()).toBeVisible();
  });

  test("[SWHR2-C-0096] adding EST-1 from the product listing puts it in the cart with quantity 1", async ({
    page,
  }) => {
    await page.goto("/petstore/product/FI-SW-01");
    await addIn(page, row(page, "EST-1")).click();
    await expect(row(page, "EST-1").getByRole("spinbutton")).toHaveValue("1");
  });

  test("[SWHR2-C-0097] adding EST-2 from a search result puts it in the cart with quantity 1", async ({
    page,
  }) => {
    await page.goto("/petstore/search?q=Angelfish");
    await addIn(page, row(page, /Small Angelfish|EST-2/)).click();
    await expect(row(page, "EST-2").getByRole("spinbutton")).toHaveValue("1");
  });
});
