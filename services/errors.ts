/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
export class AppFailure extends Error {
  kind = "AppFailure";
}
export class ItemNotFound extends AppFailure {}
export class EmptyCartOrder extends AppFailure {}
export function failureReply(_f: AppFailure): { kind: string; kinds: string[] } {
  throw new Error("VortexNotImplemented");
}
export function guardRoute<T>(_run: () => Promise<T> | T): Promise<T> {
  throw new Error("VortexNotImplemented");
}
