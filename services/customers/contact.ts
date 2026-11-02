/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { Executor } from "../ids";

export interface ContactRecord {
  givenName: string;
  familyName: string;
  telephone: string;
  email: string;
  addressId: number;
}

export function createContact(_exec: Executor, _c: ContactRecord): number {
  throw new Error("VortexNotImplemented");
}
