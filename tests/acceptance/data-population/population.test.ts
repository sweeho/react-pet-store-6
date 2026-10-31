// @vitest-environment node
import { describe, expect, it } from "vitest";

import { customers } from "../customer-account/harness";
import { count, rename, seedData, seeded } from "./harness";

const TABLE_GROUPS = [
  "customers",
  "catalog_products",
  "sup_orders",
  "op_purchase_orders",
  "messages",
];

describe("customer listing", () => {
  // case: SWHR2-C-0068@v1
  it("SWHR2-C-0068: listing all customers returns both j2ee and shopper", async () => {
    const { create, svc } = await customers();
    await create("j2ee");
    await create("shopper");
    const got = (await svc.listCustomers()) as Record<string, unknown>[];
    expect(got).toHaveLength(2);
    expect(got.map((c) => String(c.userId ?? c.user_id)).sort()).toEqual(["j2ee", "shopper"]);
  });

  // case: SWHR2-C-0069@v1
  it("SWHR2-C-0069: listing all customers with none on file returns an empty list", async () => {
    const { svc } = await customers();
    expect(await svc.listCustomers()).toEqual([]);
  });

  // case: SWHR2-C-0072@v1
  it("SWHR2-C-0072: a contact record stores the four values as supplied and refers to the existing address", async () => {
    const { db, client } = await customers();
    const contacts = (await import(/* @vite-ignore */ "../../../services/customers/contact")) as {
      createContact: (...a: unknown[]) => unknown;
    };
    client.exec(
      "insert into addresses (id, street1, city, state, zip, country) values (1, '1 Main St', 'Palo Alto', 'CA', '94303', 'USA')",
    );
    await contacts.createContact(db, {
      givenName: "ABC",
      familyName: "XYZ",
      telephone: "555-555-5555",
      email: "abc@xyz.com",
      addressId: 1,
    });
    expect(
      client
        .query("select given_name, family_name, telephone, email, address_id from contact_info")
        .all(),
    ).toEqual([
      {
        given_name: "ABC",
        family_name: "XYZ",
        telephone: "555-555-5555",
        email: "abc@xyz.com",
        address_id: 1,
      },
    ]);
    expect(count(client, "addresses")).toBe(1);
  });
});

describe("seed loading", () => {
  // case: SWHR2-C-0070@v1
  it("SWHR2-C-0070: loading seed data into an empty datastore creates the tables and fills catalog, customer and inventory data", async () => {
    const { seed, client } = await seeded();
    const data = seedData();
    await seed.loadSeed();
    const tables = (
      client.query("select name from sqlite_master where type = 'table'").all() as {
        name: string;
      }[]
    ).map((t) => t.name);
    for (const t of ["catalog_products", "customers", "sup_inventory"]) expect(tables).toContain(t);
    expect(count(client, "catalog_products")).toBe(data.products.length);
    expect(count(client, "customers")).toBe(data.customers.length);
    expect(count(client, "sup_inventory")).toBe(data.inventory.length);
  });

  // case: SWHR2-C-0071@v1
  it("SWHR2-C-0071: a product added to the seed data set is present in the catalog after loading", async () => {
    const { seed, client } = await seeded();
    const data = seedData();
    const first = data.products[0];
    const id = String(first.id ?? first.productId);
    data.products.push(rename(first, id, "TEST-P1", "Test Product"));
    await seed.loadSeed(data);
    expect(count(client, "catalog_products", "product_id = 'TEST-P1'")).toBe(1);
    const names = client
      .query("select name from catalog_product_details where product_id = 'TEST-P1'")
      .all() as { name: string }[];
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n.name === "Test Product")).toBe(true);
  });

  // case: SWHR2-C-0073@v1
  it("SWHR2-C-0073: supplier seeding creates EST-1 to EST-29, each with quantity 10000", async () => {
    const { seed, client } = await seeded();
    await seed.loadSeed();
    const rows = client.query("select item_id, quantity from sup_inventory").all() as {
      item_id: string;
      quantity: number;
    }[];
    expect(rows).toHaveLength(29);
    expect(rows.map((r) => r.item_id).sort()).toEqual(
      Array.from({ length: 29 }, (_, i) => `EST-${i + 1}`).sort(),
    );
    expect(rows.every((r) => r.quantity === 10000)).toBe(true);
  });

  // case: SWHR2-C-0074@v1
  it("SWHR2-C-0074: a seed inventory entry with no quantity is seeded with quantity 0", async () => {
    const { seed, db, client } = await seeded();
    await seed.seedInventory(db, [{ itemId: "EST-99" }]);
    expect(
      client.query("select quantity from sup_inventory where item_id = 'EST-99'").get(),
    ).toEqual({ quantity: 0 });
  });

  // case: SWHR2-C-0075@v1
  it("SWHR2-C-0075: the sample load creates 4 users and customers, 5 categories, 16 products and 28 items in en, ja and zh", async () => {
    const { seed, client } = await seeded();
    await seed.loadSeed();
    expect(count(client, "signon_users")).toBe(4);
    expect(count(client, "customers")).toBe(4);
    expect(count(client, "customers", "user_id in (select user_id from signon_users)")).toBe(4);
    expect(count(client, "catalog_categories")).toBe(5);
    expect(count(client, "catalog_products")).toBe(16);
    expect(count(client, "catalog_items")).toBe(28);
    for (const locale of ["en_US", "ja_JP", "zh_CN"]) {
      expect(count(client, "catalog_item_details", `locale = '${locale}'`)).toBe(28);
    }
    expect(count(client, "catalog_item_details")).toBe(84);
  });

  // case: SWHR2-C-0076@v1
  it("SWHR2-C-0076: reloading sample data restores edited j2ee and leaves registered customer alice unchanged", async () => {
    const { seed, svc, client } = await seeded().then(async (s) => ({
      ...s,
      svc: await import("../../../services/customers"),
    }));
    await seed.loadSeed();
    const emailOf = (id: string) =>
      (
        client
          .query(
            "select c.email e from customer_accounts a join contact_info c on c.id = a.contact_id where a.user_id = ?",
          )
          .get(id) as { e: string }
      ).e;
    const original = emailOf("j2ee");
    client.exec(
      "update contact_info set email = 'edited@example.com' where id = (select contact_id from customer_accounts where user_id = 'j2ee')",
    );
    await svc.registerUser("alice", "secret1");
    await svc.createCustomer("alice", {
      contact: {
        givenName: "Alice",
        familyName: "A",
        telephone: "555",
        email: "alice@example.com",
        address: { street1: "1 St", street2: "", city: "C", state: "S", zip: "1", country: "USA" },
      },
      card: {
        cardNumber: "4111111111111111",
        cardType: "Java(TM) Card",
        expiryMonth: 12,
        expiryYear: 2030,
      },
    });
    await seed.loadSeed();
    expect(emailOf("j2ee")).toBe(original);
    expect(emailOf("alice")).toBe("alice@example.com");
    expect(count(client, "signon_users", "user_id = 'alice'")).toBe(1);
  });
});

