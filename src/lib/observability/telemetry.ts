/**
 * Telemetry tracking
 * Abstracts product analytics (e.g., PostHog, Mixpanel).
 */
import { logger } from "./logger";

export const telemetry = {
  captureEvent: (eventName: string, properties?: Record<string, unknown>) => {
    logger.info(`[Telemetry] ${eventName}`, properties);
  },

  identifyUser: (userId: string, traits?: Record<string, unknown>) => {
    logger.debug(`[Telemetry] Identified User: ${userId}`, traits);
  },
};
