/**
 * Structured Logging
 * Abstracted away from direct console usage so it can be routed
 * to external loggers (e.g. Datadog) in the future.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  error: (
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>,
  ) => {
    const errorContext =
      error instanceof Error
        ? { errorMessage: error.message, stack: error.stack }
        : { error };
    log("error", message, { ...context, ...errorContext });
  },
};

function redactPII(obj: unknown): unknown {
  if (!obj) return obj;
  if (typeof obj === "string") {
    // Basic phone number redaction for US formats e.g. +1234567890
    if (/^\+?[0-9\-\s()]{10,15}$/.test(obj)) {
      return "[REDACTED_PHONE]";
    }
    // Basic email redaction
    if (obj.includes("@") && obj.includes(".")) {
      return "[REDACTED_EMAIL]";
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  }
  if (typeof obj === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        ["name", "phone", "email", "customerName", "customerPhone"].includes(
          key.toLowerCase(),
        )
      ) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactPII(value);
      }
    }
    return redacted;
  }
  return obj;
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  // In a real production setup, this would be wired to a remote sink
  // For now, structured JSON to console in development, silent/formatted in prod
  if (process.env.NODE_ENV !== "test") {
    const safeContext = redactPII(context) as
      Record<string, unknown> | undefined;
    const output = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...safeContext,
    };
    switch (level) {
      /* eslint-disable no-console */
      case "debug":
        console.debug(output);
        break;
      case "info":
        console.info(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "error":
        console.error(output);
        break;
      /* eslint-enable no-console */
    }
  }
}
