/**
 * Metrics tracking
 * Abstracts tracking for counters and gauges (e.g., Datadog StatsD or Prometheus).
 */
import { logger } from "./logger";

export const metrics = {
  increment: (metricName: string, value = 1, tags?: Record<string, string>) => {
    logger.debug(`[Metric] ${metricName} +${value}`, { tags });
  },

  gauge: (metricName: string, value: number, tags?: Record<string, string>) => {
    logger.debug(`[Metric] ${metricName} = ${value}`, { tags });
  },

  histogram: (
    metricName: string,
    value: number,
    tags?: Record<string, string>,
  ) => {
    logger.debug(`[Metric] ${metricName} hist:${value}ms`, { tags });
  },
};
