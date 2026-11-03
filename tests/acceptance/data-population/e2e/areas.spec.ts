import { execFileSync } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

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

test.describe("installed application areas", () => {
  // case: SWHR2-C-0079@v1
  test("SWHR2-C-0079: /petstore answers with the storefront and the supplier, admin and order-processing areas are available", async ({
    page,
  }) => {
    const store = await page.goto("/petstore");
    expect(store?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();
    // Signed out, each area answers with its own sign-in page. The SPA serves its
    // Not Found page for unknown URLs with a 2xx status, so the status alone does not
    // show the area is installed: its sign-in form must render and Not Found must not.
    for (const area of ["/supplier", "/admin"]) {
      const res = await page.goto(area);
      expect(res?.status(), area).toBeLessThan(400);
      await expect(page.getByText(/not found|404/i), area).toHaveCount(0);
      await expect(page.getByLabel(/^user ?id:?$/i), area).toBeVisible();
      await expect(page.getByLabel(/^password:?$/i), area).toBeVisible();
    }
    // order processing is the in-process worker: it accepts an order from a signed-in shopper
    // /petstore/signin also carries the registration form, which has its own "Password"
    // field; scope the lookups to the sign-in form (the one without a repeat-password field).
    await page.goto("/petstore/signin");
    const signIn = page
      .locator("form")
      .filter({ has: page.getByLabel(/^password:?$/i) })
      .filter({
        hasNot: page.getByLabel(/^(repeat(ed)?|confirm|re-?enter|verify)( your)? password:?$/i),
      });
    await signIn.getByLabel(/^user ?id:?$/i).fill("j2ee");
    await signIn.getByLabel(/^password:?$/i).fill("j2ee");
    await signIn.getByRole("button", { name: /sign ?in|log ?in|submit/i }).click();
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
    const { orderId } = (await placed.json()) as { orderId: string };
    expect(orderId).toBeTruthy();
    // The order-processing area receives and processes it: it stores the purchase order
    // (op_purchase_orders) and starts its workflow record (op_order_workflow) in a lifecycle
    // status (design.md: PENDING on receipt, then APPROVED/DENIED/SHIPPED_PART/COMPLETED).
    const one = (table: string) =>
      sql(`select * from ${table} where order_id = ?`, String(orderId))[0];
    await expect.poll(() => one("op_purchase_orders"), { timeout: 10_000 }).toBeTruthy();
    await expect
      .poll(() => one("op_order_workflow")?.status, { timeout: 10_000 })
      .toMatch(/^(PENDING|APPROVED|DENIED|SHIPPED_PART|COMPLETED)$/);
  });
});
