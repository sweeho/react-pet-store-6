/* eslint-disable @typescript-eslint/no-unused-vars -- red-phase stubs */
import type { Executor } from "../services/ids";

type SeedData = Record<string, unknown>;

export async function loadSeed(_data?: SeedData): Promise<void> {
  throw new Error("VortexNotImplemented");
}

export function seedInventory(
  _exec: Executor,
  _entries: { itemId: string; quantity?: number }[],
): void {
  throw new Error("VortexNotImplemented");
}
