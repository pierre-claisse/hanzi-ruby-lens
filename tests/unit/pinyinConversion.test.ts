import { describe, it, expect } from "vitest";
import {
  diacriticalToNumbered,
  numberedToDiacritical,
  hasToneMarks,
} from "../../src/utils/pinyinConversion";

describe("diacriticalToNumbered", () => {
  it("converts standard multi-syllable pinyin", () => {
    expect(diacriticalToNumbered("xǐhuān")).toBe("xi3huan1");
  });

  it("converts a single syllable", () => {
    expect(diacriticalToNumbered("rén")).toBe("ren2");
  });

  it("converts ü to v in output", () => {
    expect(diacriticalToNumbered("nǚ")).toBe("nv3");
  });

  it("passes through neutral tone without adding a digit", () => {
    expect(diacriticalToNumbered("de")).toBe("de");
  });

  it("converts multi-syllable with different tones", () => {
    expect(diacriticalToNumbered("zhōngguó")).toBe("zhong1guo2");
  });

  it("returns empty string for empty input", () => {
    expect(diacriticalToNumbered("")).toBe("");
  });
});

describe("numberedToDiacritical", () => {
  it("converts standard multi-syllable numbered pinyin", () => {
    expect(numberedToDiacritical("xi3huan1")).toBe("xǐhuān");
  });

  it("converts a single syllable", () => {
    expect(numberedToDiacritical("ren2")).toBe("rén");
  });

  it("converts v to ü with tone", () => {
    expect(numberedToDiacritical("nv3")).toBe("nǚ");
  });

  it("passes through neutral tone without digit", () => {
    expect(numberedToDiacritical("de")).toBe("de");
  });

  it("treats explicit tone 5 as neutral", () => {
    expect(numberedToDiacritical("de5")).toBe("de");
  });

  it("converts multi-syllable with different tones", () => {
    expect(numberedToDiacritical("zhong1guo2")).toBe("zhōngguó");
  });

  it("places tone on 'a' (rule 1)", () => {
    expect(numberedToDiacritical("hao3")).toBe("hǎo");
  });

  it("places tone on 'e' (rule 1)", () => {
    expect(numberedToDiacritical("mei2")).toBe("méi");
  });

  it("places tone on 'o' in 'ou' (rule 2)", () => {
    expect(numberedToDiacritical("gou3")).toBe("gǒu");
  });

  it("places tone on last vowel (rule 3)", () => {
    expect(numberedToDiacritical("gui4")).toBe("guì");
  });

  it("passes through already-diacritical input", () => {
    expect(numberedToDiacritical("xǐhuān")).toBe("xǐhuān");
  });

  it("returns empty string for empty input", () => {
    expect(numberedToDiacritical("")).toBe("");
  });
});

describe("hasToneMarks", () => {
  it("returns true for diacritical pinyin", () => {
    expect(hasToneMarks("xǐhuān")).toBe(true);
  });

  it("returns false for numbered pinyin", () => {
    expect(hasToneMarks("xi3huan1")).toBe(false);
  });

  it("returns false for neutral tone (no marks)", () => {
    expect(hasToneMarks("de")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(hasToneMarks("")).toBe(false);
  });
});
