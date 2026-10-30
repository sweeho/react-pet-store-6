import { expect, test, type Page } from "@playwright/test";

const ADMIN = {
  user: process.env.E2E_ADMIN_USER ?? "admin",
  pw: process.env.E2E_ADMIN_PASSWORD ?? "admin-pw",
};
const SUPPLIER = {
  user: process.env.E2E_SUPPLIER_USER ?? "supplier",
  pw: process.env.E2E_SUPPLIER_PASSWORD ?? "supplier-pw",
};
const LOGIN_ERROR =
  "You could not be authenticated with the information provided. Please check your Username and Password.";

const addToCart = (p: Page) =>
  p.getByRole("button", { name: /add to cart/i }).or(p.getByRole("link", { name: /add to cart/i }));

async function fillLogin(page: Page, user: string, pw: string) {
  await page.getByLabel(/user id/i).fill(user);
  await page.getByLabel(/password/i).fill(pw);
  await page.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
}

async function signInCustomer(page: Page) {
  await page.goto("/petstore/signin");
  await fillLogin(page, "j2ee", "j2ee");
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
}

test.describe("sign-on", () => {
  test("a visitor who is not signed in and opens Account is sent to sign in first", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /^account$/i }).click();
    await expect(page.getByLabel(/user id/i)).toBeVisible();
  });

  test("moving from admin to supplier means signing out of admin and signing in to supplier", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, ADMIN.user, ADMIN.pw);
    await page
      .getByRole("button", { name: /log ?out/i })
      .or(page.getByRole("link", { name: /log ?out/i }))
      .click();
    await page.goto("/admin");
    await expect(page.getByLabel(/user id/i)).toBeVisible();
    await page.goto("/supplier");
    await expect(page.getByLabel(/user id/i)).toBeVisible();
    await fillLogin(page, SUPPLIER.user, SUPPLIER.pw);
    await expect(page.getByLabel(/user id/i)).toHaveCount(0);
  });

  test("while signed in as administrator the supplier area is refused until signing out", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, ADMIN.user, ADMIN.pw);
    await page.goto("/supplier");
    await fillLogin(page, SUPPLIER.user, SUPPLIER.pw);
    await expect(page.getByText(/sign out of (the )?admin/i)).toBeVisible();
    await page.goto("/admin");
    await page
      .getByRole("button", { name: /log ?out/i })
      .or(page.getByRole("link", { name: /log ?out/i }))
      .click();
    await page.goto("/supplier");
    await fillLogin(page, SUPPLIER.user, SUPPLIER.pw);
    await expect(page.getByText(/sign out of (the )?admin/i)).toHaveCount(0);
    await expect(page.getByLabel(/user id/i)).toHaveCount(0);
  });

  test("the admin area while not signed in shows User ID, Password and a submit control", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page.getByLabel(/user id/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign ?in|log ?in|submit/i })).toBeVisible();
  });

  test("wrong admin credentials show Login Error, the set text and a link back to sign-in", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, "admin", "wrong");
    await expect(page.getByText("Login Error")).toBeVisible();
    await expect(page.getByText(LOGIN_ERROR)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /sign ?in|log ?in|try again|back/i }),
    ).toBeVisible();
  });

  test("the admin landing page describes the features and offers Launch tool and Log out", async ({
    page,
  }) => {
    await page.goto("/admin");
    await fillLogin(page, ADMIN.user, ADMIN.pw);
    for (const word of [/sales/i, /revenue/i, /order status/i, /approve/i, /deny/i])
      await expect(page.getByText(word).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /launch/i }).or(page.getByRole("button", { name: /launch/i })),
    ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: /log ?out/i })
        .or(page.getByRole("button", { name: /log ?out/i })),
    ).toBeVisible();
  });

  test("signing out in Japanese shows the signed-out screen, empties the cart and keeps Japanese", async ({
    page,
  }) => {
    await signInCustomer(page);
    await page.goto("/?locale=ja_JP");
    for (const id of ["EST-1", "EST-2"]) {
      await page.goto(`/petstore/item/${id}`);
      await addToCart(page).click();
    }
    await page
      .getByRole("link", { name: /sign out|サインアウト|ログアウト/i })
      .or(page.getByText(/sign out|サインアウト|ログアウト/i))
      .first()
      .click();
    await expect(page).toHaveURL(/signed-out/);
    await expect(page.getByRole("link").filter({ hasText: /./ }).first()).toBeVisible();
    // the signed-out screen itself is in Japanese
    await expect(page.locator("body")).toContainText(/[\u3040-\u30ff\u4e00-\u9fff]/);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", /ja/);
    await expect(page.locator("body")).toContainText(/[\u3040-\u30ff]/);
    await page
      .getByRole("link", { name: /cart|カート/i })
      .first()
      .click();
    await expect(page.getByText("EST-1")).toHaveCount(0);
    await expect(page.getByText("EST-2")).toHaveCount(0);
  });
});
