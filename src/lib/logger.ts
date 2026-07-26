/**
 * RewardLoop — Structured logger.
 *
 * Replaces raw console.log with structured, namespace-scoped logging.
 * In production, output is JSON for log aggregation; debug is suppressed.
 * In development, output is human-readable with colors.
 *
 * @example
 * ```ts
 * import { createLogger } from "@/lib/logger";
 * const log = createLogger("auth");
 * log.info("OTP sent", { phone: "+91..." });
 * log.debug("Token payload", { claims });
 * ```
 */

import { isDevelopment } from "./env.client";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  namespace?: string;
  context?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  if (isDevelopment()) {
    const ns = entry.namespace ? ` [${entry.namespace}]` : "";
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${entry.level.toUpperCase()}]${ns} ${entry.message}${ctx}`;
  }
  return JSON.stringify(entry);
}

function log(
  level: LogLevel,
  message: string,
  namespace?: string,
  context?: Record<string, unknown>,
) {
  // Suppress debug in production
  if (level === "debug" && !isDevelopment()) return;

  let safeContext = context;
  if (context) {
    safeContext = { ...context };
    // Redact sensitive fields
    const sensitiveKeys = ['phone', 'otp', 'reward_balance'];
    for (const key of Object.keys(safeContext)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        safeContext[key] = '[REDACTED]';
      }
    }
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(namespace && { namespace }),
    ...(safeContext && { context: safeContext }),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "debug":
    case "info":
      // eslint-disable-next-line no-console
      console.info(formatted);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(formatted);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(formatted);
      break;
  }
}

interface Logger {
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
  debug: (message: string, context?: Record<string, unknown>) => void;
}

/**
 * Create a namespace-scoped logger instance.
 *
 * @param namespace - Feature or module name for filtering (e.g. "auth", "billing")
 */
export function createLogger(namespace: string): Logger {
  return {
    info: (message, context) => log("info", message, namespace, context),
    warn: (message, context) => log("warn", message, namespace, context),
    error: (message, context) => log("error", message, namespace, context),
    debug: (message, context) => log("debug", message, namespace, context),
  };
}

/** Default logger without namespace */
export const logger: Logger = {
  info: (message, context) => log("info", message, undefined, context),
  warn: (message, context) => log("warn", message, undefined, context),
  error: (message, context) => log("error", message, undefined, context),
  debug: (message, context) => log("debug", message, undefined, context),
};
