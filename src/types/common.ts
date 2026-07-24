/**
 * RewardLoop — Common utility types shared across features.
 */

import type { ReactNode } from "react";

/** Application theme mode */
export type Theme = "light" | "dark" | "system";

/** Route definition */
export interface Route {
  readonly path: string;
  readonly label: string;
}

/** Application configuration */
export interface AppConfig {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly url: string;
}

/** Cursor-based pagination response */
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

/** Convenience: adds optional className to component props */
export interface PropsWithClassName {
  className?: string;
}

/** Convenience: component props with children and optional className */
export interface PropsWithChildren extends PropsWithClassName {
  children: ReactNode;
}

/* ─── Sort Types ──────────────────────────────────────────────────────────── */

/** Sort direction */
export type SortDirection = "asc" | "desc";

/** Sort parameters for list queries */
export interface SortParams {
  readonly field: string;
  readonly direction: SortDirection;
}

/* ─── Utility Types ───────────────────────────────────────────────────────── */

/**
 * Flatten intersection types for better IDE display.
 *
 * @example
 * type Result = Prettify<{ a: 1 } & { b: 2 }>;
 * // Hover shows: { a: 1; b: 2 } instead of { a: 1 } & { b: 2 }
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Strict version of Omit that errors if key doesn't exist on type.
 *
 * @example
 * type A = StrictOmit<{ a: 1; b: 2 }, "a">; // { b: 2 }
 * type B = StrictOmit<{ a: 1; b: 2 }, "c">; // TS Error: "c" is not in keyof
 */
export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

/** Adds created_at and updated_at timestamp fields */
export interface WithTimestamps {
  readonly created_at: string;
  readonly updated_at: string;
}

/** Make a type nullable */
export type Nullable<T> = T | null;
