import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// The dev server's database file (db/client.ts resolves it from the project root), shared by every
// worker and kept between runs.
const DB_FILE = path.join(process.cwd(), "sqlite.db");

/**
 * Removes the sign-on and customer rows of a user, so a name a previous run signed up is free
 * again. Playwright runs this file under Node, where bun:sqlite does not exist, so the deletes run
 * in a bun child process against the same file. A table this build does not have is skipped.
 */
function forgetUser(userId: string) {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, userId] = JSON.parse(process.argv[1]);
    const db = new Database(file);
    try {
      db.exec("PRAGMA busy_timeout = 10000");
      for (const t of ["customer_profiles", "customer_accounts", "customers", "signon_users"]) {
        const cols = db.query("select name from pragma_table_info(?)").all(t).map((c) => c.name);
        if (cols.includes("user_id")) db.query("delete from " + t + " where user_id = ?").run(userId);
      }
    } finally { db.close(); }`;
  execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, userId])]);
}

type Profile = { favouriteCategory?: string; myListOn?: boolean; bannerOn?: boolean };

async function signIn(page: Page, user = "j2ee", pw = "j2ee") {
  await page.goto("/petstore/signin");
  await page
    .getByLabel(/^user id:?$/i)
    .first()
    .fill(user);
  await page
    .getByLabel(/^password:?$/i)
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
  await f.getByLabel(/^user (name|id):?$/i).fill(user);
  await f
    .getByLabel(/^password:?$/i)
    .first()
    .fill(pw);
  await f
    .getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i)
    .last()
    .fill(repeat);
}
const submitSignUp = (page: Page) => signUpForm(page).getByRole("button").first().click();
const banner = (page: Page) => page.getByTestId("pet-tips-banner");

test.describe("sign up", () => {
  // case: SWHR2-C-0156@v1
  test("SWHR2-C-0156: signing up as an existing j2ee is redirected to the user-creation error page", async ({
    page,
  }) => {
    await signIn(page);
    await page.getByText(/^sign out$/i).click();
    await page.goto("/petstore/signin");
    await fillSignUp(page, "j2ee", "other1", "other1");
    await submitSignUp(page);
    await expect(page).toHaveURL(/user-creation-error/);
    await expect(
      page.getByText(/user name.*(in use|taken|exists)|already (exists|in use)/i).first(),
    ).toBeVisible();
    await expect(page.getByLabel(/^card type:?$/i)).toHaveCount(0);
    // nothing was created or changed: the existing account keeps its old password
    const res = await page.request.post("/api/session/sign-in", {
      data: { userId: "j2ee", password: "other1", remember: false },
    });
    expect(res.status()).toBe(401);
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
      .getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i)
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
    const registered = page.waitForResponse(
      (r) => r.request().method() === "POST" && /register/.test(r.url()),
    );
    await submitSignUp(page);
    expect((await registered).status()).toBeLessThan(300);
    await expect(page.getByLabel(/^card type:?$/i)).toBeVisible();
    // the name newuser is now registered: it signs on with the chosen password
    const res = await page.request.post("/api/session/sign-in", {
      data: { userId: "newuser", password: "secret1", remember: false },
    });
    expect(res.status()).toBe(200);
  });

  // case: SWHR2-C-0165@v1
  test("SWHR2-C-0165: signing up as the existing j2ee shows the User Creation Error screen", async ({
    page,
  }) => {
    await page.goto("/petstore/signin");
    await fillSignUp(page, "j2ee", "secret1", "secret1");
    await submitSignUp(page);
    await expect(page.getByText(/user creation error/i).first()).toBeVisible();
    await expect(page.getByText(/in use/i).first()).toBeVisible();
  });

  // case: SWHR2-C-0174@v1
  test("SWHR2-C-0174: a first-time visitor signs up, enters account information and can then buy", async ({
    page,
  }) => {
    // sign up, account entry, cart and checkout in one test: more than the suite's 15s budget
    // on a cold dev server shared by parallel workers
    test.slow();
    // precondition: no account exists for "firsttimer", even one an earlier run created
    forgetUser("firsttimer");
    await page.goto("/petstore/signin");
    await fillSignUp(page, "firsttimer", "secret1", "secret1");
    await submitSignUp(page);
    await page.getByLabel(/^(first|given) name:?$/i).fill("First");
    await page.getByLabel(/^(last|family) name:?$/i).fill("Timer");
    await page.getByLabel(/^(tele)?phone( number)?:?$/i).fill("555-0101");
    await page.getByLabel(/^e-?mail( address)?:?$/i).fill("first@example.com");
    await page
      .getByLabel(/^(street( address)?|address( line)? 1):?$/i)
      .first()
      .fill("1 Main St");
    await page.getByLabel(/^city:?$/i).fill("Palo Alto");
    await page.getByLabel(/^state( or province)?:?$/i).fill("CA");
    await page.getByLabel(/^(zip|postal)( code)?:?$/i).fill("94303");
    await page.getByLabel(/^country:?$/i).fill("USA");
    await page.getByLabel(/^card number:?$/i).fill("4111111111111111");
    await page.getByLabel(/^card type:?$/i).selectOption({ index: 0 });
    const saved = page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/account",
    );
    await page.getByRole("button", { name: /save|submit|create/i }).click();
    expect((await saved).status()).toBeLessThan(300);
    // the account is created: it reads back for the signed-on firsttimer with the entered details
    const account = await page.request.get("/api/account");
    expect(account.status()).toBe(200);
    const stored = JSON.stringify(await account.json());
    for (const v of ["firsttimer", "First", "Timer", "1 Main St", "Palo Alto", "first@example.com"])
      expect(stored).toContain(v);
    await page.goto("/petstore/item/EST-1");
    await page
      .getByRole("button", { name: /add to cart/i })
      .or(page.getByRole("link", { name: /add to cart/i }))
      .first()
      .click();
    await page.getByRole("link", { name: /cart/i }).first().click();
    await page
      .getByRole("link", { name: /check ?out/i })
      .first()
      .click();
    const placed = page.waitForResponse(
      (r) => r.url().endsWith("/api/orders") && r.request().method() === "POST",
    );
    // one "Place order" submit places the order; a confirm step is taken only if one appears
    // (as in C-0101)
    const submit = page
      .getByRole("button", { name: /^\s*(submit|continue|next|confirm|place order)/i })
      .first();
    const confirmsOrder = /^\s*(confirm|place order)/i.test(
      (await submit.getAttribute("value")) ?? (await submit.innerText()),
    );
    await submit.click();
    if (!confirmsOrder) {
      const confirm = page.getByRole("button", { name: /^\s*(confirm|place order)/i }).first();
      const done = page.getByRole("heading", { name: /your order is complete|order placed/i });
      await expect(done.or(confirm).first()).toBeVisible();
      if (!(await done.isVisible())) await confirm.click();
    }
    const response = await placed;
    expect(response.status()).toBe(200);
    const { orderId } = (await response.json()) as { orderId: string };
    // the order-confirmation screen names the placed order
    await expect(page.getByRole("heading", { name: /your order is complete/i })).toBeVisible();
    await expect(page.getByText(orderId).first()).toBeVisible();
  });
});

test.describe("My List panel and pet-tips banner", () => {
  // case: SWHR2-C-0157@v1
  test("SWHR2-C-0157: with MyList on and favourite BIRDS the panel lists BIRDS products linked to their pages", async ({
    page,
  }) => {
    await signedInWith(page, { favouriteCategory: "BIRDS", myListOn: true });
    // the BIRDS products, and the page each links to, as the store's own BIRDS listing shows them
    await page.goto("/petstore/category/BIRDS");
    const birds = new Map<string, string>();
    for (;;) {
      const listed = page.locator('a[href*="/petstore/product/"]:not([data-testid="my-list"] a)');
      await expect(listed.first()).toBeVisible();
      for (const [name, href] of await listed.evaluateAll((els) =>
        els.map((e) => [e.textContent?.trim() ?? "", e.getAttribute("href") ?? ""]),
      ))
        birds.set(name, href);
      const next = page
        .getByRole("link", { name: /next/i })
        .or(page.getByRole("button", { name: /next/i }));
      if ((await next.count()) === 0) break;
      const shown = await listed.first().getAttribute("href");
      await next.first().click();
      await expect(listed.first()).not.toHaveAttribute("href", shown ?? "");
    }
    await page.goto("/petstore/category/FISH");
    const links = page.getByTestId("my-list").getByRole("link");
    await expect(links.first()).toBeVisible();
    const entries = await links.evaluateAll((els) =>
      els.map((e) => [e.textContent?.trim() ?? "", e.getAttribute("href") ?? ""]),
    );
    for (const [name, href] of entries) {
      // only BIRDS products, each linked to the page the BIRDS listing gives that product
      expect([...birds.keys()]).toContain(name);
      expect(new URL(href, page.url()).pathname).toBe(
        new URL(birds.get(name) ?? "", page.url()).pathname,
      );
    }
    for (const [name, href] of entries) {
      // following the link opens that product's page
      await page.goto(href);
      await expect(page).toHaveURL(/\/petstore\/product\//);
      await expect(page.getByRole("heading", { name }).first()).toBeVisible();
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
