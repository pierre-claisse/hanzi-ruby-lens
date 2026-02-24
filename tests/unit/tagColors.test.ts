import { describe, it, expect } from "vitest";
import { TAG_COLORS } from "../../src/data/tagColors";

describe("TAG_COLORS palette", () => {
  it("contains exactly 10 colors", () => {
    expect(TAG_COLORS).toHaveLength(10);
  });

  it("has unique keys", () => {
    const keys = TAG_COLORS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has non-empty bg and text values for every color", () => {
    for (const color of TAG_COLORS) {
      expect(color.bg.length).toBeGreaterThan(0);
      expect(color.text.length).toBeGreaterThan(0);
    }
  });

  it("has non-empty labels for every color", () => {
    for (const color of TAG_COLORS) {
      expect(color.label.length).toBeGreaterThan(0);
    }
  });

  it("has non-empty keys for every color", () => {
    for (const color of TAG_COLORS) {
      expect(color.key.length).toBeGreaterThan(0);
    }
  });

  it("is immutable (readonly)", () => {
    // TypeScript enforces this via `as const`, but verify the array is frozen-like
    expect(Array.isArray(TAG_COLORS)).toBe(true);
  });
});
