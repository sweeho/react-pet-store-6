import { eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { idSequences } from "../db/schema";

/** `db` or a transaction on it: an id issued through a transaction joins the caller's unit of work. */
export type Unit = Pick<typeof db, "select" | "insert" | "update">;

/** Prefix plus the next value of that prefix's counter; the counter is created at 0 on first use. */
export function nextId(prefix: string, unit?: Unit): string {
  if (typeof prefix !== "string" || prefix === "")
    throw new Error("An identifier prefix is required.");
  const issue = (x: Unit) => {
    const known = x.select().from(idSequences).where(eq(idSequences.prefix, prefix)).get();
    if (!known) x.insert(idSequences).values({ prefix, nextValue: 0 }).run();
    const row = x
      .update(idSequences)
      .set({ nextValue: sql`${idSequences.nextValue} + 1` })
      .where(eq(idSequences.prefix, prefix))
      .returning()
      .get();
    return `${prefix}${row.nextValue}`;
  };
  return unit ? issue(unit) : db.transaction((tx) => issue(tx));
}
