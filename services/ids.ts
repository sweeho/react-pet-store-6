import { eq } from "drizzle-orm";

import { db } from "../db/client";
import { idSequences } from "../db/schema";

type Db = typeof db;
/** The database or a transaction on it: an id request joins its caller's transaction. */
export type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * The next id of the sequence named by `prefix`: the prefix followed by its counter, so the
 * "1001" sequence issues "10011", "10012", ... (SWHR2-R-0006, SWHR2-R-0008). Creates the sequence on
 * first use. Throws, and issues nothing, for a missing or empty prefix (SWHR2-R-0007) or when the
 * sequence cannot be created or the store cannot be reached (SWHR2-R-0051).
 */
export function nextId(prefix: string, tx?: Executor): string {
  if (typeof prefix !== "string" || prefix === "")
    throw new Error("An identifier prefix is required.");
  const issue = (t: Executor): string => {
    const row = t.select().from(idSequences).where(eq(idSequences.prefix, prefix)).get();
    if (!row) {
      t.insert(idSequences).values({ prefix, nextValue: 2 }).run();
      return `${prefix}1`;
    }
    t.update(idSequences)
      .set({ nextValue: row.nextValue + 1 })
      .where(eq(idSequences.prefix, prefix))
      .run();
    return `${prefix}${row.nextValue}`;
  };
  return tx ? issue(tx) : db.transaction((t) => issue(t));
}
