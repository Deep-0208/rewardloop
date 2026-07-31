import { describe, it, expect, vi } from "vitest";
import { ClientCacheManager } from "./client-cache";

describe("CacheManager", () => {
  it("deduplicates concurrent fetches", async () => {
    const manager = new ClientCacheManager<string, string>("test_cache");
    const fetchFn = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("data"), 50)),
      );

    const promise1 = manager.fetchWithRetry("key1", fetchFn);
    const promise2 = manager.fetchWithRetry("key1", fetchFn);

    const [res1, res2] = await Promise.all([promise1, promise2]);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(res1).toBe("data");
    expect(res2).toBe("data");
  });

  it("retries on failure", async () => {
    const manager = new ClientCacheManager<string, string>("test_cache", {
      retryLimit: 3,
      retryBaseDelayMs: 10,
    });

    let attempts = 0;
    const fetchFn = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error("Network Error"));
      }
      return Promise.resolve("success");
    });

    const result = await manager.fetchWithRetry("key2", fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(result).toBe("success");
  });

  it("can be aborted", async () => {
    const manager = new ClientCacheManager<string, string>("test_cache");

    const fetchFn = vi.fn().mockImplementation(
      (signal: AbortSignal) =>
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => resolve("data"), 100);
          signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new Error("AbortError"));
          });
        }),
    );

    const promise = manager.fetchWithRetry("key3", fetchFn);

    // Abort before it finishes
    manager.abort("key3");

    await expect(promise).rejects.toThrow("Aborted");
  });
});
