# Synchronization & Cache Architecture

RewardLoop uses a sophisticated multi-layer caching and realtime synchronization engine to guarantee zero-latency checkouts and perfect multi-device consistency.

## 1. Advanced CacheManager Utility

All caches are backed by the `CacheManager` class (`src/utils/cache-manager.ts`).

- **Deduplication:** Prevents identical overlapping network requests (e.g., if a user rapidly toggles between screens).
- **Exponential Backoff with Jitter:** Failed network requests automatically retry up to 3 times, doubling the wait time on each failure, plus up to 200ms of random jitter to prevent "Thundering Herd" reconnect storms.
- **LRU Eviction:** Hard limits on memory usage (e.g. 5000 items). Oldest accessed items are evicted first.
- **Stale-If-Error Fallback:** If network fetch permanently fails, the cache can fallback to the stale version (if versioning matches) rather than crashing the UI.
- **Cancellation:** Supports `AbortController` to cancel stale requests.
- **Observability:** Broadcasts telemetry for `cache.hit`, `cache.miss`, `cache.eviction`, and `cache.fetch.retry`.

## 2. Realtime Supabase Sync

Multiple iPads at the same salon desk are synchronized via WebSockets (`useRealtimeSync`).

- **Events:** Listens for `INSERT` and `UPDATE` on `customers` and `catalog_items`.
- **Deduplication:** A `processedEvents` Set uniquely identifies payload commits and ignores duplicate broadcasts from Supabase infrastructure.
- **Debouncing:** Catalog updates are debounced by 1 second to prevent UI jank during batch updates.
- **Recovery Strategy:**
  1. Detect Reconnect (`SUBSCRIBED` after `CLOSED`).
  2. Clear stale cache (`catalogCache.clear()`).
  3. Trigger Background Refresh.
  4. Resume updates.

## 3. Observability & Feature Flags

- The `src/lib/observability/` namespace exposes `logger.ts`, `metrics.ts`, and `telemetry.ts` behind an abstract interface, decoupling the business logic from vendors (Datadog/Sentry).
- The `src/config/flags.ts` strongly types system-wide constants, allowing Realtime Sync, Lookahead Prefetching, and Offline UI constraints to be toggled safely.

## 4. Offline Resilience

If the device loses Wi-Fi, a global `<NetworkStatusBanner>` appears.
Checkout mutations are temporarily disabled during network drops to prevent application crashes or silent data loss.
