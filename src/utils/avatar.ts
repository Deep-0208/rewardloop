/**
 * RewardLoop — Avatar & Customer Initial Utilities
 *
 * Provides deterministic color palette selection and clean initials generation
 * for customer avatars across the application.
 */

export interface AvatarPalette {
  /** Background class (supports light/dark theme) */
  bg: string;
  /** Text color class (WCAG compliant contrast) */
  text: string;
  /** Subtle ring border for elevation definition */
  ring: string;
}

/**
 * 8 Curated, high-contrast avatar color palettes.
 * Uses soft 10-20% tinted backgrounds with rich foreground hue and subtle ring borders.
 */
export const AVATAR_PALETTES: readonly AvatarPalette[] = [
  {
    bg: "bg-indigo-500/15 dark:bg-indigo-400/20",
    text: "text-indigo-700 dark:text-indigo-300",
    ring: "ring-1 ring-indigo-500/25 dark:ring-indigo-400/30",
  },
  {
    bg: "bg-emerald-500/15 dark:bg-emerald-400/20",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-1 ring-emerald-500/25 dark:ring-emerald-400/30",
  },
  {
    bg: "bg-violet-500/15 dark:bg-violet-400/20",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-1 ring-violet-500/25 dark:ring-violet-400/30",
  },
  {
    bg: "bg-amber-500/15 dark:bg-amber-400/20",
    text: "text-amber-800 dark:text-amber-300",
    ring: "ring-1 ring-amber-500/25 dark:ring-amber-400/30",
  },
  {
    bg: "bg-rose-500/15 dark:bg-rose-400/20",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-1 ring-rose-500/25 dark:ring-rose-400/30",
  },
  {
    bg: "bg-teal-500/15 dark:bg-teal-400/20",
    text: "text-teal-700 dark:text-teal-300",
    ring: "ring-1 ring-teal-500/25 dark:ring-teal-400/30",
  },
  {
    bg: "bg-sky-500/15 dark:bg-sky-400/20",
    text: "text-sky-700 dark:text-sky-300",
    ring: "ring-1 ring-sky-500/25 dark:ring-sky-400/30",
  },
  {
    bg: "bg-blue-500/15 dark:bg-blue-400/20",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-1 ring-blue-500/25 dark:ring-blue-400/30",
  },
] as const;

/**
 * Extract clean 1 or 2 letter initials from a customer name or fallback.
 *
 * @example
 * getInitials("Deepak Patel") => "DP"
 * getInitials("Lata Roy") => "LR"
 * getInitials("+91 9876543210") => "CU"
 * getInitials(null) => "WC" (Walk-in Customer)
 */
export function getInitials(name?: string | null): string {
  if (!name) return "WC";
  const trimmed = name.trim();
  if (!trimmed) return "WC";

  // If input is purely digits/phone number format
  const sanitizedDigits = trimmed.replace(/[\s+\-()]/g, "");
  if (/^\d+$/.test(sanitizedDigits)) {
    return "CU";
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const first = parts[0][0] || "";
    const second = parts[1][0] || "";
    return (first + second).toUpperCase();
  }

  return trimmed.substring(0, 2).toUpperCase();
}

const DEFAULT_PALETTE: AvatarPalette = AVATAR_PALETTES[0]!;

/**
 * Fast DJB2 string hashing for deterministic palette selection.
 * Given the same customer name or ID, always returns the same AvatarPalette.
 */
export function getAvatarPalette(seed?: string | null): AvatarPalette {
  if (!seed) return DEFAULT_PALETTE;

  let hash = 5381;
  const str = seed.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }

  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index] ?? DEFAULT_PALETTE;
}

