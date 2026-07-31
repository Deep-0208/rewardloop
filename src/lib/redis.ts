import "server-only";

import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/env.server";

const env = getServerEnv();

/**
 * Global Redis client instance.
 * Automatically configured with Upstash REST URL and Token from env.
 */
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
