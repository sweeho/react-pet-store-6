import { expect, test, type Page } from "@playwright/test";

async function toCheckout(page: Page) {
  await page.goto("/petstore/signin");
  await page.getByLabel(/user id/i).fill("j2ee");
  await page.getByLabel(/password/i).fill("j2ee");
  await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
  await page.goto("/petstore/item/EST-1");
  await page
    .getByRole("button", { name: /add to cart/i })
    .or(page.getByRole("link", { name: /add to cart/i }))
    .click();
  await page.getByRole("link", { name: /cart/i }).first().click();
  await page
    .getByRole("button", { name: /check ?out/i })
    .or(page.getByRole("link", { name: /check ?out/i }))
    .click();
}

const field = (page: Page, label: RegExp) => page.getByLabel(label).first();

test.describe("checkout form", () => {
  // case: SWHR2-C-0215@v1
  test("SWHR2-C-0215: the billing and shipping form is pre-filled from the signed-in customer's account", async ({
    page,
  }) => {
    await toCheckout(page);
    await expect(field(page, /first name|given name/i)).toHaveValue("ABC");
    await expect(field(page, /last name|family name/i)).toHaveValue("XYZ");
    await expect(field(page, /address 1|street/i)).toHaveValue("1 Main St");
    await expect(field(page, /city/i)).toHaveValue("Palo Alto");
    await expect(field(page, /state/i)).toHaveValue("CA");
    await expect(field(page, /zip|postal/i)).toHaveValue("94303");
    await expect(field(page, /phone|telephone/i)).toHaveValue("555-555-5555");
    await expect(field(page, /e-?mail/i)).toHaveValue("abc@xyz.com");
  });

  // case: SWHR2-C-0216@v1
  test("SWHR2-C-0216: submitting the pre-filled form unchanged places the order with the pre-filled details", async ({
    page,
  }) => {
    await toCheckout(page);
    await page
      .getByRole("button", { name: /continue|submit|place|next/i })
      .first()
      .click();
    const confirm = page.getByRole("button", { name: /confirm|place order|submit/i });
    if (await confirm.count()) await confirm.first().click();
    await expect(page.getByText(/\b1001\d+\b/).first()).toBeVisible();
    await expect(page.getByText(/1 Main St/).first()).toBeVisible();
    await expect(page.getByText(/Palo Alto/).first()).toBeVisible();
  });
});

test.describe("server error page", () => {
  // case: SWHR2-C-0212@v1
  // Page half of the case: the failure is faked here, and the server producing it is covered by
  // the placement test in orders.test.ts.
  test("SWHR2-C-0212: the Server Error page shows the message and trace and asks the shopper to notify the administrator", async ({
    page,
  }) => {
    await page.route("**/api/orders", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              kind: "AppFailure",
              message: "boom-e2e",
              trace: "Error: boom-e2e\n    at placeOrder",
            }),
          })
        : route.continue(),
    );
    await toCheckout(page);
    await page
      .getByRole("button", { name: /continue|submit|place|next/i })
      .first()
      .click();
    const confirm = page.getByRole("button", { name: /confirm|place order|submit/i });
    if (await confirm.count()) await confirm.first().click();
    await expect(page.getByText(/server error/i).first()).toBeVisible();
    await expect(page.getByText(/boom-e2e/).first()).toBeVisible();
    await expect(page.getByText(/placeOrder/).first()).toBeVisible();
    await expect(page.getByText(/notify (the )?administrator/i).first()).toBeVisible();
  });
});
