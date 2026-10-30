import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import {
  addresses,
  contactInfo,
  customerAccounts,
  customerProfiles,
  customers,
  signonUsers,
} from "../../db/schema";
import { inTransaction, readAddress, updateAddressField, type AddressField } from "./address";

export type CustomerError = Error & { kind: "UserExists" | "CustomerExists" | "NoCustomer" };

export interface AddressInput {
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
export interface ContactInput {
  givenName: string;
  familyName: string;
  telephone: string;
  email: string;
  address: AddressInput;
}
export interface CardInput {
  cardNumber: string;
  cardType: string;
  expiryMonth: number;
  expiryYear: number;
}
export interface AccountInput {
  contact: ContactInput;
  card: CardInput;
}
export interface ProfileInput {
  preferredLanguage?: string;
  favouriteCategory?: string | null;
  myListOn?: boolean;
  bannerOn?: boolean;
}
export type AccountStatus = "active" | "disabled";

const ADDRESS_FIELDS: AddressField[] = ["street1", "street2", "city", "state", "zip", "country"];

/** Creates the sign-on user; rejects with kind `UserExists` when the id is taken. */
export async function registerUser(userId: string, password: string): Promise<void> {
  const passwordHash = await Bun.password.hash(password);
  if (db.select().from(signonUsers).where(eq(signonUsers.userId, userId)).get())
    throw Object.assign(new Error(`user id ${userId} is in use`), { kind: "UserExists" });
  db.insert(signonUsers).values({ userId, passwordHash }).run();
}

/** Creates customer, address, contact, account and profile in one transaction, or none of them. */
export function createCustomer(userId: string, account: AccountInput, profile: ProfileInput = {}) {
  return Promise.resolve().then(() =>
    db.transaction((tx) => {
      if (tx.select().from(customers).where(eq(customers.userId, userId)).get())
        throw Object.assign(new Error(`customer ${userId} exists`), { kind: "CustomerExists" });
      const { contact, card } = account;
      const address = tx.insert(addresses).values(contact.address).returning().get();
      const { address: _address, ...contactFields } = contact; // eslint-disable-line @typescript-eslint/no-unused-vars
      const savedContact = tx
        .insert(contactInfo)
        .values({ ...contactFields, addressId: address.id })
        .returning()
        .get();
      tx.insert(customers).values({ userId }).run();
      tx.insert(customerAccounts)
        .values({
          userId,
          status: "active",
          contactId: savedContact.id,
          cardNumber: card.cardNumber,
          cardType: card.cardType,
          cardExpiryMonth: card.expiryMonth,
          cardExpiryYear: card.expiryYear,
        })
        .run();
      tx.insert(customerProfiles)
        .values({
          userId,
          preferredLanguage: profile.preferredLanguage ?? "en_US",
          favouriteCategory: profile.favouriteCategory ?? null,
          myListOn: profile.myListOn ?? true,
          bannerOn: profile.bannerOn ?? true,
        })
        .run();
    }),
  );
}

/** The customer with its one account and one profile, or undefined. */
export async function getCustomer(userId: string) {
  const row = db
    .select()
    .from(customers)
    .innerJoin(customerAccounts, eq(customerAccounts.userId, customers.userId))
    .innerJoin(customerProfiles, eq(customerProfiles.userId, customers.userId))
    .where(eq(customers.userId, userId))
    .get();
  if (!row) return undefined;
  const { customer_accounts: acct, customer_profiles: profile } = row;
  const contact = await contactSnapshot(acct.contactId);
  return {
    userId,
    account: {
      status: acct.status as AccountStatus,
      contactId: acct.contactId,
      contact,
      card: {
        cardNumber: acct.cardNumber,
        cardType: acct.cardType,
        expiryMonth: acct.cardExpiryMonth,
        expiryYear: acct.cardExpiryYear,
      },
    },
    profile: {
      preferredLanguage: profile.preferredLanguage,
      favouriteCategory: profile.favouriteCategory,
      myListOn: profile.myListOn,
      bannerOn: profile.bannerOn,
    },
  };
}

export interface CustomerChanges {
  profile?: ProfileInput;
  status?: AccountStatus;
  contact?: Partial<Omit<ContactInput, "address">> & { address?: Partial<AddressInput> };
  card?: Partial<CardInput>;
}

/** Partial update of one customer, applied in one transaction. */
export function updateCustomer(userId: string, changes: CustomerChanges) {
  return Promise.resolve().then(() =>
    db.transaction((tx) => {
      const acct = tx
        .select()
        .from(customerAccounts)
        .where(eq(customerAccounts.userId, userId))
        .get();
      if (!acct) throw Object.assign(new Error(`no customer ${userId}`), { kind: "NoCustomer" });
      const { profile, status, contact, card } = changes;
      if (profile) {
        const set = {
          ...(profile.preferredLanguage !== undefined && {
            preferredLanguage: profile.preferredLanguage,
          }),
          ...(profile.favouriteCategory !== undefined && {
            favouriteCategory: profile.favouriteCategory,
          }),
          ...(profile.myListOn !== undefined && { myListOn: profile.myListOn }),
          ...(profile.bannerOn !== undefined && { bannerOn: profile.bannerOn }),
        };
        if (Object.keys(set).length)
          tx.update(customerProfiles).set(set).where(eq(customerProfiles.userId, userId)).run();
      }
      const accountSet = {
        ...(status !== undefined && { status }),
        ...(card?.cardNumber !== undefined && { cardNumber: card.cardNumber }),
        ...(card?.cardType !== undefined && { cardType: card.cardType }),
        ...(card?.expiryMonth !== undefined && { cardExpiryMonth: card.expiryMonth }),
        ...(card?.expiryYear !== undefined && { cardExpiryYear: card.expiryYear }),
      };
      if (Object.keys(accountSet).length)
        tx.update(customerAccounts)
          .set(accountSet)
          .where(eq(customerAccounts.userId, userId))
          .run();
      if (contact) {
        const { address, ...fields } = contact;
        if (Object.keys(fields).length)
          tx.update(contactInfo).set(fields).where(eq(contactInfo.id, acct.contactId)).run();
        const row = tx.select().from(contactInfo).where(eq(contactInfo.id, acct.contactId)).get();
        if (address && row)
          for (const f of ADDRESS_FIELDS)
            if (address[f] !== undefined) updateAddressField(row.addressId, f, address[f], tx);
      }
    }),
  );
}

/** A frozen copy of a contact record with a copy of its address; writing to it changes nothing stored. */
export function contactSnapshot(contactId: number) {
  return Promise.resolve().then(() =>
    inTransaction((x) => {
      const c = x.select().from(contactInfo).where(eq(contactInfo.id, contactId)).get();
      if (!c) throw new Error(`no contact ${contactId}`);
      const a = readAddress(c.addressId, x);
      if (!a) throw new Error(`no address ${c.addressId}`);
      const { id: _id, ...address } = a; // eslint-disable-line @typescript-eslint/no-unused-vars
      return Object.freeze({
        givenName: c.givenName,
        familyName: c.familyName,
        telephone: c.telephone,
        email: c.email,
        address: Object.freeze(address),
      });
    }),
  );
}

export function listCustomers() {
  return db.select().from(customers).all();
}
