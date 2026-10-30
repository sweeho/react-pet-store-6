import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { addresses } from "../../db/schema";

/** A Drizzle transaction handle, as passed to a `db.transaction` callback. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Pick<Tx, "select" | "update" | "delete">;

export type AddressRow = typeof addresses.$inferSelect;
export type AddressField = keyof Omit<AddressRow, "id">;

/**
 * Runs `work` inside the caller's transaction when one is given, else in its own. `work` must be
 * synchronous: bun-sqlite transactions do not wait for promises (design P2). `db.transaction` is
 * read at call time so a spy on it sees the call.
 */
export function inTransaction<T>(work: (x: Executor) => T, tx?: Executor): T {
  return tx ? work(tx) : db.transaction((own) => work(own));
}

export function readAddress(addressId: number, tx?: Executor): AddressRow | undefined {
  return inTransaction(
    (x) => x.select().from(addresses).where(eq(addresses.id, addressId)).get(),
    tx,
  );
}

export function updateAddressField(
  addressId: number,
  field: AddressField,
  value: string,
  tx?: Executor,
): void {
  inTransaction((x) => {
    x.update(addresses)
      .set({ [field]: value })
      .where(eq(addresses.id, addressId))
      .run();
  }, tx);
}

export function removeAddress(addressId: number, tx?: Executor): void {
  inTransaction((x) => {
    x.delete(addresses).where(eq(addresses.id, addressId)).run();
  }, tx);
}
