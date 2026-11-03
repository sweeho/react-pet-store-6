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

/** Reads the sign-on accounts (signon_users rows) stored for a user name, in a bun child process. */
function signOnAccounts(userId: string): { password_hash: string }[] {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, userId] = JSON.parse(process.argv[1]);
    const db = new Database(file, { readonly: true });
    try {
      const rows = db.query("select password_hash from signon_users where user_id = ?").all(userId);
      process.stdout.write(JSON.stringify(rows));
    } finally { db.close(); }`;
  return JSON.parse(
    execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, userId])], { encoding: "utf8" }),
  ) as { password_hash: string }[];
}

type Profile = { favouriteCategory?: string; myListOn?: boolean; bannerOn?: boolean };

const repeatPassword = /^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i;
/**
 * The sign-in form of /petstore/signin: the form with a Sign In button and no repeated-password
 * field, so its fields are never confused with the registration form's User Name and Password.
 */
const signInForm = (page: Page) =>
  page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: /^(sign ?in|log ?in)/i }) })
    .filter({ hasNot: page.getByLabel(repeatPassword) });
async function signIn(page: Page, user = "j2ee", pw = "j2ee") {
  await page.goto("/petstore/signin");
  const f = signInForm(page);
  await expect(f).toHaveCount(1);
  await f.getByLabel(/^user (id|name):?$/i).fill(user);
  await f.getByLabel(/^password:?$/i).fill(pw);
  await f.getByRole("button", { name: /^(sign ?in|log ?in)/i }).click();
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
// The cart's own Check Out link, not a Checkout link in the header or navigation (as cart.spec.ts).
const cartCheckOut = (p: Page) =>
  p
    .locator("a:not(nav a):not(header a):not([role=navigation] a)")
    .filter({ hasText: /^\s*(proceed to )?check ?out\s*$/i });
/** Opens the cart through a link to /petstore/cart that is not an Add to Cart link. */
async function openCart(page: Page): Promise<void> {
  await page
    .locator('a[href$="/petstore/cart"]')
    .filter({ hasNotText: /add to cart/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/petstore\/cart$/);
}

test.describe("sign up", () => {
  // case: SWHR2-C-0156@v1
  test("SWHR2-C-0156: signing up as an existing j2ee is redirected to the user-creation error page", async ({
    page,
  }) => {
    // precondition: the j2ee sign-on account exists with password j2ee
    await signIn(page);
    await page.getByText(/^sign out$/i).click();
    const before = signOnAccounts("j2ee");
    expect(before).toHaveLength(1);
    await page.goto("/petstore/signin");
    await fillSignUp(page, "j2ee", "other1", "other1");
    await submitSignUp(page);
    await expect(page).toHaveURL(/user-creation-error/);
    await expect(
      page.getByText(/user name.*(in use|taken|exists)|already (exists|in use)/i).first(),
    ).toBeVisible();
    await expect(page.getByLabel(/^card type:?$/i)).toHaveCount(0);
    // nothing was created or changed: still exactly one j2ee account, its password unchanged
    const after = signOnAccounts("j2ee");
    expect(after).toHaveLength(1);
    expect(after[0].password_hash).toBe(before[0].password_hash);
    const refused = await page.request.post("/api/session/sign-in", {
      data: { userId: "j2ee", password: "other1", remember: false },
    });
    expect(refused.status()).toBe(401);
    const accepted = await page.request.post("/api/session/sign-in", {
      data: { userId: "j2ee", password: "j2ee", remember: false },
    });
    expect(accepted.status()).toBe(200);
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
    // precondition: the name newuser is not registered, even by an earlier run
    forgetUser("newuser");
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
    // and asks for a different user name
    await expect(
      page
        .getByText(
          /(different|another|other|new) (user ?name|user id|name|one)|(choose|pick|enter|try) (a |another )?(different|other|new)/i,
        )
        .first(),
    ).toBeVisible();
  });

  // case: SWHR2-C-0174@v1
  test("SWHR2-C-0174: a first-time visitor signs up, enters account information and can then buy", async ({
    page,
  }) => {
    // sign up, account entry, cart and checkout in one test: each step's page may be a cold Vite
    // compile, so the test gets 60s instead of the suite's 15s and each new screen 15s instead of 3s
    test.setTimeout(60_000);
    const slowExpect = expect.configure({ timeout: 15_000 });
    // precondition: no account exists for firsttimer, even one an earlier run signed up
    const user = "firsttimer";
    forgetUser(user);
    await page.goto("/petstore/signin");
    await fillSignUp(page, user, "secret1", "secret1");
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
    // the account form's own save button, not a button elsewhere on the page (a header Search)
    const save = page
      .locator("form")
      .filter({ has: page.getByLabel(/^card number:?$/i) })
      .getByRole("button", { name: /save|submit|create/i });
    await expect(save).toHaveCount(1);
    await save.click();
    expect((await saved).status()).toBeLessThan(300);
    // the account is created: it reads back for the signed-on new user with the entered details
    const account = await page.request.get("/api/account");
    expect(account.status()).toBe(200);
    const stored = JSON.stringify(await account.json());
    for (const v of [user, "First", "Timer", "1 Main St", "Palo Alto", "first@example.com"])
      expect(stored).toContain(v);
    await page.goto("/petstore/item/EST-1");
    await page
      .getByRole("button", { name: /add to cart/i })
      .or(page.getByRole("link", { name: /add to cart/i }))
      .first()
      .click();
    await openCart(page);
    await expect(cartCheckOut(page)).toHaveCount(1);
    await cartCheckOut(page).click();
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
      await slowExpect(done.or(confirm).first()).toBeVisible();
      if (!(await done.isVisible())) await confirm.click();
    }
    const response = await placed;
    expect(response.status()).toBe(200);
    const { orderId } = (await response.json()) as { orderId: string };
    // the order-confirmation screen names the placed order
    await slowExpect(page.getByRole("heading", { name: /your order is complete/i })).toBeVisible();
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
