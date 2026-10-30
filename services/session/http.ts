import type { H3Event } from "nitro/h3";
import { HTTPError, readBody } from "nitro/h3";

export interface Credentials {
  userId: string;
  password: string;
  remember: boolean;
}

export async function readCredentials(event: H3Event): Promise<Credentials> {
  const body = await readBody<Record<string, unknown>>(event).catch(() => undefined);
  if (typeof body?.userId !== "string" || typeof body.password !== "string")
    throw new HTTPError({ status: 400, message: "userId and password required" });
  return { userId: body.userId, password: body.password, remember: body.remember === true };
}

export function rejected(): never {
  throw new HTTPError({
    status: 401,
    message: "Could not be authenticated",
    data: { kind: "InvalidCredentials" },
  });
}
