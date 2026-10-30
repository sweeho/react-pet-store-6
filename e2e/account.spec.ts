import { expect, test } from "@playwright/test";

test.describe("customer account and profile", () => {
  test("duplicate user name shows the User Creation Error screen", async ({ page }) => {
    await page.goto("/petstore/signin");
    await page.getByLabel("User name").last().fill("j2ee");
    await page.locator("#new-secret").fill("pw1");
    await page.locator("#new-secret2").fill("pw2");
    await page.getByRole("button", { name: "Create new account" }).click();
    await expect(page).toHaveURL(/\/petstore\/user-creation-error/);
    await expect(page.getByText("That user name is in use")).toBeVisible();
  });

  test("new visitor signs up with differing passwords, creates an account and lands on Home", async ({
    page,
  }) => {
    const name = `e2e${Date.now()}`;
    await page.goto("/petstore/signin");
    await page.locator("#new-user").fill(name);
    await page.locator("#new-secret").fill("first");
    await page.locator("#new-secret2").fill("second");
    await page.getByRole("button", { name: "Create new account" }).click();
    await expect(page).toHaveURL(/\/petstore\/account/);

    const cardTypes = await page.locator("#acct-cardType option").allTextContents();
    expect(cardTypes).toEqual(["Java(TM) Card", "Duke Express", "Meow Card"]);
    expect(await page.locator("#acct-year").evaluate((el) => el.tagName)).toBe("SELECT");

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
    await page.locator("#acct-favourite").selectOption("BIRDS");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/petstore\/?$/);
    await expect(page.getByTestId("pet-tips-banner")).toHaveAttribute("data-category", "birds");
    await expect(page.getByTestId("my-list")).toBeVisible();
  });

  test("seeded customer j2ee signs in and lands on Home", async ({ page }) => {
    await page.goto("/petstore/signin");
    await page.locator("#signin-user").fill("j2ee");
    await page.locator("#signin-password").fill("j2ee");
    await page.locator("#signin-password").press("Enter");
    await expect(page).toHaveURL(/\/petstore\/?$/);
    await expect(page.getByTestId("pet-tips-banner")).toBeVisible();
  });
});
