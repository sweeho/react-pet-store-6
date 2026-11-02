// @vitest-environment node
import { Database } from "bun:sqlite";
import path from "node:path";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { describe, expect, it } from "vitest";

import { repairMissingTables } from "../../db/client";

const folder = path.join(process.cwd(), "drizzle");
const schema = (c: Database) =>
  new Map(
    (
      c
        .query(
          "select name, sql from sqlite_master where type in ('table','index') and sql is not null",
        )
        .all() as { name: string; sql: string }[]
    ).map((t) => [t.name, t.sql]),
  );

describe("db client table repair", () => {
  it("[SWHR2-C-0078] recreates a migrated table that was dropped and leaves every other table as it was", () => {
    const c = new Database(":memory:");
    migrate(drizzle(c), { migrationsFolder: folder });
    const full = schema(c);
    c.exec("insert into signon_users (user_id, password_hash) values ('x', 'h')");
    c.exec("drop table sup_inventory");
    c.exec("drop table messages");
    const before = schema(c);
    repairMissingTables(c, folder);
    const after = schema(c);
    expect(after.get("sup_inventory")).toBe(full.get("sup_inventory"));
    expect(after.get("messages")).toBe(full.get("messages"));
    for (const [name, sql] of before) expect(after.get(name), name).toBe(sql);
    expect([...after.keys()].sort()).toEqual([...full.keys()].sort());
    expect(c.query("select count(*) n from signon_users").get()).toEqual({ n: 1 });
  });

  it("[SWHR2-C-0077] inserts no rows on a fresh database", async () => {
    const { db } = await import("../../db/client");
    const c = db.$client as unknown as Database;
    const tables = c
      .query(
        "select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '%migrations%'",
      )
      .all() as { name: string }[];
    for (const t of tables)
      expect(c.query(`select count(*) n from "${t.name}"`).get(), t.name).toEqual({ n: 0 });
  });
});
