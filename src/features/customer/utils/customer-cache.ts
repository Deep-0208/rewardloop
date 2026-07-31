import type { Customer } from "../types";
import { ClientCacheManager } from "@/utils/client-cache";

class CustomerCacheManager extends ClientCacheManager<string, Customer | "not_found"> {
  private prefetchCompleted = false;

  public get hasPrefetchedAll(): boolean {
    return this.prefetchCompleted;
  }

  public setHasPrefetchedAll(value: boolean): void {
    this.prefetchCompleted = value;
  }

  public override clear(): void {
    super.clear();
    this.prefetchCompleted = false;
  }
}

export const customerCache = new CustomerCacheManager("customer_cache", {
  maxSize: 1000,
  ttlMs: 30 * 60 * 1000, // 30 mins
});

export function getHasPrefetchedAll(): boolean {
  return customerCache.hasPrefetchedAll;
}

export function setHasPrefetchedAll(value: boolean): void {
  customerCache.setHasPrefetchedAll(value);
}

export function cacheCustomerList(customers: Customer[]) {
  customers.forEach((c) => {
    customerCache.set(c.phone, c);
  });
}

