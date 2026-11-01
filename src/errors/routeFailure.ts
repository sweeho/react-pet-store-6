/** The error page for each failure kind that has one. A kind without an entry uses its parent's. */
const ERROR_PAGES: Record<string, string> = {
  EmptyCartOrder: "/petstore/error/empty-cart",
  CatalogError: "/petstore/error/catalog",
};

export const SERVER_ERROR_PAGE = "/petstore/error/server";

/** Walks the failure's kinds, most specific first, to the first one with an error page. */
export function routeFailure(reply: { kind: string; kinds: string[] }): string {
  for (const kind of reply.kinds) {
    const page = ERROR_PAGES[kind];
    if (page) return page;
  }
  return SERVER_ERROR_PAGE;
}
