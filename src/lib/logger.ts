/**
 * RewardLoop — Structured logger.
 *
 * Replaces raw console.log with structured JSON logging.
 * In production, errors are formatted for log aggregation.
 * In development, output is human-readable.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "development") {
    const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${entry.level.toUpperCase()}] ${entry.message}${ctx}`;
  }
  return JSON.stringify(entry);
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  const formatted = formatEntry(entry);

  switch (level) {
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

export const logger = {
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    log("error", message, context),
};
