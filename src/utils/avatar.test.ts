import { describe, it, expect } from "vitest";
import { getInitials, getAvatarPalette, AVATAR_PALETTES } from "./avatar";

describe("Avatar Utilities", () => {
  describe("getInitials", () => {
    it("returns initials for full names", () => {
      expect(getInitials("Deepak Patel")).toBe("DP");
      expect(getInitials("Lata Roy")).toBe("LR");
      expect(getInitials("Rahul Sharma")).toBe("RS");
    });

    it("returns first two letters for single word names", () => {
      expect(getInitials("Deepak")).toBe("DE");
      expect(getInitials("Anu")).toBe("AN");
    });

    it("handles phone numbers by returning 'CU'", () => {
      expect(getInitials("+91 9876543210")).toBe("CU");
      expect(getInitials("9876543210")).toBe("CU");
    });

    it("handles null or undefined by returning 'WC'", () => {
      expect(getInitials(null)).toBe("WC");
      expect(getInitials(undefined)).toBe("WC");
      expect(getInitials("   ")).toBe("WC");
    });
  });

  describe("getAvatarPalette", () => {
    it("returns deterministic palette for the same seed string", () => {
      const palette1 = getAvatarPalette("Deepak Patel");
      const palette2 = getAvatarPalette("Deepak Patel");
      expect(palette1).toEqual(palette2);
    });

    it("is case-insensitive and trims whitespace", () => {
      const palette1 = getAvatarPalette("Lata Roy");
      const palette2 = getAvatarPalette("   lata roy   ");
      expect(palette1).toEqual(palette2);
    });

    it("returns default palette for empty seed", () => {
      const palette = getAvatarPalette(null);
      expect(palette).toEqual(AVATAR_PALETTES[0]);
    });
  });
});
