import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// The dev server's database file (db/client.ts resolves it from the project root).
const DB_FILE = path.join(process.cwd(), "sqlite.db");

// Playwright runs this file under Node, where bun:sqlite does not exist, so each statement runs
// in a bun child process against the same file. Returns every row of a query.
function sql(statement: string, ...params: string[]): Record<string, unknown>[] {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, statement, params] = JSON.parse(process.argv[1]);
    const db = new Database(file);
    try { console.log(JSON.stringify(db.query(statement).all(...params))); }
    finally { db.close(); }`;
  const out = execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, statement, params])], {
    encoding: "utf8",
  });
  return JSON.parse(out.trim() || "[]") as Record<string, unknown>[];
}

// Every table of the store with its highest rowid, so the rows a later step adds can be told apart.
const TABLES = `
  const tables = db.query("select name from sqlite_master where type = 'table' and name not like 'sqlite_%'").all();
  const top = (t) => db.query(\`select coalesce(max(rowid), 0) as n from "\${t}"\`).get().n;`;

function tableTops(): Record<string, number> {
  return bunDb(`${TABLES}
    return Object.fromEntries(tables.map(({ name }) => [name, top(name)]));`) as Record<
    string,
    number
  >;
}

// The rows added since `before`, in any table, holding a cell exactly equal to one of `values`.
function rowsAddedWith(
  before: Record<string, number>,
  values: string[],
): Record<string, unknown>[] {
  return bunDb(
    `${TABLES}
    const [before, values] = args;
    return tables.flatMap(({ name }) =>
      db.query(\`select * from "\${name}" where rowid > ?\`).all(before[name] ?? 0)
        .filter((row) => Object.values(row).some((v) => v !== null && values.includes(String(v)))));`,
    before,
    values,
  ) as Record<string, unknown>[];
}

// Runs `body` (which sees `db` and `args`) in a bun child process against the store file.
function bunDb(body: string, ...args: unknown[]): unknown {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, args] = JSON.parse(process.argv[1]);
    const db = new Database(file, { readonly: true });
    try { console.log(JSON.stringify((() => { ${body} })())); }
    finally { db.close(); }`;
  const out = execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, args])], {
    encoding: "utf8",
  });
  return JSON.parse(out.trim());
}

async function toCheckout(page: Page, itemId = "EST-1") {
  await page.goto("/petstore/signin");
  // /petstore/signin also carries the registration form, with its own "Password" field;
  // the sign-in form is the one without a repeat-password field.
  const signIn = page
    .locator("form")
    .filter({ has: page.getByLabel(/^password:?$/i) })
    .filter({
      hasNot: page.getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i),
    });
  await signIn.getByLabel(/^user id:?$/i).fill("j2ee");
  await signIn.getByLabel(/^password:?$/i).fill("j2ee");
  // navigating before the sign-in request completes aborts it, losing its session cookie and
  // leaving the visitor anonymous at checkout, so wait for the sign-in response itself
  await Promise.all([
    page.waitForResponse(
      (r) =>
        new URL(r.url()).pathname === "/api/session/sign-in" && r.request().method() === "POST",
    ),
    signIn.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click(),
  ]);
  await expect(page.getByText(/^sign out$/i).first()).toBeVisible();
  await page.goto(`/petstore/item/${itemId}`);
  // every Add to Cart control on the item page adds this item, so any one of them will do
  await page
    .getByRole("button", { name: /add to cart/i })
    .or(page.getByRole("link", { name: /add to cart/i }))
    .first()
    .click();
  // the add lands on the cart (shopping cart); reopen it by its address rather than a "cart" link,
  // which could equally be an Add to Cart control
  await expect(page).toHaveURL(/\/petstore\/cart(\?|$)/);
  await page.goto("/petstore/cart");
  // the cart's own Check Out control, not a Checkout entry in the header or site navigation
  await page
    .locator(":is(a, button):not(header *):not(nav *):not([role=navigation] *)")
    .filter({ hasText: /^\s*(proceed to )?check ?out\s*$/i })
    .first()
    .click();
}

// The account values the checkout form is pre-filled with (C-0215: name, address, telephone and
// e-mail), per field label. Labels are anchored, allowing only a "billing"/"shipping" prefix, so a
// credit-card or other field whose label merely contains "state" or "city" is not picked up.
const label = (name: string) =>
  new RegExp(`^\\s*((billing|shipping)\\s+)?(${name})\\s*:?\\s*\\*?\\s*$`, "i");
const PREFILL: [RegExp, string][] = [
  [label("first name|given name"), "ABC"],
  [label("last name|family name"), "XYZ"],
  [label("address( line)?( 1)?|street( address)?"), "1 Main St"],
  [label("city"), "Palo Alto"],
  [label("state|state/province|province"), "CA"],
  [label("zip|zip code|postal code"), "94303"],
  [label("phone|telephone|telephone number|phone number"), "555-555-5555"],
  [label("e-?mail|e-?mail address"), "abc@xyz.com"],
];

// Outside the header and site navigation.
const inPage = ":not(header *):not(nav *):not([role=navigation] *)";
const complete = (page: Page) =>
  page.getByRole("heading", { name: /your order is complete|order placed/i }).first();
const serverError = (page: Page) => page.getByRole("heading", { name: /server error/i }).first();

// Submits the checkout form as shown by clicking its visible submit control, then takes an
// optional confirm step, until the order-complete or Server Error screen appears.
async function submitCheckout(page: Page) {
  const control = (name: RegExp) =>
    page
      .getByRole("button", { name })
      .and(page.locator(`*${inPage}:visible`))
      .first();
  const CONFIRM = /^\s*(confirm|place order)/i;
  const submit = control(/^\s*(submit|continue|next|confirm|place order)/i);
  // a submit control that already confirms the order is not followed by a confirm step
  const confirms = CONFIRM.test((await submit.getAttribute("value")) ?? (await submit.innerText()));
  await submit.click();
  const confirm = control(CONFIRM);
  const next = await Promise.race([
    complete(page)
      .waitFor()
      .then(() => "done"),
    serverError(page)
      .waitFor()
      .then(() => "done"),
    ...(confirms ? [] : [confirm.waitFor().then(() => "confirm")]),
  ]);
  if (next === "confirm") await confirm.click();
}

test.describe("checkout form", () => {
  // case: SWHR2-C-0215@v1
  test("SWHR2-C-0215: the billing and shipping form is pre-filled from the signed-in customer's account", async ({
    page,
  }) => {
    await toCheckout(page);
    // The form carries both a billing and a shipping copy of each field, so every label is on at
    // least two fields, and every one of them holds the account value. Fields need not be on
    // screen together: a shipping block behind a "ship to a different address" step still has to
    // be there and carry the pre-filled values.
    for (const [name, value] of PREFILL) {
      const fields = page.getByLabel(name);
      await expect(fields.nth(1), `${name}: a billing and a shipping field`).toBeAttached();
      for (const field of await fields.all()) await expect(field, `${name}`).toHaveValue(value);
    }
  });

  // case: SWHR2-C-0216@v1
  test("SWHR2-C-0216: submitting the pre-filled form unchanged places the order with the pre-filled details", async ({
    page,
  }) => {
    await toCheckout(page);
    const before = tableTops();
    await submitCheckout(page);

    // The order went ahead: the shopper sees the order-complete screen.
    await expect(complete(page)).toBeVisible();
    const screen = await page.locator("main").or(page.locator("body")).first().innerText();
    // the order id is among the tokens of four or more characters the screen shows
    const shown = [...new Set(screen.match(/\b[\w-]*\d[\w-]*\b/g) ?? [])].filter(
      (t) => t.length >= 4,
    );

    // No screen shows a stored order's billing and shipping details, so they are read from the
    // store without assuming its layout: the order's records are the rows added by this submit,
    // in any table, holding a value equal to the order id the order-complete screen shows. Each
    // shown token is judged on its own, so rows of another order placed meanwhile never mix in.
    // Billing and shipping both equal the pre-filled values, so each value is stored at least twice.
    const PREFILLED = [
      "ABC",
      "XYZ",
      "1 Main St",
      "Palo Alto",
      "CA",
      "94303",
      "555-555-5555",
      "abc@xyz.com",
    ];
    const short = (token: string) => {
      const held = rowsAddedWith(before, [token]).flatMap((r) => Object.values(r));
      return PREFILLED.filter((value) => held.filter((v) => v === value).length < 2);
    };
    await expect
      .poll(() => shown.map((token) => `${token}: ${short(token).join(", ") || "complete"}`), {
        timeout: 10_000,
        message:
          "an order shown on screen whose stored billing and shipping hold every pre-filled value",
      })
      .toContainEqual(expect.stringMatching(/: complete$/));
  });
});

test.describe("server error page", () => {
  // case: SWHR2-C-0212@v1
  // The failure is real and on the server: placement enqueues the order document on the
  // order.new channel in the messages table (design.md), and a trigger there makes that insert
  // throw "boom-test" for an order of EST-4 only, an item no other browser spec orders, so
  // specs placing orders in parallel are unaffected.
  test("SWHR2-C-0212: the Server Error page shows the message and trace and asks the shopper to notify the administrator", async ({
    page,
  }) => {
    await toCheckout(page, "EST-4");
    sql(`create trigger if not exists acc_c0212_boom before insert on messages
      when new.channel = 'order.new' and new.payload glob '*EST-4[^0-9]*'
      begin select raise(abort, 'boom-test'); end`);
    try {
      await submitCheckout(page);
      await expect(page.getByRole("heading", { name: /server error/i }).first()).toBeVisible();
      await expect(page.getByText(/boom-test/).first()).toBeVisible();
      // the technical trace: at least one stack frame (function, file:line:column)
      await expect(page.getByText(/\bat .+:\d+:\d+/).first()).toBeVisible();
      await expect(page.getByText(/notify (the )?administrator/i).first()).toBeVisible();
    } finally {
      sql("drop trigger if exists acc_c0212_boom");
    }
  });
});
