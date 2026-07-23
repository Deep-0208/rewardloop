"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Debounce a value by a given delay.
 *
 * Returns the latest value only after `delay` ms of inactivity.
 * Useful for search inputs to avoid excessive API calls.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
    }

    // For zero delay, update on next tick via timeout
    timerRef.current = setTimeout(
      () => {
        setDebouncedValue(value);
      },
      Math.max(0, delay),
    );

    return () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