describe("installation", () => {
  // case: SWHR2-C-0077@v1
  it("SWHR2-C-0077: a fresh installation creates the storefront, supplier and order-processing structures with no business data", async () => {
    const { client } = await seeded();
    const tables = (
      client
        .query(
          "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '%migrations%'",
        )
        .all() as { name: string }[]
    ).map((t) => t.name);
    for (const t of TABLE_GROUPS) expect(tables).toContain(t);
    for (const t of tables) expect(count(client, t)).toBe(0);
  });

  // case: SWHR2-C-0078@v1
  it("SWHR2-C-0078: installing onto a database that lacks the supplier and order-processing datastores creates only those", async () => {
    const { Database } = await import("bun:sqlite");
    const { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } = await import(
      "node:fs"
    );
    const { tmpdir } = await import("node:os");
    const path = await import("node:path");
    const repo = process.cwd();
    // The application resolves sqlite.db, drizzle/ and db/seed/ from its working directory,
    // so a scratch directory is the host. Outside Vitest db/client.ts uses the file database.
    const host = mkdtempSync(path.join(tmpdir(), "install-"));
    cpSync(path.join(repo, "drizzle"), path.join(host, "drizzle"), { recursive: true });
    symlinkSync(path.join(repo, "db"), path.join(host, "db"));
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([k]) => !k.startsWith("VITEST") && k !== "NODE_ENV"),
    );
    const run = (cmd: string[]) => {
      const r = Bun.spawnSync(cmd, { cwd: host, env, stdout: "pipe", stderr: "pipe" });
      expect(r.exitCode, `${cmd.join(" ")}\n${r.stderr.toString()}`).toBe(0);
    };

    // An earlier release: only the migrations that precede the first supplier or
    // order-processing migration in the project's drizzle/ journal have shipped.
    const journalPath = path.join(host, "drizzle", "meta", "_journal.json");
    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
      entries: { tag: string }[];
    };
    const createsLater = (tag: string) =>
      /create table [`"]?(sup_|op_|messages)/i.test(
        readFileSync(path.join(host, "drizzle", `${tag}.sql`), "utf8"),
      );
    const split = journal.entries.findIndex((e) => createsLater(e.tag));
    expect(
      split,
      "no drizzle migration creates the supplier/order-processing tables",
    ).toBeGreaterThan(0);
    writeFileSync(
      journalPath,
      JSON.stringify({ ...journal, entries: journal.entries.slice(0, split) }),
    );
    // that release's installation step: opening the database runs its migrations
    run(["bun", "-e", `await import(${JSON.stringify(path.join(repo, "db/client.ts"))})`]);
    const file = path.join(host, "sqlite.db");
    const names = (client: InstanceType<typeof Database>) =>
      (
        client.query("select name from sqlite_master where type = 'table'").all() as {
          name: string;
        }[]
      ).map((t) => t.name);
    const before = new Database(file);
    const storefront = names(before);
    expect(storefront).toContain("customers");
    expect(storefront).toContain("catalog_products");
    for (const t of ["sup_orders", "op_purchase_orders", "messages"])
      expect(storefront).not.toContain(t);
    before.exec("insert into customers (user_id) values ('keepme')");
    before.close();

    // installing the current release: the full journal, then `bun run db:seed`
    writeFileSync(journalPath, JSON.stringify(journal));
    run(["bun", path.join(repo, "scripts/seed.ts")]);

    const after = new Database(file);
    const tables = names(after);
    for (const t of ["sup_orders", "op_purchase_orders", "messages"]) expect(tables).toContain(t);
    for (const t of storefront) expect(tables).toContain(t);
    expect(count(after, "customers", "user_id = 'keepme'")).toBe(1);
    after.close();
  });
});
