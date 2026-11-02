import { eq, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { supInventory } from "../../db/schema";
import type { Executor } from "../ids";
import { enqueue } from "../messaging";

export interface StockRow {
  itemId: string;
  quantity: number;
}

export const INVENTORY_CHANGED_CHANNEL = "supplier.inventory-changed";

const natural = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

/** Every stock record, in natural item order (EST-2 before EST-10). */
export function listInventory(exec: Executor = db): StockRow[] {
  return exec
    .select()
    .from(supInventory)
    .all()
    .sort((a, b) => natural(a.itemId, b.itemId));
}

/**
 * Overwrites (or creates) each record and enqueues one `supplier.inventory-changed` message, in
 * one transaction. A change list that is empty writes and enqueues nothing.
 */
export function updateInventory(changes: StockRow[], exec?: Executor): void {
  if (changes.length === 0) return;
  const run = (tx: Executor) => {
    for (const { itemId, quantity } of changes)
      tx.insert(supInventory)
        .values({ itemId, quantity })
        .onConflictDoUpdate({ target: supInventory.itemId, set: { quantity } })
        .run();
    enqueue(
      tx,
      INVENTORY_CHANGED_CHANNEL,
      JSON.stringify({ itemIds: changes.map((c) => c.itemId) }),
    );
  };
  if (exec) run(exec);
  else db.transaction(run);
}

/** Subtracts `quantity` when the record holds at least that much; otherwise changes nothing. */
export function reduceStock(exec: Executor, itemId: string, quantity: number): boolean {
  const row = exec.select().from(supInventory).where(eq(supInventory.itemId, itemId)).get();
  if (!row || row.quantity < quantity) return false;
  exec
    .update(supInventory)
    .set({ quantity: sql`${supInventory.quantity} - ${quantity}` })
    .where(eq(supInventory.itemId, itemId))
    .run();
  return true;
}
