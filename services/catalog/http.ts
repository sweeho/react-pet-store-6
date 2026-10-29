import { getQuery } from "h3";
import type { H3Event } from "h3";
import { HTTPError } from "nitro/h3";

import { CatalogError } from "./errors";

/** Optional integer query value; absent or non-numeric gives undefined (service default). */
export function intParam(event: H3Event, name: string): number | undefined {
  const raw = getQuery(event)[name];
  const n = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
  return Number.isInteger(n) ? n : undefined;
}

export function pathParam(event: H3Event, name: string): string {
  return (event.context.params as Record<string, string> | undefined)?.[name] ?? "";
}

/** Runs a catalog read, reporting a CatalogError as a 500 catalog failure. */
export async function catalogResponse<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (e) {
    if (e instanceof CatalogError) throw new HTTPError({ status: 500, message: "Catalog failure" });
    throw e;
  }
}

export function notFound(what: string): never {
  throw new HTTPError({ status: 404, message: `${what} not found` });
}
