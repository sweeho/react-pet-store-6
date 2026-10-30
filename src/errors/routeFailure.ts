export interface Failure {
  /** The failure's own kind. */
  kind: string;
  /** The failure's kind followed by every more general kind it belongs to, most specific first. */
  kinds: string[];
}

export const SERVER_ERROR_PAGE = "server-error";

/** The error page for the most specific kind of `failure` that has one, or the general server error page. */
export function routeFailure(failure: Failure, pages: Record<string, string>): string {
  for (const kind of failure.kinds) if (kind in pages) return pages[kind];
  return SERVER_ERROR_PAGE;
}
