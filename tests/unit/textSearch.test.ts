import { describe, it, expect } from "vitest";
import { fuzzyFilterTexts } from "../../src/utils/textSearch";
import type { TextPreview } from "../../src/types/domain";

function makeText(id: number, title: string): TextPreview {
  return {
    id,
    title,
    createdAt: "2026-01-01T00:00:00",
    modifiedAt: null,
    tags: [],
    locked: false,
    comments: [],
  };
}

describe("fuzzyFilterTexts", () => {
  const texts: TextPreview[] = [
    makeText(1, "Hanzi basics"),
    makeText(2, "Tang dynasty"),
    makeText(3, "Advanced Hanzi"),
    makeText(4, "Pinyin guide"),
  ];

  it("empty query returns all texts unchanged", () => {
    expect(fuzzyFilterTexts("", texts)).toEqual(texts);
    expect(fuzzyFilterTexts("   ", texts)).toEqual(texts);
  });

  it("case-insensitive substring match", () => {
    const result = fuzzyFilterTexts("HANZI", texts);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual([1, 3]);
  });

  it("returns empty array when no match", () => {
    expect(fuzzyFilterTexts("zzz", texts)).toEqual([]);
  });

  it("sorts matches by position (earlier matches first)", () => {
    // "Hanzi basics" matches at pos 0; "Advanced Hanzi" matches at pos 9.
    const result = fuzzyFilterTexts("Hanzi", texts);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it("preserves input order when positions are tied", () => {
    const tied: TextPreview[] = [
      makeText(10, "Pinyin lesson"),
      makeText(11, "Pinyin guide"),
    ];
    const result = fuzzyFilterTexts("Pinyin", tied);
    expect(result.map((t) => t.id)).toEqual([10, 11]);
  });
});
