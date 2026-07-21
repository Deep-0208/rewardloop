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
