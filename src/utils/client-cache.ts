import { metrics } from "@/lib/observability/metrics";
import { logger } from "@/lib/observability/logger";

interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  retryLimit: number;
  retryBaseDelayMs: number;
  version: number;
}

interface CacheEntry<V> {
  value: V;
  timestamp: number;
  version: number;
}

export class ClientCacheManager<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private inflightPromises = new Map<K, Promise<V>>();
  private abortControllers = new Map<K, AbortController>();
  private readonly config: CacheConfig;

  constructor(
    private readonly cacheName: string,
    config?: Partial<CacheConfig>,
  ) {
    this.config = {
      maxSize: 5000,
      ttlMs: 5 * 60 * 1000, // 5 mins
      retryLimit: 3,
      retryBaseDelayMs: 500,
      version: 1,
      ...config,
    };
  }

  public get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      metrics.increment("cache.miss", 1, { cache: this.cacheName });
      return undefined;
    }

    if (entry.version !== this.config.version) {
      this.delete(key);
      metrics.increment("cache.miss.version", 1, { cache: this.cacheName });
      return undefined;
    }

    const isStale = Date.now() - entry.timestamp > this.config.ttlMs;
    if (isStale) {
      // Return undefined to force re-fetch, but leave it in map for stale-if-error fallback
      metrics.increment("cache.miss.stale", 1, { cache: this.cacheName });
      return undefined;
    }

    // LRU: touch to move to end
    this.cache.delete(key);
    this.cache.set(key, entry);
    metrics.increment("cache.hit", 1, { cache: this.cacheName });

    return entry.value;
  }

  public set(key: K, value: V): void {
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      // LRU Eviction: remove the first key (oldest inserted)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
        metrics.increment("cache.eviction", 1, { cache: this.cacheName });
      }
    }
    this.cache.delete(key); // to push to end of insertion order
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      version: this.config.version,
    });
  }

  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: K): void {
    this.cache.delete(key);
    this.abort(key);
  }

  public clear(): void {
    this.cache.clear();
    for (const key of this.abortControllers.keys()) {
      this.abort(key);
    }
    metrics.increment("cache.cleared", 1, { cache: this.cacheName });
  }

  public abort(key: K): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
    this.inflightPromises.delete(key);
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message === "Aborted")
        return false;
    }
    // Assume HTTP errors like 400, 401, 403, 404 shouldn't be retried
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status: number }).status;
      if (
        typeof status === "number" &&
        status >= 400 &&
        status < 500 &&
        status !== 429
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Fetches data with deduplication, retries, jitter, cancellation, and stale-if-error fallback.
   */
  public async fetchWithRetry(
    key: K,
    fetchFn: (signal: AbortSignal) => Promise<V>,
  ): Promise<V> {
    if (this.inflightPromises.has(key)) {
      return this.inflightPromises.get(key)!;
    }

    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    const promise = (async () => {
      let attempt = 0;
      while (attempt < this.config.retryLimit) {
        try {
          if (controller.signal.aborted) throw new Error("Aborted");

          const start = performance.now();
          const result = await fetchFn(controller.signal);
          metrics.histogram("cache.fetch.duration", performance.now() - start, {
            cache: this.cacheName,
          });

          this.set(key, result);
          return result;
        } catch (error: unknown) {
          if (!this.isRetryableError(error)) {
            logger.error(
              `[Cache ${this.cacheName}] Non-retryable error`,
              error,
            );
            throw error;
          }

          attempt++;
          metrics.increment("cache.fetch.retry", 1, {
            cache: this.cacheName,
            attempt: attempt.toString(),
          });
          logger.warn(
            `[Cache ${this.cacheName}] Retry attempt ${attempt}/${this.config.retryLimit}`,
          );

          if (attempt >= this.config.retryLimit) {
            // Stale-if-error fallback
            const staleEntry = this.cache.get(key);
            if (staleEntry && staleEntry.version === this.config.version) {
              logger.warn(
                `[Cache ${this.cacheName}] Max retries reached. Using stale-if-error fallback.`,
              );
              metrics.increment("cache.stale_fallback", 1, {
                cache: this.cacheName,
              });
              return staleEntry.value;
            }
            metrics.increment("cache.fetch.failed", 1, {
              cache: this.cacheName,
            });
            throw error;
          }

          // Exponential backoff with Jitter
          const backoff =
            this.config.retryBaseDelayMs * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 200; // 0-200ms jitter
          await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
        }
      }
      throw new Error("Unreachable");
    })();

    this.inflightPromises.set(key, promise);

    try {
      return await promise;
    } finally {
      if (this.inflightPromises.get(key) === promise) {
        this.inflightPromises.delete(key);
        this.abortControllers.delete(key);
      }
    }
  }
}
