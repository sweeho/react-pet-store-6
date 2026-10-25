import { expect, test, type Page } from "@playwright/test";

type Profile = { favouriteCategory?: string; myListOn?: boolean; bannerOn?: boolean };

async function signIn(page: Page, user = "j2ee", pw = "j2ee") {
  await page.goto("/petstore/signin");
  await page
    .getByLabel(/user id/i)
    .first()
    .fill(user);
  await page
    .getByLabel(/^password/i)
    .first()
    .fill(pw);
  await page
    .getByRole("button", { name: /^(sign ?in|log ?in)/i })
    .first()
    .click();
  await expect(page.getByText(/^sign out$/i)).toBeVisible();
}
/** Signs in as j2ee and stores the given profile preferences through the account API. */
async function signedInWith(page: Page, profile: Profile) {
  await signIn(page);
  const res = await page.request.put("/api/account", { data: { profile } });
  expect(res.ok()).toBe(true);
}
const signUpForm = (page: Page) =>
  page.locator("form").filter({ hasText: /new customer|sign ?up|register/i });
async function fillSignUp(page: Page, user: string, pw: string, repeat: string) {
  const f = signUpForm(page);
  await f.getByLabel(/user (name|id)/i).fill(user);
  await f
    .getByLabel(/password/i)
    .first()
    .fill(pw);
  await f
    .getByLabel(/password/i)
    .last()
    .fill(repeat);
}
const submitSignUp = (page: Page) => signUpForm(page).getByRole("button").first().click();
const banner = (page: Page) => page.getByTestId("pet-tips-banner");

test.describe("sign up", () => {
  // case: SWHR2-C-0146@v1
  test("SWHR2-C-0146: signing up as j2ee with the same password in both fields proceeds to account creation", async ({
    page,
  }) => {
    // the case signs up as j2ee itself, so this runs against a database with no j2ee account yet
    await page.goto("/petstore/signin");
    await fillSignUp(page, "j2ee", "secret1", "secret1");
    await submitSignUp(page);
    await expect(page.getByLabel(/card type/i)).toBeVisible();
    await page.getByText(/^sign out$/i).click();
    await signIn(page, "j2ee", "secret1");
  });

  // case: SWHR2-C-0156@v1
  test("SWHR2-C-0156: signing up as an existing j2ee is redirected to the user-creation error page", async ({
    page,
  }) => {
    await signIn(page);
    await page.getByText(/^sign out$/i).click();
    await page.goto("/petstore/signin");
    await fillSignUp(page, "j2ee", "other1", "other1");
    await submitSignUp(page);
    await expect(
      page.getByText(/user name.*(in use|taken|exists)|already (exists|in use)/i).first(),
    ).toBeVisible();
    await expect(page.getByLabel(/card type/i)).toHaveCount(0);
  });

  // case: SWHR2-C-0147@v1
  test("SWHR2-C-0147: leaving the repeated password empty is refused in the browser", async ({
    page,
  }) => {
    const posts: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && /register/.test(r.url())) posts.push(r.url());
    });
    await page.goto("/petstore/signin");
    await fillSignUp(page, "newuser", "secret1", "");
    await submitSignUp(page);
    const repeated = signUpForm(page)
      .getByLabel(/password/i)
      .last();
    expect(await repeated.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    expect(posts).toEqual([]);
    await expect(page).toHaveURL(/signin/);
  });

  // case: SWHR2-C-0164@v1
  test("SWHR2-C-0164: signing up as newuser registers the name and continues to account creation", async ({
    page,
  }) => {
    await page.goto("/petstore/signin");
    await fillSignUp(page, "newuser", "secret1", "secret1");
    await submitSignUp(page);
    await expect(page.getByLabel(/card type/i)).toBeVisible();
  });

  // case: SWHR2-C-0165@v1
  test("SWHR2-C-0165: signing up as the existing j2ee shows the User Creation Error screen", async ({
    page,
  }) => {
    await page.goto("/petstore/signin");
    await fillSignUp(page, "j2ee", "secret1", "secret1");
    await submitSignUp(page);
    await expect(page.getByText(/user creation error/i)).toBeVisible();
    await expect(page.getByText(/in use/i)).toBeVisible();
  });

  // case: SWHR2-C-0174@v1
  test("SWHR2-C-0174: a first-time visitor signs up, enters account information and can then buy", async ({
    page,
  }) => {
    await page.goto("/petstore/signin");
    await fillSignUp(page, "firsttimer", "secret1", "secret1");
    await submitSignUp(page);
    await page.getByLabel(/first name|given name/i).fill("First");
    await page.getByLabel(/last name|family name/i).fill("Timer");
    await page.getByLabel(/phone/i).fill("555-0101");
    await page.getByLabel(/e-?mail/i).fill("first@example.com");
    await page
      .getByLabel(/address 1|street/i)
      .first()
      .fill("1 Main St");
    await page.getByLabel(/city/i).fill("Palo Alto");
    await page.getByLabel(/state/i).fill("CA");
    await page.getByLabel(/zip|postal/i).fill("94303");
    await page.getByLabel(/country/i).fill("USA");
    await page.getByLabel(/card number/i).fill("4111111111111111");
    await page.getByLabel(/card type/i).selectOption({ index: 0 });
    await page.getByRole("button", { name: /save|submit|create/i }).click();
    await page.goto("/petstore/item/EST-1");
    await page
      .getByRole("button", { name: /add to cart/i })
      .or(page.getByRole("link", { name: /add to cart/i }))
      .click();
    await page.getByRole("link", { name: /cart/i }).first().click();
    await page.getByRole("link", { name: /check ?out/i }).click();
    await page
      .getByRole("button", { name: /continue|submit|place|next/i })
      .first()
      .click();
    const confirm = page.getByRole("button", { name: /confirm|place order|submit/i });
    if (await confirm.count()) await confirm.first().click();
    await expect(page.getByText(/\b1001\d+\b/).first()).toBeVisible();
  });
});

