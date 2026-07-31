import { logger } from "./logger";

/**
 * Production Metrics tracking interface.
 * Dispatches operational metric counters, gauges, and histograms
 * to structured logging and external APM collectors (Sentry / Datadog).
 */
export const metrics = {
  increment: (metricName: string, value = 1, tags?: Record<string, string>) => {
    logger.info(`[Metric Increment] ${metricName}`, { value, tags });
  },

  gauge: (metricName: string, value: number, tags?: Record<string, string>) => {
    logger.info(`[Metric Gauge] ${metricName}`, { value, tags });
  },

  histogram: (
    metricName: string,
    value: number,
    tags?: Record<string, string>,
  ) => {
    logger.info(`[Metric Histogram] ${metricName}`, { durationMs: value, tags });
  },
};

