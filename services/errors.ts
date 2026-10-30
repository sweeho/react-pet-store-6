/** A typed failure with the chain of kinds it belongs to, most specific first. */
export class AppFailure extends Error {
  readonly kind: string = "AppFailure";
  readonly parents: string[] = [];
  readonly status: number = 500;

  get kinds(): string[] {
    return [this.kind, ...this.parents];
  }
}

export class OrderFailure extends AppFailure {
  readonly kind: string = "OrderFailure";
  readonly parents: string[] = ["AppFailure"];
}

export class EmptyCartOrder extends OrderFailure {
  readonly kind: string = "EmptyCartOrder";
  readonly parents: string[] = ["OrderFailure", "AppFailure"];
  readonly status: number = 422;
}

/** The response body routes send for a failure; non-typed errors count as a plain AppFailure. */
export function failureBody(err: unknown): {
  kind: string;
  kinds: string[];
  message: string;
  trace: string;
} {
  const kinds = err instanceof AppFailure ? err.kinds : ["AppFailure"];
  const e = err instanceof Error ? err : new Error(String(err));
  return { kind: kinds[0], kinds, message: e.message, trace: e.stack ?? "" };
}
