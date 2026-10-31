import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// The dev server's database file (db/client.ts resolves it from the project root).
const DB_FILE = path.join(process.cwd(), "sqlite.db");

// Playwright runs this file under Node, where bun:sqlite does not exist, so each statement runs
// in a bun child process against the same file. Returns the first row of a query, or null.
function sql(statement: string, ...params: string[]): Record<string, unknown> | null {
  const script = `
    const { Database } = require("bun:sqlite");
    const [file, statement, params] = JSON.parse(process.argv[1]);
    const db = new Database(file);
    try { console.log(JSON.stringify(db.query(statement).get(...params) ?? null)); }
    finally { db.close(); }`;
  const out = execFileSync("bun", ["-e", script, JSON.stringify([DB_FILE, statement, params])], {
    encoding: "utf8",
  });
  return JSON.parse(out.trim() || "null") as Record<string, unknown> | null;
}

async function toCheckout(page: Page) {
  await page.goto("/petstore/signin");
  await page.getByLabel(/^user id:?$/i).fill("j2ee");
  await page.getByLabel(/^password:?$/i).fill("j2ee");
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
    // the account stores the United States as USA; the form may label that option "United States"
    await expect(field(page, /country/i)).toHaveValue(/^(USA|United States)$/);
    await expect(field(page, /phone|telephone/i)).toHaveValue("555-555-5555");
    await expect(field(page, /e-?mail/i)).toHaveValue("abc@xyz.com");
  });

  // case: SWHR2-C-0216@v1
  test("SWHR2-C-0216: submitting the pre-filled form unchanged places the order with the pre-filled details", async ({
    page,
  }) => {
    await toCheckout(page);
    const placed = page.waitForResponse(
      (r) => r.url().endsWith("/api/orders") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: /continue|submit|place|next/i })
      .first()
      .click();
    const confirm = page.getByRole("button", { name: /confirm|place order|submit/i });
    if (await confirm.count()) await confirm.first().click();
    const response = await placed;
    expect(response.status()).toBe(200);
    const { orderId } = (await response.json()) as { orderId: string };
    await expect(page.getByText(orderId).first()).toBeVisible();

    // the stored order: billing details on the header, shipping details on its contact record
    const row = (table: string) => sql(`select * from ${table} where order_id = ?`, orderId);
    await expect.poll(() => row("op_purchase_orders"), { timeout: 10_000 }).toBeTruthy();
    const prefilled = ["ABC", "XYZ", "1 Main St", "Palo Alto", "CA", "94303"];
    expect(Object.values(row("op_purchase_orders")!)).toEqual(expect.arrayContaining(prefilled));
    expect(Object.values(row("op_po_contacts") ?? {})).toEqual(
      expect.arrayContaining([...prefilled, "abc@xyz.com", "555-555-5555"]),
    );
    expect(Object.values(row("op_po_contacts") ?? {})).toEqual(
      expect.arrayContaining([expect.stringMatching(/^(USA|United States)$/)]),
    );
  });
});

test.describe("server error page", () => {
  // case: SWHR2-C-0212@v1
  // The failure is real: a trigger on the message store makes the server's placement of this
  // test's order (and only this one, marked by its first name) throw "boom-test".
  test("SWHR2-C-0212: the Server Error page shows the message and trace and asks the shopper to notify the administrator", async ({
    page,
  }) => {
    await toCheckout(page);
    try {
      sql(`create trigger if not exists acc_c0212_boom before insert on messages
        when new.payload like '%BoomC0212%'
        begin select raise(abort, 'boom-test'); end`);
      const firstNames = page.getByLabel(/^(first name|given name):?$/i);
      for (let i = 0; i < (await firstNames.count()); i++)
        await firstNames.nth(i).fill("BoomC0212");
      const placed = page.waitForResponse(
        (r) => r.url().endsWith("/api/orders") && r.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: /continue|submit|place|next/i })
        .first()
        .click();
      const confirm = page.getByRole("button", { name: /confirm|place order|submit/i });
      if (await confirm.count()) await confirm.first().click();
      expect((await placed).status()).toBe(500);
      await expect(page.getByRole("heading", { name: /server error/i })).toBeVisible();
      await expect(page.getByText(/boom-test/).first()).toBeVisible();
      // the technical trace: stack frames as "at <location>"
      await expect(page.getByText(/\bat \S+/).first()).toBeVisible();
      await expect(page.getByText(/notify (the )?administrator/i).first()).toBeVisible();
    } finally {
      sql("drop trigger if exists acc_c0212_boom");
    }
  });
});
