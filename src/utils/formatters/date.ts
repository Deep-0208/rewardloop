/**
 * RewardLoop — Date and time formatting.
 *
 * Provides Indian-locale date formatting and relative time display.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Format a timestamp to Indian locale date string.
 *
 * @param timestamp - ISO 8601 timestamp or Date
 * @param options - "date" (default), "datetime", or "time"
 * @returns Formatted string like "23 Jul 2026" or "23 Jul 2026, 2:30 pm"
 */
export function formatDate(
  timestamp: string | Date,
  options: "date" | "datetime" | "time" = "date",
): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  switch (options) {
    case "datetime":
      return DATETIME_FORMATTER.format(date);
    case "time":
      return TIME_FORMATTER.format(date);
    case "date":
      return DATE_FORMATTER.format(date);
  }
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
  style: "long",
});

/**
 * Format a timestamp as relative time (e.g. "2 minutes ago").
 *
 * @param timestamp - ISO 8601 timestamp or Date
 * @returns Relative time string like "2 minutes ago", "1 hour ago", "yesterday"
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === "second") {
      const value = Math.round(diffSeconds / secondsInUnit);
      return RELATIVE_FORMATTER.format(value, unit);
    }
  }

  return "just now";
}
