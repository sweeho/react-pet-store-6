export const SERVER_ERROR = "server-error";

/** The error page for a failure: the first of its kinds (most specific first) the table maps. */
export function routeFailure(
  failure: { kind: string; kinds: string[] },
  table: Record<string, string> = { EmptyCartOrder: "/petstore/error/empty-cart" },
): string {
  for (const kind of failure.kinds) if (table[kind]) return table[kind];
  return SERVER_ERROR;
}
