// @vitest-environment node
import { describe, expect, it } from "vitest";

import { account, count, customers, failInsertsInto, profileOf } from "./harness";

describe("customer creation", () => {
  // case: SWHR2-C-0151@v1
  it("SWHR2-C-0151: a customer created without profile values gets the default profile", async () => {
    const { create, client } = await customers();
    await create("j2ee");
    const p = profileOf(client, "j2ee")!;
    expect(p.preferred_language).toBe("en_US");
    expect(p.favourite_category).toBeNull();
    expect(p.my_list_on).toBe(1);
    expect(p.banner_on).toBe(1);
  });

  // case: SWHR2-C-0152@v1
  it("SWHR2-C-0152: storing ja_JP and BIRDS updates only those values", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    await svc.updateCustomer("j2ee", {
      profile: { preferredLanguage: "ja_JP", favouriteCategory: "BIRDS" },
    });
    const p = profileOf(client, "j2ee")!;
    expect(p.preferred_language).toBe("ja_JP");
    expect(p.favourite_category).toBe("BIRDS");
    expect(p.my_list_on).toBe(1);
    expect(p.banner_on).toBe(1);
  });

  // case: SWHR2-C-0153@v1
  it("SWHR2-C-0153: a newly created account has status active", async () => {
    const { create, client } = await customers();
    await create("j2ee");
    expect(
      client.query("select status from customer_accounts where user_id = 'j2ee'").get(),
    ).toEqual({
      status: "active",
    });
  });

  // case: SWHR2-C-0154@v1
  it("SWHR2-C-0154: setting an active account to disabled is saved", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    await svc.updateCustomer("j2ee", { status: "disabled" });
    expect(
      client.query("select status from customer_accounts where user_id = 'j2ee'").get(),
    ).toEqual({
      status: "disabled",
    });
  });

  // case: SWHR2-C-0166@v1
  it("SWHR2-C-0166: creating a second customer with user id j2ee is refused, leaving one record", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    await expect(
      Promise.resolve().then(() => svc.createCustomer("j2ee", account())),
    ).rejects.toBeDefined();
    expect(count(client, "customers", "user_id = 'j2ee'")).toBe(1);
  });

  // case: SWHR2-C-0167@v1
  it("SWHR2-C-0167: if profile creation fails nothing for newuser is stored", async () => {
    const { svc, client } = await customers();
    await svc.registerUser("newuser", "secret1");
    failInsertsInto(client, "customer_profiles");
    await expect(
      Promise.resolve().then(() => svc.createCustomer("newuser", account())),
    ).rejects.toBeDefined();
    for (const t of ["customers", "customer_accounts", "customer_profiles"])
      expect(count(client, t, "user_id = 'newuser'")).toBe(0);
  });

  // case: SWHR2-C-0168@v1
  it("SWHR2-C-0168: if account creation fails nothing for newuser is stored", async () => {
    const { svc, client } = await customers();
    await svc.registerUser("newuser", "secret1");
    failInsertsInto(client, "customer_accounts");
    await expect(
      Promise.resolve().then(() => svc.createCustomer("newuser", account())),
    ).rejects.toBeDefined();
    for (const t of ["customers", "customer_accounts", "customer_profiles"])
      expect(count(client, t, "user_id = 'newuser'")).toBe(0);
  });

  // case: SWHR2-C-0169@v1
  it("SWHR2-C-0169: a new account for j2ee has a status, one contact record and one payment card record", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    const row = client
      .query("select status, contact_id, card_number from customer_accounts where user_id = 'j2ee'")
      .get() as { status: string; contact_id: number; card_number: string };
    expect(row.status).toBeTruthy();
    expect(row.card_number).toBeTruthy();
    expect(count(client, "contact_info", `id = ${row.contact_id}`)).toBe(1);
    expect(count(client, "customer_accounts", "user_id = 'j2ee'")).toBe(1);
    expect(JSON.stringify(await svc.getCustomer("j2ee"))).toContain("4111");
  });

  // case: SWHR2-C-0175@v1
  it("SWHR2-C-0175: looking up the customer by user id j2ee returns one customer with one account and one profile", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    const got = await svc.getCustomer("j2ee");
    expect(Array.isArray(got)).toBe(false);
    expect(got).toBeTruthy();
    expect(JSON.stringify(got)).toContain("j2ee");
    expect(count(client, "customer_accounts", "user_id = 'j2ee'")).toBe(1);
    expect(count(client, "customer_profiles", "user_id = 'j2ee'")).toBe(1);
  });

  // case: SWHR2-C-0176@v1
  it("SWHR2-C-0176: a profile with language en_US and no favourite category is stored with the favourite empty", async () => {
    const { svc, client } = await customers();
    await svc.registerUser("j2ee", "secret1");
    client.exec("insert into customers (user_id) values ('j2ee')");
    client.exec(
      "insert into customer_profiles (user_id, preferred_language) values ('j2ee', 'en_US')",
    );
    const p = profileOf(client, "j2ee")!;
    expect(p.preferred_language).toBe("en_US");
    expect(p.favourite_category).toBeNull();
  });

  // case: SWHR2-C-0177@v1
  it("SWHR2-C-0177: the MyList and banner preferences are never empty and a null one is refused", async () => {
    const { create, client } = await customers();
    await create("a1");
    await create("a2", { preferredLanguage: "ja_JP", myListOn: false, bannerOn: false });
    for (const p of client.query("select my_list_on, banner_on from customer_profiles").all() as {
      my_list_on: number | null;
      banner_on: number | null;
    }[]) {
      expect([0, 1]).toContain(p.my_list_on);
      expect([0, 1]).toContain(p.banner_on);
    }
    expect(() =>
      client.exec("update customer_profiles set my_list_on = null where user_id = 'a1'"),
    ).toThrow(/NOT NULL/i);
    expect(() =>
      client.exec("update customer_profiles set banner_on = null where user_id = 'a1'"),
    ).toThrow(/NOT NULL/i);
  });
});

