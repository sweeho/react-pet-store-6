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

// Creates, on every table of the store, a trigger aborting with "boom-test" any insert of a row
// with a cell mentioning EST-4 (not EST-40 and the like).
function boomTriggers(): void {
  const tables = sql(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'",
  ).map((t) => String(t.name));
  tables.forEach((table, i) => {
    const quote = (id: string) => `"${id.replace(/"/g, '""')}"`;
    const cells = sql(`select name from pragma_table_info(?)`, table).map(
      (c) => `((' ' || coalesce(new.${quote(String(c.name))}, '') || ' ') glob '*EST-4[^0-9]*')`,
    );
    const name = `acc_c0212_boom_${i}`;
    sql(`create trigger if not exists ${name} before insert on ${quote(table)}
      when ${cells.join(" or ")}
      begin select raise(abort, 'boom-test'); end`);
  });
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
// The name and address are on both the billing and the shipping copy; telephone and e-mail need
// only be on one of them (the shipping block may carry no phone or e-mail field).
const PREFILL: [RegExp, string, number][] = [
  [label("first name|given name"), "ABC", 2],
  [label("last name|family name"), "XYZ", 2],
  [label("address( line)?( 1)?|street( address)?"), "1 Main St", 2],
  [label("city"), "Palo Alto", 2],
  [label("state|state/province|province"), "CA", 2],
  [label("zip|zip code|postal code"), "94303", 2],
  [label("phone|telephone|telephone number|phone number"), "555-555-5555", 1],
  [label("e-?mail|e-?mail address"), "abc@xyz.com", 1],
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
    // The form carries a billing and a shipping copy of the name and address fields, so those
    // labels are on at least two fields; telephone and e-mail on at least one. Every field found
    // holds the account value. Fields need not be on screen together: a shipping block behind a
    // "ship to a different address" step still has to be there and carry the pre-filled values.
    for (const [name, value, copies] of PREFILL) {
      const fields = page.getByLabel(name);
      await expect(fields.nth(copies - 1), `${name}: ${copies} field(s)`).toBeAttached();
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

    // No screen shows a stored order's billing and shipping details, so they are read from the
    // store without assuming its layout: the order's records are the rows this submit added, in
    // any table, holding a cell equal to a pre-filled value. Billing and shipping both carry the
    // name and address, so each of those values is stored at least twice; telephone and e-mail
    // at least once (shipping may carry neither). Order processing may store the order after the
    // confirmation is shown, so the store is polled.
    const PREFILLED = PREFILL.map(([, value, copies]) => [value, copies] as const);
    const values = PREFILLED.map(([value]) => value);
    const short = () => {
      const held = rowsAddedWith(before, values).flatMap((r) => Object.values(r));
      return PREFILLED.filter(
        ([value, copies]) => held.filter((v) => v === value).length < copies,
      ).map(([value]) => value);
    };
    await expect
      .poll(short, {
        timeout: 10_000,
        message: "pre-filled values missing from the stored order's billing and shipping details",
      })
      .toEqual([]);
  });
});

test.describe("server error page", () => {
  // case: SWHR2-C-0212@v1
  // The failure is real and on the server, without assuming how orders are stored: placing an
  // order of EST-4 has to write that item id somewhere, so a trigger on every table makes any
  // insert of a row mentioning EST-4 throw "boom-test". The cart already holds the item before the
  // triggers exist, and EST-4 is an item no other browser spec orders, so specs placing orders in
  // parallel are unaffected.
  test("SWHR2-C-0212: the Server Error page shows the message and trace and asks the shopper to notify the administrator", async ({
    page,
  }) => {
    await toCheckout(page, "EST-4");
    try {
      boomTriggers();
      await submitCheckout(page);
      await expect(page.getByRole("heading", { name: /server error/i }).first()).toBeVisible();
      await expect(page.getByText(/boom-test/).first()).toBeVisible();
      // the technical trace: at least one stack frame (function, file:line:column)
      await expect(page.getByText(/\bat .+:\d+:\d+/).first()).toBeVisible();
      await expect(page.getByText(/notify (the )?administrator/i).first()).toBeVisible();
    } finally {
      const left = sql(
        "select name from sqlite_master where type = 'trigger' and name like 'acc_c0212_boom_%'",
      );
      for (const { name } of left) sql(`drop trigger if exists "${String(name)}"`);
    }
  });
});
