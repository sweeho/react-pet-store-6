import { readFileSync } from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "../db/client";
import {
  addresses,
  catalogCategories,
  catalogCategoryDetails,
  catalogItemDetails,
  catalogItems,
  catalogProductDetails,
  catalogProducts,
  contactInfo,
  customerAccounts,
  customerProfiles,
  customers,
  signonUsers,
  supInventory,
} from "../db/schema";
import { SEED_LOCALES, type SeedData, type SeedInventoryEntry } from "../db/seed/types";
import { createContact } from "../services/customers/contact";
import type { Executor } from "../services/ids";

const SEED_FILE = "db/seed/petstore.json";

function readSeedFile(): SeedData {
  // cwd-relative like db/client.ts: the host resolves sqlite.db and db/seed/ from its working directory.
  return JSON.parse(readFileSync(path.join(process.cwd(), SEED_FILE), "utf8")) as SeedData;
}

/** Rejects a seed data set the loader cannot load whole; nothing has been written yet. */
function validate(data: SeedData): void {
  const bad = (what: string): never => {
    throw new Error(`invalid seed data: ${what}`);
  };
  for (const key of ["users", "customers", "categories", "products", "items", "inventory"] as const)
    if (!Array.isArray(data?.[key])) bad(`"${key}" must be an array`);
  const known = (list: { id: string }[], id: string) => list.some((e) => e.id === id);
  for (const e of [...data.categories, ...data.products]) {
    if (!e.id) bad("an entry has no id");
    for (const l of SEED_LOCALES) if (!e.details?.[l]?.name) bad(`${e.id} has no ${l} name`);
  }
  for (const p of data.products)
    if (!known(data.categories, p.categoryId)) bad(`product ${p.id} has unknown category`);
  for (const i of data.items) {
    if (!i.id) bad("an item has no id");
    if (!known(data.products, i.productId)) bad(`item ${i.id} has unknown product`);
    for (const l of SEED_LOCALES) {
      const d = i.details?.[l];
      if (!d || !Number.isInteger(d.listPrice) || !Number.isInteger(d.unitCost))
        bad(`item ${i.id} has no valid ${l} details`);
      if (d.attributes.length > 5) bad(`item ${i.id} has more than 5 attributes`);
    }
  }
  const userIds = new Set(data.users.map((u) => u.userId));
  for (const c of data.customers)
    if (!userIds.has(c.userId)) bad(`customer ${c.userId} has no user`);
  for (const e of data.inventory)
    if (
      !e.itemId ||
      (e.quantity !== undefined && !(Number.isInteger(e.quantity) && e.quantity >= 0))
    )
      bad(`inventory entry ${e.itemId} is invalid`);
}

/** Upserts supplier stock by item id; an entry without a quantity is seeded with 0. */
export function seedInventory(exec: Executor, entries: SeedInventoryEntry[]): void {
  for (const e of entries) {
    const quantity = e.quantity ?? 0;
    exec
      .insert(supInventory)
      .values({ itemId: e.itemId, quantity })
      .onConflictDoUpdate({ target: supInventory.itemId, set: { quantity } })
      .run();
  }
}

/** Removes the user, its customer and the customer's contact and address, if present. */
function removeSample(tx: Executor, userId: string): void {
  const account = tx
    .select()
    .from(customerAccounts)
    .where(eq(customerAccounts.userId, userId))
    .get();
  tx.delete(customerProfiles).where(eq(customerProfiles.userId, userId)).run();
  tx.delete(customerAccounts).where(eq(customerAccounts.userId, userId)).run();
  tx.delete(customers).where(eq(customers.userId, userId)).run();
  if (account) {
    const contact = tx
      .select()
      .from(contactInfo)
      .where(eq(contactInfo.id, account.contactId))
      .get();
    tx.delete(contactInfo).where(eq(contactInfo.id, account.contactId)).run();
    if (contact) tx.delete(addresses).where(eq(addresses.id, contact.addressId)).run();
  }
  tx.delete(signonUsers).where(eq(signonUsers.userId, userId)).run();
}

