import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import pkg from "../../../../package.json";

export async function GET() {
  const startTime = Date.now();
  let isDbHealthy = false;
  let isRedisHealthy = true;
  let dbErrorMessage: string | null = null;
  let redisErrorMessage: string | null = null;

  // 1. Validate PostgreSQL Database Connectivity via direct table query
  try {
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from("businesses").select("id").limit(1);
    
    if (dbError) {
      dbErrorMessage = dbError.message;
      isDbHealthy = false;
    } else {
      isDbHealthy = true;
    }
  } catch (error) {
    dbErrorMessage = error instanceof Error ? error.message : "Database connection exception";
    isDbHealthy = false;
  }

  // 2. Validate Redis connectivity if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { redis } = await import("@/lib/redis");
      const pingResult = await redis.ping();
      isRedisHealthy = pingResult === "PONG" || pingResult === "OK" || Boolean(pingResult);
      if (!isRedisHealthy) {
        redisErrorMessage = "Unexpected ping response from Redis";
      }
    } catch (error) {
      redisErrorMessage = error instanceof Error ? error.message : "Redis connection exception";
      isRedisHealthy = false;
    }
  }

  const isHealthy = isDbHealthy && isRedisHealthy;
  const latencyMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      version: pkg.version,
      timestamp: new Date().toISOString(),
      latencyMs,
      services: {
        database: {
          status: isDbHealthy ? "up" : "down",
          ...(dbErrorMessage ? { error: dbErrorMessage } : {}),
        },
        redis: {
          status: isRedisHealthy ? "up" : "down",
          ...(redisErrorMessage ? { error: redisErrorMessage } : {}),
        },
      },
    },
    { status: isHealthy ? 200 : 503 },
  );
}

