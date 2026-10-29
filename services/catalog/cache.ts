export const CACHE_TTL_MS = 5 * 60 * 1000;

interface Entry {
  value: unknown;
  storedAt: number;
}

// One cache for all shoppers in this process (design.md P7).
const entries = new Map<string, Entry>();

/** Returns the copy stored under `key` if under 5 minutes old, else loads and stores it. */
export async function cached<T>(key: readonly unknown[], load: () => Promise<T>): Promise<T> {
  const k = JSON.stringify(key);
  const hit = entries.get(k);
  if (hit && Date.now() - hit.storedAt <= CACHE_TTL_MS) return hit.value as T;
  const value = await load();
  entries.set(k, { value, storedAt: Date.now() });
  return value;
}

export function clearCache(): void {
  entries.clear();
}
