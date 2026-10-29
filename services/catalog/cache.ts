export const CACHE_TTL_MS = 5 * 60 * 1000;

export function cached<T>(key: readonly unknown[], load: () => Promise<T>): Promise<T> {
  void [key, load];
  throw new Error("VortexNotImplemented");
}

export function clearCache(): void {
  throw new Error("VortexNotImplemented");
}
