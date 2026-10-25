import type { Database } from "bun:sqlite";

import { loadApp } from "../sign-on/harness";

export { call, cookieValue } from "../shopping-cart/harness";
export { loadApp };

export const ADDRESS = {
  street1: "1 Main St",
  street2: "",
  city: "Palo Alto",
  state: "CA",
  zip: "94303",
  country: "USA",
};

/** Account information as the customer service takes it (contact, address and payment card). */
export function account(overrides: { telephone?: string; card?: Record<string, unknown> } = {}) {
  return {
    contact: {
      givenName: "Jane",
      familyName: "Doe",
      telephone: overrides.telephone ?? "555-0100",
      email: "jane@example.com",
      address: { ...ADDRESS },
    },
    card: {
      cardNumber: "4111111111111111",
      cardType: "Java(TM) Card",
      expiryMonth: 12,
      expiryYear: 2030,
      ...overrides.card,
    },
  };
}

export async function customers() {
  const app = await loadApp();
  const svc = await import("../../../services/customers");
  const create = async (userId: string, profile?: Record<string, unknown>, acct = account()) => {
    await svc.registerUser(userId, "secret1");
    return svc.createCustomer(userId, acct, profile);
  };
  return { ...app, svc, create };
}

export const count = (client: Database, table: string, where = "1=1") =>
  (client.query(`select count(*) n from ${table} where ${where}`).get() as { n: number }).n;

export const profileOf = (client: Database, userId: string) =>
  client.query("select * from customer_profiles where user_id = ?").get(userId) as
    | {
        preferred_language: string;
        favourite_category: string | null;
        my_list_on: number;
        banner_on: number;
      }
    | undefined;

/** Fails any insert into `table` for the given user id, via a SQLite trigger. */
export function failInsertsInto(client: Database, table: string) {
  client.exec(
    `create trigger fail_${table} before insert on ${table} begin select raise(abort, 'injected failure'); end`,
  );
}