/**
 * Loads the seed data set in one transaction: the sample users and customers are deleted and
 * recreated by id (other accounts are untouched), the catalog and the supplier stock are upserted.
 * A failure writes nothing.
 */
export async function loadSeed(data: SeedData = readSeedFile()): Promise<void> {
  validate(data);
  // Hashing is async and bun-sqlite transactions are synchronous, so hash first.
  const hashes = new Map(
    await Promise.all(
      data.users.map(async (u) => [u.userId, await Bun.password.hash(u.password)] as const),
    ),
  );
  db.transaction((tx) => {
    const sampleIds = [
      ...new Set([...data.users.map((u) => u.userId), ...data.customers.map((c) => c.userId)]),
    ];
    for (const id of sampleIds) removeSample(tx, id);
    for (const u of data.users)
      tx.insert(signonUsers)
        .values({ userId: u.userId, passwordHash: hashes.get(u.userId)! })
        .run();
    for (const c of data.customers) {
      const { contact, card } = c.account;
      const address = tx.insert(addresses).values(contact.address).returning().get();
      const contactId = createContact(tx, {
        givenName: contact.givenName,
        familyName: contact.familyName,
        telephone: contact.telephone,
        email: contact.email,
        addressId: address.id,
      });
      tx.insert(customers).values({ userId: c.userId }).run();
      tx.insert(customerAccounts)
        .values({
          userId: c.userId,
          status: "active",
          contactId,
          cardNumber: card.cardNumber,
          cardType: card.cardType,
          cardExpiryMonth: card.expiryMonth,
          cardExpiryYear: card.expiryYear,
        })
        .run();
      tx.insert(customerProfiles)
        .values({ userId: c.userId, ...c.profile })
        .run();
    }

    for (const cat of data.categories) {
      tx.insert(catalogCategories).values({ categoryId: cat.id }).onConflictDoNothing().run();
      for (const l of SEED_LOCALES) {
        const d = cat.details[l];
        tx.insert(catalogCategoryDetails)
          .values({ categoryId: cat.id, locale: l, ...d })
          .onConflictDoUpdate({
            target: [catalogCategoryDetails.categoryId, catalogCategoryDetails.locale],
            set: d,
          })
          .run();
      }
    }
    for (const p of data.products) {
      tx.insert(catalogProducts)
        .values({ productId: p.id, categoryId: p.categoryId })
        .onConflictDoUpdate({
          target: catalogProducts.productId,
          set: { categoryId: p.categoryId },
        })
        .run();
      for (const l of SEED_LOCALES) {
        const d = p.details[l];
        tx.insert(catalogProductDetails)
          .values({ productId: p.id, locale: l, ...d })
          .onConflictDoUpdate({
            target: [catalogProductDetails.productId, catalogProductDetails.locale],
            set: d,
          })
          .run();
      }
    }
    for (const i of data.items) {
      tx.insert(catalogItems)
        .values({ itemId: i.id, productId: i.productId })
        .onConflictDoUpdate({ target: catalogItems.itemId, set: { productId: i.productId } })
        .run();
      for (const l of SEED_LOCALES) {
        const { attributes, ...d } = i.details[l];
        const row = {
          ...d,
          attr1: attributes[0] ?? null,
          attr2: attributes[1] ?? null,
          attr3: attributes[2] ?? null,
          attr4: attributes[3] ?? null,
          attr5: attributes[4] ?? null,
        };
        tx.insert(catalogItemDetails)
          .values({ itemId: i.id, locale: l, ...row })
          .onConflictDoUpdate({
            target: [catalogItemDetails.itemId, catalogItemDetails.locale],
            set: row,
          })
          .run();
      }
    }
    seedInventory(tx, data.inventory);
  });
}

// `bun run db:seed`: the installation step. Importing this module has no side effect.
if (import.meta.main) {
  loadSeed().then(
    () => process.exit(0),
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    },
  );
}
