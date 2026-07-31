/**
 * Main Monitoring export.
 * Consolidates all observability under a single namespace for easy importing.
 */
import { logger } from "./logger";
import { metrics } from "./metrics";
import { telemetry } from "./telemetry";

export const monitoring = {
  logger,
  metrics,
  telemetry,

  captureException: (
    error: Error | unknown,
    context?: Record<string, unknown>,
  ) => {
    // In production, this pushes to Sentry / LogRocket
    logger.error("Exception Captured", error, context);
    metrics.increment("exception.captured");
  },

  startTimer: (metricName: string, tags?: Record<string, string>) => {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      metrics.histogram(metricName, duration, tags);
      return duration;
    };
  },
};
