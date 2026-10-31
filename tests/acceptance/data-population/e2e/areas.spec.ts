import { expect, test } from "@playwright/test";

test.describe("installed application areas", () => {
  // case: SWHR2-C-0079@v1
  test("SWHR2-C-0079: /petstore answers with the storefront and the supplier, admin and order-processing areas are available", async ({
    page,
    request,
  }) => {
    const store = await page.goto("/petstore");
    expect(store?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    for (const area of ["/supplier", "/admin"]) {
      const res = await request.get(area);
      expect(res.status(), area).toBeLessThan(400);
    }
    // order processing is the in-process worker: it accepts an order from a signed-in shopper
    await page.goto("/petstore/signin");
    await page.getByLabel(/^user id:?$/i).fill("j2ee");
    await page.getByLabel(/^password:?$/i).fill("j2ee");
    await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
    await expect(page.getByText(/^sign out$/i)).toBeVisible();
    const added = await page.request.post("/api/cart/items", { data: { itemId: "EST-1" } });
    expect(added.ok()).toBe(true);
    const contact = {
      givenName: "ABC",
      familyName: "XYZ",
      street: "1 Main St",
      city: "Palo Alto",
      state: "CA",
      country: "USA",
      zip: "94303",
      email: "abc@xyz.com",
      phone: "555-555-5555",
    };
    const placed = await page.request.post("/api/orders", {
      data: { billing: contact, shipping: contact },
    });
    expect(placed.status()).toBe(200);
    expect(await placed.json()).toHaveProperty("orderId");
  });
});
