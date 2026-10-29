import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CACHE_TTL_MS, cached, clearCache } from "./cache";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  clearCache();
});
afterEach(() => vi.useRealTimers());

describe("page cache", () => {
  it("[SWHR2-C-0189] within 5 minutes a second shopper is served the cached copy", async () => {
    const load = vi.fn().mockResolvedValueOnce("as rendered for A").mockResolvedValueOnce("fresh");
    expect(await cached(["listProducts", "en_US", "FISH", 0, 2], load)).toBe("as rendered for A");
    vi.setSystemTime(Date.now() + 60 * 1000);
    expect(await cached(["listProducts", "en_US", "FISH", 0, 2], load)).toBe("as rendered for A");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("[SWHR2-C-0188] a copy older than 5 minutes is reloaded", async () => {
    const load = vi.fn().mockResolvedValueOnce("old").mockResolvedValueOnce("new");
    await cached(["k"], load);
    vi.setSystemTime(Date.now() + CACHE_TTL_MS + 1000);
    expect(await cached(["k"], load)).toBe("new");
  });

  it("keys differ by any part and failures are not cached", async () => {
    const fail = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("ok");
    await expect(cached(["a", 1], fail)).rejects.toThrow("down");
    expect(await cached(["a", 1], fail)).toBe("ok");
    expect(await cached(["a", 2], async () => "other")).toBe("other");
  });
});
