import posthog from "posthog-js";

import * as Sentry from "@sentry/nextjs";

const token =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (typeof window !== "undefined") {
  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured",
      );
    }
  } else {
    posthog.init(token, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: false,
      request_batching: true,
      person_profiles: "identified_only",
    });
  }
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // Session Replay: 10% of all sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  enableLogs: true,

  integrations: [Sentry.replayIntegration()],
});

// Hook into App Router navigation transitions (App Router only)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
