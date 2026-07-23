/**
 * RewardLoop — API-specific shared types.
 *
 * Types for pagination, API responses, and request parameters.
 */

/** Cursor-based pagination input parameters */
export interface PaginationParams {
  /** Cursor for the next page (null for first page) */
  readonly cursor: string | null;
  /** Number of items per page */
  readonly pageSize: number;
}

/** Paginated API response wrapper */
export interface PaginatedResult<T> {
  readonly data: T[];
  /** Cursor to fetch the next page, null if no more pages */
  readonly nextCursor: string | null;
  /** Whether more pages exist */
  readonly hasMore: boolean;
  /** Total count (optional — only if query supports it) */
  readonly totalCount?: number;
}
