import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, user = "j2ee", password = "j2ee") {
  await page.goto("/petstore/signin");
  await page.locator("#signin-user").fill(user);
  await page.locator("#signin-password").fill(password);
  await page.locator("#signin-password").press("Enter");
  await expect(page).toHaveURL(/\/petstore\/?$/);
}

async function addToCart(page: Page, itemId = "EST-1") {
  await page.goto(`/petstore/item/${itemId}`);
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page).toHaveURL(/\/petstore\/cart/);
}

test.describe("checkout", () => {
  test("Check Out opens the billing and shipping form", async ({ page }) => {
    await signIn(page);
    await addToCart(page);
    await page.getByRole("link", { name: /check ?out/i }).click();
    await expect(page).toHaveURL(/\/petstore\/checkout/);
    await expect(
      page.getByRole("heading", { name: /billing and shipping information/i }),
    ).toBeVisible();
  });

  test("placing an order shows Order Placed and empties the cart", async ({ page }) => {
    await signIn(page);
    await addToCart(page, "EST-1");
    await addToCart(page, "EST-2");
    await page.getByRole("link", { name: /check ?out/i }).click();
    await page
      .getByLabel(/^state$/i)
      .last()
      .fill("NY");
    await page
      .getByRole("button", { name: /^place order$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/petstore\/order-placed/);
    await expect(page.getByRole("heading", { name: /order placed/i })).toBeVisible();
    await page.goto("/petstore/cart");
    await expect(page.getByText("Your Shopping Cart is Empty.")).toBeVisible();
  });

  test("a visitor who is not signed in is sent to sign in first", async ({ page }) => {
    await page.goto("/petstore/item/EST-1");
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.getByRole("link", { name: /check ?out/i }).click();
    await expect(page).toHaveURL(/\/petstore\/signin/);
    await page.locator("#signin-user").fill("j2ee");
    await page.locator("#signin-password").fill("j2ee");
    await page.locator("#signin-password").press("Enter");
    await expect(page).toHaveURL(/\/petstore\/checkout/);
  });

  test("a first-time visitor signs up, enters account information and can buy", async ({
    page,
  }) => {
    const name = `buyer${Date.now()}`;
    await page.goto("/petstore/signin");
    await page.locator("#new-user").fill(name);
    await page.locator("#new-secret").fill("secret1");
    await page.locator("#new-secret2").fill("secret1");
    await page.getByRole("button", { name: "Create new account" }).click();
    await expect(page).toHaveURL(/\/petstore\/account/);
    for (const [id, v] of [
      ["givenName", "Ada"],
      ["familyName", "Lovelace"],
      ["email", "ada@example.com"],
      ["telephone", "555-0100"],
      ["street1", "1 Main St"],
      ["city", "Springfield"],
      ["state", "CA"],
      ["zip", "90001"],
      ["country", "USA"],
      ["cardNumber", "4111111111111111"],
    ] as const)
      await page.locator(`#acct-${id}`).fill(v);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/petstore\/?$/);
    await addToCart(page);
    await page.getByRole("link", { name: /check ?out/i }).click();
    await expect(page.getByLabel(/^given name$/i).first()).toHaveValue("Ada");
    await page
      .getByRole("button", { name: /^place order$/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/petstore\/order-placed/);
    await expect(page.getByText(/^1001\d+$/).first()).toBeVisible();
  });
});
