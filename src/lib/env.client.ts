/**
 * RewardLoop — Client environment validation.
 *
 * Validates NEXT_PUBLIC_* variables that are safe for browser and server.
 * Uses Zod for schema validation with descriptive error messages.
 *
 * @module env.client
 */

import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. http://localhost:54321)",
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let _clientEnv: ClientEnv | null = null;

/**
 * Client-safe environment variables (prefixed with NEXT_PUBLIC_).
 * Safe to use in both client and server components.
 * Validated once and cached.
 */
export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv;

  _clientEnv = clientEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return _clientEnv;
}

/** Check if running in development mode */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Check if running in production mode */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
