/**
 * RewardLoop — TanStack Query key factory.
 *
 * Standard query key convention from 07_Application_Architecture.md §8.
 * Use these factories for all useQuery/useMutation calls.
 */

export const QUERY_KEYS = {
  dashboard: (businessId: string) => ["dashboard", businessId] as const,
  transactions: (businessId: string) => ["transactions", businessId] as const,
  transaction: (id: string) => ["transaction", id] as const,
  catalog: (businessId: string) => ["catalog", businessId] as const,
  customer: (businessId: string, phone: string) =>
    ["customer", businessId, phone] as const,
  insights: (businessId: string, period: string) =>
    ["insights", businessId, period] as const,
  rewardRules: (businessId: string) => ["reward-rules", businessId] as const,
  wallet: (customerId: string, businessId: string) =>
    ["wallet", customerId, businessId] as const,
} as const;
