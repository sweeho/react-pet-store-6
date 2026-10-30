export const SERVER_ERROR = "server-error";

/** Failure kind to error page. */
export const ERROR_PAGES: Record<string, string> = {
  EmptyCartOrder: "/petstore/error/empty-cart",
};

/** Walks the failure's kinds, specific first, and returns the first configured page. */
export function routeFailure(
  failure: { kind: string; kinds: string[] },
  table: Record<string, string> = ERROR_PAGES,
): string {
  for (const kind of failure.kinds.length > 0 ? failure.kinds : [failure.kind]) {
    const page = table[kind];
    if (page) return page;
  }
  return SERVER_ERROR;
}
