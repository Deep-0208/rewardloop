import type { Customer } from "../types";
import { CacheManager } from "@/utils/cache-manager";

export const customerCache = new CacheManager<string, Customer | "not_found">(
  "customer_cache",
  {
    maxSize: 1000,
    ttlMs: 30 * 60 * 1000, // 30 mins
  },
);

export let hasPrefetchedAll = false;

export function setHasPrefetchedAll(value: boolean) {
  hasPrefetchedAll = value;
}

export function cacheCustomerList(customers: Customer[]) {
  customers.forEach((c) => {
    customerCache.set(c.phone, c);
  });
}
