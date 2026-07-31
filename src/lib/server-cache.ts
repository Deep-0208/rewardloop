import "server-only";

import { redis } from "./redis";
import { logger } from "./observability/logger";

interface CacheOptions {
  ttlSeconds?: number;
  businessId?: string;
}

export class ServerCacheManager {
  private readonly defaultTTL = 3600; // 1 hour

  /** Build a tenant-isolated cache key */
  public buildKey(key: string, businessId?: string): string {
    return businessId ? `tenant:${businessId}:${key}` : key;
  }

  /**
   * Fetch data with Redis caching.
   * If cache hit, returns parsed JSON data.
   * If cache miss, executes fetchFn, stores in Redis, and returns data.
   */
  public async fetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const fullKey = this.buildKey(key, options?.businessId);
    try {
      const cached = await redis.get<T>(fullKey);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      logger.warn(`[ServerCache] Failed to get key ${fullKey}`, { error });
      // Proceed to fetchFn on cache read error to maintain availability
    }

    const data = await fetchFn();

    try {
      const ttl = options?.ttlSeconds ?? this.defaultTTL;
      await redis.set(fullKey, data, { ex: ttl });
    } catch (error) {
      logger.warn(`[ServerCache] Failed to set key ${fullKey}`, { error });
    }

    return data;
  }

  /**
   * Invalidate a specific cache key.
   */
  public async invalidate(key: string, businessId?: string): Promise<void> {
    const fullKey = this.buildKey(key, businessId);
    try {
      await redis.del(fullKey);
    } catch (error) {
      logger.warn(`[ServerCache] Failed to invalidate key ${fullKey}`, { error });
    }
  }

  /**
   * Invalidate all keys matching a prefix pattern using non-blocking SCAN iteration.
   * Prevents Redis single-threaded performance spikes in production.
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: pattern,
          count: 100,
        });
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (error) {
      logger.warn(`[ServerCache] Failed to invalidate pattern ${pattern}`, {
        error,
      });
    }
  }
}

export const serverCache = new ServerCacheManager();

