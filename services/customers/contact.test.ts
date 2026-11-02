import { describe, expect, it } from "vitest";

import { loadApp } from "./testHarness";

describe("createContact", () => {
  it("[SWHR2-C-0072] stores the four values as supplied and refers to the existing address", async () => {
    const { db, client } = await loadApp();
    const { createContact } = await import("./contact");
    client.exec(
      "insert into addresses (id, street1, city, state, zip, country) values (7, '1 Main St', 'Palo Alto', 'CA', '94303', 'USA')",
    );
    const id = createContact(db, {
      givenName: "ABC",
      familyName: "XYZ",
      telephone: "555-555-5555",
      email: "abc@xyz.com",
      addressId: 7,
    });
    expect(
      client
        .query("select id, given_name, family_name, telephone, email, address_id from contact_info")
        .all(),
    ).toEqual([
      {
        id,
        given_name: "ABC",
        family_name: "XYZ",
        telephone: "555-555-5555",
        email: "abc@xyz.com",
        address_id: 7,
      },
    ]);
    expect(client.query("select count(*) n from addresses").get()).toEqual({ n: 1 });
  });
});
