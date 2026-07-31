/**
 * RewardLoop — Trusted Client IP Address Extractor.
 *
 * Prevents IP spoofing in rate limiters by safely parsing proxies
 * or utilizing framework edge request properties.
 *
 * @module lib/ip
 */

import { type NextRequest } from "next/server";

export function getTrustedClientIp(request: NextRequest): string {
  // 1. Direct edge IP provided by cloud platform (e.g. Vercel)
  const edgeIp = (request as unknown as { ip?: string }).ip;
  if (edgeIp && edgeIp !== "127.0.0.1" && edgeIp !== "::1") {
    return edgeIp;
  }

  // 2. CF-Connecting-IP (Cloudflare edge header - tamper-proof behind CF proxy)
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  // 3. X-Real-IP (Standard reverse proxy header set by trusted ingress load balancer)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // 4. X-Forwarded-For: Extract the rightmost IP appended by the nearest trusted proxy
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    // Rightmost IP is appended by closest upstream proxy
    const clientIp = ips[ips.length - 1];
    if (clientIp) {
      return clientIp;
    }
  }

  return "127.0.0.1";
}
