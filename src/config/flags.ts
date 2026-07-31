/**
 * Feature Flags Configuration
 * This module centralizes all feature toggles to support smooth rollouts,
 * emergency kill-switches, and a future remote configuration provider (LaunchDarkly, Statsig, etc.)
 */

export interface AppFeatureFlags {
  enableRealtimeSync: boolean;
  enableLookaheadPrefetch: boolean;
  enableRetryBackoff: boolean;
  enableObservability: boolean;
  enableOfflineBanner: boolean;
}

const DEFAULT_FLAGS: AppFeatureFlags = {
  enableRealtimeSync: true,
  enableLookaheadPrefetch: true,
  enableRetryBackoff: true,
  enableObservability: true,
  enableOfflineBanner: true,
};

export const featureFlags = {
  /**
   * Evaluates a feature flag.
   * In a remote config setup, this would accept a User/Context object.
   */
  get: (flagName: keyof AppFeatureFlags): boolean => {
    // We could override from process.env if needed:
    // if (process.env[`NEXT_PUBLIC_FF_${flagName.toUpperCase()}`]) ...
    return DEFAULT_FLAGS[flagName];
  },
};
