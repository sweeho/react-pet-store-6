import { HTTPError } from "nitro/h3";

/** Root of every failure a route reports to the shopper. Subclasses name their parent kind. */
export class AppFailure extends Error {
  get kind(): string {
    return this.kinds[0] ?? "AppFailure";
  }
  readonly status: number = 500;
  /** This kind first, then each parent kind up to `AppFailure`. */
  get kinds(): string[] {
    const out: string[] = [];
    for (
      let proto: object | null = Object.getPrototypeOf(this);
      proto && proto !== Error.prototype;
      proto = Object.getPrototypeOf(proto)
    ) {
      const name = (proto.constructor as { kindName?: string }).kindName;
      if (name) out.push(name);
    }
    return out;
  }
  static readonly kindName: string = "AppFailure";
}

export class CatalogFailure extends AppFailure {
  static override readonly kindName: string = "CatalogError";
  override readonly status: number = 502;
}

export class ItemNotFound extends CatalogFailure {
  static override readonly kindName: string = "ItemNotFound";
  override readonly status: number = 404;
}

export class OrderFailure extends AppFailure {
  static override readonly kindName: string = "OrderFailure";
  override readonly status: number = 422;
}

export class EmptyCartOrder extends OrderFailure {
  static override readonly kindName: string = "EmptyCartOrder";
}

export interface FailureReply {
  kind: string;
  kinds: string[];
  message: string;
  trace: string;
}

export function failureReply(f: AppFailure): FailureReply {
  return { kind: f.kind, kinds: f.kinds, message: f.message, trace: f.stack ?? "" };
}

/** Runs a route body; every failure leaves as an HTTPError whose data is a `FailureReply`. */
export async function guardRoute<T>(run: () => Promise<T> | T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof HTTPError && e.status < 500) throw e;
    const failure =
      e instanceof AppFailure
        ? e
        : new AppFailure(e instanceof Error ? e.message : String(e), { cause: e });
    throw new HTTPError({
      status: failure.status,
      message: failure.message,
      data: failureReply(failure),
    });
  }
}
