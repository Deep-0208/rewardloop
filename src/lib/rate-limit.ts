import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/**
 * Standard global rate limiter for API & Middleware.
 * Allows 20 requests per 10 seconds per IP.
 */
export const globalRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/global",
});

/**
 * Stricter rate limiter for Authentication routes.
 * Allows 5 requests per 1 minute per IP.
 */
export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

/**
 * Server Action Rate Limiter (Reads / General Mutations).
 * Allows 60 requests per 1 minute per Business / User / IP.
 */
export const actionRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/action",
});

/**
 * Checkout / Visit Completion Rate Limiter.
 * Allows 10 requests per 1 minute per Business.
 */
export const checkoutRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/checkout",
});

