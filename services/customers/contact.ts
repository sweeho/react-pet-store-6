import { contactInfo } from "../../db/schema";
import type { Executor } from "../ids";

export interface ContactRecord {
  givenName: string;
  familyName: string;
  telephone: string;
  email: string;
  addressId: number;
}

/** Writes one contact record that refers to the stored address `addressId` rather than copying it. Returns the contact id. */
export function createContact(exec: Executor, c: ContactRecord): number {
  return exec
    .insert(contactInfo)
    .values({
      givenName: c.givenName,
      familyName: c.familyName,
      telephone: c.telephone,
      email: c.email,
      addressId: c.addressId,
    })
    .returning({ id: contactInfo.id })
    .get().id;
}
