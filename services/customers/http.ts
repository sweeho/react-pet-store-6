import type { H3Event } from "nitro/h3";
import { HTTPError, readBody } from "nitro/h3";

import { CARD_TYPES, EXPIRY_MONTHS, EXPIRY_YEARS } from "../../shared/account";
import type { AccountInput, CustomerChanges, ProfileInput } from "./index";
import { getCustomer } from "./index";

const bad = (message: string): never => {
  throw new HTTPError({ status: 400, message, data: { kind: "InvalidAccount" } });
};

const CONTACT_FIELDS = ["givenName", "familyName", "telephone", "email"] as const;
const ADDRESS_FIELDS = ["street1", "street2", "city", "state", "zip", "country"] as const;

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});

export async function readJson(event: H3Event): Promise<Obj> {
  return obj(await readBody(event).catch(() => undefined));
}

function str(v: unknown, name: string, required: boolean): string | undefined {
  if (v === undefined) return required ? bad(`${name} required`) : undefined;
  if (typeof v !== "string" || (required && v.trim() === "")) return bad(`${name} invalid`);
  return v;
}

function validateCard(card: Obj, full: boolean) {
  const out: Obj = {};
  const number = str(card.cardNumber, "cardNumber", full);
  if (number !== undefined && number !== "") out.cardNumber = number;
  if (card.cardType !== undefined || full) {
    if (!CARD_TYPES.includes(card.cardType as never)) bad("cardType invalid");
    out.cardType = card.cardType;
  }
  if (card.expiryYear !== undefined || full) {
    if (!EXPIRY_YEARS.includes(card.expiryYear as never)) bad("expiryYear invalid");
    out.expiryYear = card.expiryYear;
  }
  if (card.expiryMonth !== undefined || full) {
    if (!EXPIRY_MONTHS.includes(card.expiryMonth as never)) bad("expiryMonth invalid");
    out.expiryMonth = card.expiryMonth;
  }
  if (full && out.cardNumber === undefined) bad("cardNumber required");
  return out;
}

function validateContact(contact: Obj, full: boolean) {
  const out: Obj = {};
  for (const f of CONTACT_FIELDS) {
    const v = str(contact[f], f, full);
    if (v !== undefined) out[f] = v;
  }
  const address = obj(contact.address);
  const a: Obj = {};
  for (const f of ADDRESS_FIELDS) {
    const v = str(address[f], f, full && f !== "street2");
    if (v !== undefined) a[f] = v;
    else if (full) a[f] = "";
  }
  if (full || Object.keys(a).length) out.address = a;
  return out;
}

function validateProfile(profile: Obj): ProfileInput {
  const out: ProfileInput = {};
  if (profile.preferredLanguage !== undefined)
    out.preferredLanguage = str(profile.preferredLanguage, "preferredLanguage", true);
  if (profile.favouriteCategory !== undefined)
    out.favouriteCategory =
      profile.favouriteCategory === null || profile.favouriteCategory === ""
        ? null
        : str(profile.favouriteCategory, "favouriteCategory", true);
  for (const f of ["myListOn", "bannerOn"] as const) {
    if (profile[f] === undefined) continue;
    if (typeof profile[f] !== "boolean") bad(`${f} invalid`);
    out[f] = profile[f] as boolean;
  }
  return out;
}

/** Body of POST /api/account: the whole account, plus optional profile choices. */
export function readNewAccount(body: Obj): { account: AccountInput; profile: ProfileInput } {
  return {
    account: {
      contact: validateContact(obj(body.contact), true),
      card: validateCard(obj(body.card), true),
    } as unknown as AccountInput,
    profile: validateProfile(obj(body.profile)),
  };
}

/** Body of PUT /api/account: any of profile, contact, card and status. */
export function readChanges(body: Obj): CustomerChanges {
  const changes: CustomerChanges = {};
  if (body.profile !== undefined) changes.profile = validateProfile(obj(body.profile));
  if (body.contact !== undefined)
    changes.contact = validateContact(obj(body.contact), false) as CustomerChanges["contact"];
  if (body.card !== undefined)
    changes.card = validateCard(obj(body.card), false) as CustomerChanges["card"];
  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "disabled") bad("status invalid");
    changes.status = body.status as "active" | "disabled";
  }
  return changes;
}

/** The customer as the SPA sees it: the card number is reduced to its last four digits. */
export async function customerView(userId: string) {
  const c = await getCustomer(userId);
  if (!c) return undefined;
  const { cardNumber, ...card } = c.account.card;
  return {
    status: c.account.status,
    contact: c.account.contact,
    card: { ...card, last4: cardNumber.slice(-4) },
    profile: c.profile,
  };
}

export function mapCustomerError(e: unknown): never {
  const kind = (e as { kind?: string }).kind;
  if (kind === "CustomerExists")
    throw new HTTPError({ status: 409, message: "Customer exists", data: { kind } });
  if (kind === "NoCustomer")
    throw new HTTPError({ status: 404, message: "No customer", data: { kind } });
  throw e;
}
