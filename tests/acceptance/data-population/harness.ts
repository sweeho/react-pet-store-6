/* eslint-disable @typescript-eslint/no-explicit-any --
   The seed data file has no published type yet; it is handled as plain JSON. */
import { readFileSync } from "node:fs";
import path from "node:path";

import { loadApp } from "../sign-on/harness";

export { loadApp };

export const seedData = (): Record<string, any> =>
  JSON.parse(readFileSync(path.join(process.cwd(), "db/seed/petstore.json"), "utf8"));

/** A fresh in-memory database (migrations applied) plus the seed loader exported by scripts/seed.ts. */
export async function seeded() {
  const app = await loadApp();
  const seed = (await import(/* @vite-ignore */ "../../../scripts/seed")) as Record<string, any>;
  return { ...app, seed };
}

export const count = (client: import("bun:sqlite").Database, table: string, where = "1=1") =>
  (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;

/** Deep copy of `value` where strings equal to `from` become `to` and every `name` property becomes `name`. */
export function rename(value: any, from: string, to: string, name: string): any {
  if (Array.isArray(value)) return value.map((v) => rename(v, from, to, name));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, k === "name" ? name : rename(v, from, to, name)]),
    );
  return value === from ? to : value;
}