describe("contact snapshot and address operations", () => {
  const contactId = (client: import("bun:sqlite").Database) =>
    (
      client.query("select contact_id c from customer_accounts where user_id = 'j2ee'").get() as {
        c: number;
      }
    ).c;
  const addressId = (client: import("bun:sqlite").Database) =>
    (client.query("select address_id a from contact_info").get() as { a: number }).a;
  const city = (client: import("bun:sqlite").Database) =>
    (client.query("select city from addresses").get() as { city: string }).city;

  // case: SWHR2-C-0170@v1
  it("SWHR2-C-0170: a snapshot of Jane Doe's contact record carries the name, telephone, e-mail and a copy of the address", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    const snap = (await svc.contactSnapshot(contactId(client))) as Record<string, unknown> & {
      address: Record<string, unknown>;
    };
    expect(snap).toMatchObject({
      givenName: "Jane",
      familyName: "Doe",
      telephone: "555-0100",
      email: "jane@example.com",
    });
    expect(snap.address).toMatchObject({
      street1: "1 Main St",
      city: "Palo Alto",
      state: "CA",
      zip: "94303",
      country: "USA",
    });
    const again = (await svc.contactSnapshot(contactId(client))) as Record<string, unknown> & {
      address: Record<string, unknown>;
    };
    expect(snap.address).not.toBe(again.address);
  });

  // case: SWHR2-C-0171@v1
  it("SWHR2-C-0171: changing the telephone in a snapshot does not change the stored contact record", async () => {
    const { create, svc, client } = await customers();
    await create("j2ee");
    const snap = (await svc.contactSnapshot(contactId(client))) as Record<string, unknown>;
    try {
      snap.telephone = "555-9999";
    } catch {
      /* a frozen snapshot refuses the write, which also leaves the record alone */
    }
    expect(client.query("select telephone from contact_info").get()).toEqual({
      telephone: "555-0100",
    });
  });

  // case: SWHR2-C-0172@v1
  it("SWHR2-C-0172: rolling back a failing change keeps the address's original city", async () => {
    const { create, db, client } = await customers();
    await create("j2ee");
    const addr = await import("../../../services/customers/address");
    expect(() =>
      db.transaction((tx) => {
        addr.updateAddressField(addressId(client), "city", "San Jose", tx);
        throw new Error("fail after update");
      }),
    ).toThrow("fail after update");
    expect(city(client)).toBe("Palo Alto");
  });

  // case: SWHR2-C-0173@v1
  it("SWHR2-C-0173: updating an address outside any transaction runs in its own transaction and is saved", async () => {
    const { create, client } = await customers();
    await create("j2ee");
    const addr = await import("../../../services/customers/address");
    await addr.updateAddressField(addressId(client), "city", "San Jose");
    expect(city(client)).toBe("San Jose");
  });
});