test.describe("My List panel and pet-tips banner", () => {
  // case: SWHR2-C-0157@v1
  test("SWHR2-C-0157: with MyList on and favourite BIRDS the panel lists BIRDS products linked to their pages", async ({
    page,
  }) => {
    await signedInWith(page, { favouriteCategory: "BIRDS", myListOn: true });
    await page.goto("/petstore/category/FISH");
    const panel = page.getByTestId("my-list");
    const links = panel.getByRole("link");
    expect(await links.count()).toBeGreaterThan(0);
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
      expect(href).toMatch(/\/petstore\/product\/AV-/);
    }
  });

  // case: SWHR2-C-0159@v1
  test("SWHR2-C-0159: with MyList off no My List panel is shown", async ({ page }) => {
    await signedInWith(page, { favouriteCategory: "BIRDS", myListOn: false });
    for (const url of ["/", "/petstore/category/FISH"]) {
      await page.goto(url);
      await expect(page.getByTestId("my-list")).toHaveCount(0);
    }
  });

  // case: SWHR2-C-0160@v1
  test("SWHR2-C-0160: with the banner on and favourite CATS the home screen shows the cats banner", async ({
    page,
  }) => {
    await signedInWith(page, { favouriteCategory: "CATS", bannerOn: true });
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toHaveAttribute("data-category", /cats/i);
  });

  // case: SWHR2-C-0162@v1
  test("SWHR2-C-0162: no pet-tips banner appears on a product screen", async ({ page }) => {
    await signedInWith(page, { favouriteCategory: "CATS", bannerOn: true });
    await page.goto("/petstore/product/FI-SW-01");
    await expect(banner(page)).toHaveCount(0);
  });

  // case: SWHR2-C-0163@v1
  test("SWHR2-C-0163: with the banner preference off the home screen shows no banner", async ({
    page,
  }) => {
    await signedInWith(page, { favouriteCategory: "CATS", bannerOn: false });
    await page.goto("/");
    await expect(banner(page)).toHaveCount(0);
  });
});
