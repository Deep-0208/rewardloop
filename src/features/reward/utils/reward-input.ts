/**
 * Converts the reward entry field to and from paise without using floating
 * point arithmetic. The UI may display rupees, but its value crosses the
 * billing boundary as an integer paise amount.
 */

import type { Paise } from "@/types";

const RUPEE_INPUT = /^\d*(?:\.\d{0,2})?$/;

export function sanitizeRupeeInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = cleaned.split(".");
  const fraction = fractionParts.join("").slice(0, 2);
  return fractionParts.length > 0 ? `${whole}.${fraction}` : whole;
}

export function isRupeeInput(value: string): boolean {
  return RUPEE_INPUT.test(value);
}

export function parseRupeeInputToPaise(value: string): Paise {
  if (value.length === 0 || value === ".") return 0;
  if (!isRupeeInput(value)) {
    throw new RangeError("Reward amount must be a valid rupee amount.");
  }

  const [wholePart = "0", fractionPart = ""] = value.split(".");
  const wholePaise = Number(wholePart) * 100;
  const fractionPaise = Number(fractionPart.padEnd(2, "0"));
  const paise = wholePaise + fractionPaise;

  if (!Number.isSafeInteger(paise)) {
    throw new RangeError("Reward amount exceeds the supported range.");
  }
  return paise;
}

export function formatPaiseForRupeeInput(paise: Paise): string {
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new RangeError("Reward amount must be a non-negative paise integer.");
  }

  const whole = Math.floor(paise / 100);
  const fraction = paise % 100;
  return fraction === 0
    ? String(whole)
    : `${whole}.${String(fraction).padStart(2, "0")}`;
}
