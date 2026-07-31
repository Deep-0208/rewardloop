"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  customerCache,
  cacheCustomerList,
  setHasPrefetchedAll,
} from "@/features/customer/utils/customer-cache";
import {
  triggerCatalogPrefetch,
  catalogCache,
} from "@/features/catalog/utils/catalog-cache";
import { prefetchCustomers } from "@/features/customer/actions/prefetch-customers";
import type { Customer } from "@/features/customer/types";
import { featureFlags } from "@/config/flags";
import { metrics } from "@/lib/observability/metrics";
import { logger } from "@/lib/observability/logger";

export function useRealtimeSync() {
  const [connectionState, setConnectionState] = useState<string>(
    featureFlags.get("enableRealtimeSync") ? "INITIALIZING" : "DISABLED",
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasDisconnected = useRef(false);
  const processedEvents = useRef(new Map<string, boolean>()); // LRU for duplicate events

  useEffect(() => {
    if (!featureFlags.get("enableRealtimeSync")) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel("public-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "customers" },
        (payload) => {
          const newCustomer = payload.new as Customer;
          if (newCustomer && newCustomer.phone) {
            // Deduplicate
            const eventId = `insert-cust-${newCustomer.id}`;
            if (processedEvents.current.has(eventId)) return;
            if (processedEvents.current.size >= 5000) {
              const firstKey = processedEvents.current.keys().next().value;
              if (firstKey !== undefined)
                processedEvents.current.delete(firstKey);
            }
            processedEvents.current.set(eventId, true);

            customerCache.set(newCustomer.phone, newCustomer);
            metrics.increment("realtime.event.customer.insert");
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "customers" },
        (payload) => {
          const updatedCustomer = payload.new as Customer;
          if (updatedCustomer && updatedCustomer.phone) {
            const eventId = `update-cust-${updatedCustomer.id}-${payload.commit_timestamp}`;
            if (processedEvents.current.has(eventId)) return;
            if (processedEvents.current.size >= 5000) {
              const firstKey = processedEvents.current.keys().next().value;
              if (firstKey !== undefined)
                processedEvents.current.delete(firstKey);
            }
            processedEvents.current.set(eventId, true);

            customerCache.set(updatedCustomer.phone, updatedCustomer);
            metrics.increment("realtime.event.customer.update");
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "catalog_items" },
        () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            catalogCache.clear(); // Invalidate stale cache
            triggerCatalogPrefetch(); // Background refresh
            metrics.increment("realtime.event.catalog.refresh");
          }, 1000);
        },
      )
      .subscribe(async (status, err) => {
        setConnectionState(status);
        logger.debug(`[Realtime] Status changed to ${status}`, { error: err });

        if (status === "SUBSCRIBED") {
          metrics.increment("realtime.connection.subscribed");
          if (wasDisconnected.current) {
            logger.info(
              "[Realtime] Recovered from disconnect. Invalidating cache and refreshing.",
            );

            // Reconnect Flow: Invalidate -> Refresh
            catalogCache.clear();
            triggerCatalogPrefetch();

            const result = await prefetchCustomers();
            if (result.success && result.data) {
              customerCache.clear(); // Clear out stale customers before repopulating
              cacheCustomerList(result.data);
              setHasPrefetchedAll(true);
            }
            wasDisconnected.current = false;
          }
        } else if (
          status === "CLOSED" ||
          status === "TIMED_OUT" ||
          status === "CHANNEL_ERROR"
        ) {
          if (!wasDisconnected.current) {
            metrics.increment("realtime.connection.dropped", 1, {
              reason: status,
            });
            wasDisconnected.current = true;
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { connectionState };
}
