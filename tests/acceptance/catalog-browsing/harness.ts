import type { Database } from "bun:sqlite";
import { vi } from "vitest";

export type Locale = string;
type ByLocale = Record<Locale, string>;

export interface ItemSpec {
  id: string;
  product: string;
  details: Record<Locale, { descn: string; list: number; unit: number }>;
}

/** Loads a fresh in-memory db and a fresh catalog service (and so a fresh page cache). */
export async function loadCatalog() {
  vi.resetModules();
  const { db } = await import("../../../db/client");
  const catalog = await import("../../../services/catalog");
  return { db, client: db.$client as unknown as Database, catalog };
}

/** Raw SQL seeding, using the table and column names from the catalog target design. */
export function seeder(client: Database) {
  const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
  return {
    category(id: string, names: ByLocale) {
      client.exec(`insert into catalog_categories (category_id) values (${q(id)})`);
      for (const [loc, name] of Object.entries(names)) {
        client.exec(
          `insert into catalog_category_details (category_id, locale, name, description, image) values (${q(id)}, ${q(loc)}, ${q(name)}, ${q(name)}, 'c.gif')`,
        );
      }
    },
    product(id: string, category: string, names: ByLocale) {
      client.exec(
        `insert into catalog_products (product_id, category_id) values (${q(id)}, ${q(category)})`,
      );
      for (const [loc, name] of Object.entries(names)) {
        client.exec(
          `insert into catalog_product_details (product_id, locale, name, description, image) values (${q(id)}, ${q(loc)}, ${q(name)}, ${q(`${name} description`)}, 'p.gif')`,
        );
      }
    },
    item(spec: ItemSpec) {
      client.exec(
        `insert into catalog_items (item_id, product_id) values (${q(spec.id)}, ${q(spec.product)})`,
      );
      for (const [loc, d] of Object.entries(spec.details)) {
        client.exec(
          `insert into catalog_item_details (item_id, locale, description, image, list_price, unit_cost) values (${q(spec.id)}, ${q(loc)}, ${q(d.descn)}, 'i.gif', ${d.list}, ${d.unit})`,
        );
      }
    },
  };
}

/** A list result may be a bare array or the `{ items, ... }` envelope. */
export function rows(result: unknown): Record<string, unknown>[] {
  const r = result as { items?: Record<string, unknown>[] } | Record<string, unknown>[];
  return Array.isArray(r) ? r : (r.items ?? []);
}

export const idOf = (r: Record<string, unknown>) =>
  String(r.itemId ?? r.productId ?? r.categoryId ?? r.id);
export const nameOf = (r: Record<string, unknown>) => String(r.name ?? r.productName);

/** Records every SQL statement prepared against the catalog tables and the parameters bound to it. */
export function recordQueries(client: Database) {
  const calls: { sql: string; params: unknown[] }[] = [];
  const realPrepare = client.prepare.bind(client);
  // @ts-expect-error spy replaces the overloaded prepare
  client.prepare = (sql: string, ...rest: unknown[]) => {
    const stmt = (realPrepare as (...a: unknown[]) => Record<string, unknown>)(sql, ...rest);
    for (const m of ["all", "get", "values", "run"]) {
      const orig = stmt[m] as (...a: unknown[]) => unknown;
      stmt[m] = (...args: unknown[]) => {
        calls.push({ sql, params: args.flat(Infinity) });
        return orig.apply(stmt, args);
      };
    }
    return stmt;
  };
  return calls;
}

export const catalogCalls = (calls: { sql: string }[]) =>
  calls.filter((c) => /catalog_/.test(c.sql));

/** Distinct `%keyword%` values bound to the search query, and how often each is bound. */
export function boundKeywords(calls: { sql: string; params: unknown[] }[]) {
  const counts = new Map<string, number>();
  for (const c of catalogCalls(calls)) {
    for (const p of c.params) {
      const m = typeof p === "string" ? /^%(.+)%$/.exec(p) : null;
      if (m) counts.set(m[1].toLowerCase(), (counts.get(m[1].toLowerCase()) ?? 0) + 1);
    }
  }
  return counts;
}
