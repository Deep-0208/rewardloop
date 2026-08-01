import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Polyfill for Node 22/24 undici + jsdom WebIDL compatibility
// @ts-expect-error - webidl global polyfill for CI environment
if (typeof globalThis !== "undefined" && globalThis.webidl?.util) {
  // @ts-expect-error - polyfill missing webidl util function
  if (typeof globalThis.webidl.util.markAsUncloneable !== "function") {
    // @ts-expect-error - polyfill missing webidl util function
    globalThis.webidl.util.markAsUncloneable = (obj: unknown) => obj;
  }
}

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup();
});
