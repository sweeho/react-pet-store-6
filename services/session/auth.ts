import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { signonUsers } from "../../db/schema";

/** Parses `userId:passwordHash` entries separated by `;` (argon2 hashes contain `,` and `$`). */
function configured(raw: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  for (const entry of (raw ?? "").split(";")) {
    const at = entry.indexOf(":");
    if (at > 0) out.set(entry.slice(0, at).trim(), entry.slice(at + 1).trim());
  }
  return out;
}

async function matches(hash: string | undefined, password: string): Promise<boolean> {
  if (!hash) return false;
  try {
    return await Bun.password.verify(password, hash);
  } catch {
    return false;
  }
}

/** Checks a storefront customer against the hashed password in signon_users. */
export async function verifyCustomer(userId: string, password: string): Promise<boolean> {
  const row = db.select().from(signonUsers).where(eq(signonUsers.userId, userId)).get();
  return matches(row?.passwordHash, password);
}

/** Checks an administrator against the operator-supplied ADMIN_USERS. */
export function verifyAdmin(userId: string, password: string): Promise<boolean> {
  return matches(configured(process.env.ADMIN_USERS).get(userId), password);
}

/** Checks a supplier against the operator-supplied SUPPLIER_USERS. */
export function verifySupplier(userId: string, password: string): Promise<boolean> {
  return matches(configured(process.env.SUPPLIER_USERS).get(userId), password);
}
