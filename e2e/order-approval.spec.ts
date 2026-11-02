import { expect, test } from "@playwright/test";

const PARTY = {
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

test("[SWHR2-C-0243] a large US order stays pending until approved; after commit and refresh it shows APPROVED", async ({
  page,
}) => {
  // A customer places an en_US order well above 500.00 through the API.
  const signIn = await page.request.post("/api/session/sign-in", {
    data: { userId: "j2ee", password: "j2ee", remember: false },
  });
  expect(signIn.ok()).toBe(true);
  await page.request.post("/api/cart/items", { data: { itemId: "EST-1", quantity: 100 } });
  const placed = await page.request.post("/api/orders", {
    data: { billing: PARTY, shipping: PARTY },
  });
  expect(placed.ok()).toBe(true);
  const { orderId } = (await placed.json()) as { orderId: string };

  // The administrator finds it in the pending view once order processing has received it.
  await page.goto("/admin");
  await page.getByLabel("User ID").fill("admin");
  await page.getByLabel("Password").fill("admin-pw");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.goto("/admin/tool");
  const refresh = page.getByRole("button", { name: /refresh/i });
  const row = page.getByRole("row").filter({ hasText: orderId });
  await expect(async () => {
    await refresh.click();
    await expect(row).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(row).toContainText("PENDING");

  await row.getByRole("checkbox").check();
  await page.getByRole("button", { name: /approve/i }).click();
  await expect(row).toContainText("APPROVED");
  await page.getByRole("button", { name: /commit/i }).click();

  // The decision travels on the order.approval channel, so the view catches up after a refresh.
  await page.getByRole("tab", { name: /non-?pending/i }).click();
  await expect(async () => {
    await refresh.click();
    await expect(row).toContainText("APPROVED", { timeout: 1000 });
  }).toPass();
});
