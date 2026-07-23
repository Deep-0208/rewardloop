/**
 * RewardLoop — Server environment validation.
 *
 * Validates server-only secrets (Supabase service role, MSG91 keys).
 * MUST NOT be imported from client components.
 *
 * @module env.server
 */

import "server-only";

import { z } from "zod";
import { getClientEnv, isDevelopment, type ClientEnv } from "./env.client";

const msg91Schema = isDevelopment()
  ? z.object({
      MSG91_AUTH_KEY: z.string().optional(),
      MSG91_OTP_TEMPLATE_ID: z.string().optional(),
      MSG91_TRANSACTION_TEMPLATE_ID: z.string().optional(),
      MSG91_SENDER_ID: z.string().optional(),
    })
  : z.object({
      MSG91_AUTH_KEY: z
        .string()
        .min(1, "MSG91_AUTH_KEY is required in production"),
      MSG91_OTP_TEMPLATE_ID: z
        .string()
        .min(1, "MSG91_OTP_TEMPLATE_ID is required in production"),
      MSG91_TRANSACTION_TEMPLATE_ID: z
        .string()
        .min(1, "MSG91_TRANSACTION_TEMPLATE_ID is required in production"),
      MSG91_SENDER_ID: z
        .string()
        .min(1, "MSG91_SENDER_ID is required in production")
        .default("RWDLOP"),
    });

const serverOnlySchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  REWARDLOOP_SESSION_SECRET: z
    .string()
    .min(
      32,
      "REWARDLOOP_SESSION_SECRET is required and must be at least 32 characters",
    ),
});

export interface ServerEnv extends ClientEnv {
  SUPABASE_SERVICE_ROLE_KEY: string;
  REWARDLOOP_SESSION_SECRET: string;
  MSG91_AUTH_KEY?: string;
  MSG91_OTP_TEMPLATE_ID?: string;
  MSG91_TRANSACTION_TEMPLATE_ID?: string;
  MSG91_SENDER_ID?: string;
}

let _serverEnv: ServerEnv | null = null;

/**
 * Server-only environment variables.
 * Must only be called in Server Components, Server Actions, or middleware.
 * Fails fast with descriptive errors if required secrets are missing.
 */
export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const clientEnv = getClientEnv();

  const serverOnly = serverOnlySchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    REWARDLOOP_SESSION_SECRET: process.env.REWARDLOOP_SESSION_SECRET,
  });

  const msg91 = msg91Schema.parse({
    MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
    MSG91_OTP_TEMPLATE_ID: process.env.MSG91_OTP_TEMPLATE_ID,
    MSG91_TRANSACTION_TEMPLATE_ID: process.env.MSG91_TRANSACTION_TEMPLATE_ID,
    MSG91_SENDER_ID: process.env.MSG91_SENDER_ID,
  });

  _serverEnv = {
    ...clientEnv,
    ...serverOnly,
    ...msg91,
  };

  return _serverEnv;
}
