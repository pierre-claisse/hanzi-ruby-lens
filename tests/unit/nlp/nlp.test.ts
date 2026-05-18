import { describe, it, expect } from "vitest";
import {
  isChineseChar,
  isChineseCharStr,
  tokenizePinyin,
  pinyinForWord,
  processText,
  containsChineseChar,
} from "../../../src/nlp";

describe("isChineseChar", () => {
  it("recognises common CJK characters", () => {
    for (const ch of ["你", "好", "世", "界", "中", "国"]) {
      expect(isChineseCharStr(ch)).toBe(true);
    }
  });

  it("rejects non-CJK characters", () => {
    for (const ch of ["a", "Z", "0", "，", " ", "ー", "。"]) {
      expect(isChineseCharStr(ch)).toBe(false);
    }
  });

  it("accepts CJK Extension A characters", () => {
    // Code points in the 0x3400-0x4DBF range
    expect(isChineseChar(0x3400)).toBe(true);
    expect(isChineseChar(0x4dbf)).toBe(true);
  });
});

describe("tokenizePinyin", () => {
  it("splits 'nǐhǎo' into ['nǐ','hǎo']", () => {
    expect(tokenizePinyin("nǐhǎo", 2)).toEqual(["nǐ", "hǎo"]);
  });

  it("splits 'xiànzài' into ['xiàn','zài']", () => {
    expect(tokenizePinyin("xiànzài", 2)).toEqual(["xiàn", "zài"]);
  });

  it("splits 'fǎguórén' into ['fǎ','guó','rén']", () => {
    expect(tokenizePinyin("fǎguórén", 3)).toEqual(["fǎ", "guó", "rén"]);
  });

  it("handles a single syllable", () => {
    expect(tokenizePinyin("rén", 1)).toEqual(["rén"]);
  });

  it("handles the standalone 'er' syllable", () => {
    expect(tokenizePinyin("èr", 1)).toEqual(["èr"]);
  });

  it("rejects an empty pinyin string", () => {
    expect(() => tokenizePinyin("", 1)).toThrow(/Cannot split/);
  });

  it("rejects an incorrect expected count", () => {
    expect(() => tokenizePinyin("nǐhǎo", 3)).toThrow(/Cannot split/);
  });

  it("rejects unsplittable input", () => {
    expect(() => tokenizePinyin("xyz", 1)).toThrow(/Cannot split/);
  });
});

describe("containsChineseChar", () => {
  it("detects a single Chinese character", () => {
    expect(containsChineseChar("Hello 世界")).toBe(true);
  });

  it("returns false for pure ASCII", () => {
    expect(containsChineseChar("just english")).toBe(false);
  });
});

describe("processText (end-to-end with jieba-wasm + pinyin-pro)", () => {
  it("returns an empty array for empty input", async () => {
    expect(await processText("")).toEqual([]);
  });

  it("alternates Chinese words and punctuation", async () => {
    const segments = await processText("你好，世界！");
    // We don't pin to a specific segmentation (it depends on jieba's
    // dictionary), but we know there must be at least one word + one plain
    // segment, the words must have non-empty pinyin, and the plain run must
    // be "，" or "，世界！" etc.
    expect(segments.length).toBeGreaterThan(0);
    const words = segments.filter((s) => s.type === "word");
    expect(words.length).toBeGreaterThan(0);
    for (const seg of words) {
      if (seg.type !== "word") throw new Error("unreachable");
      expect(seg.word.characters.length).toBeGreaterThan(0);
      expect(seg.word.pinyin.length).toBeGreaterThan(0);
    }
    const joined = segments
      .map((s) => (s.type === "word" ? s.word.characters : s.text))
      .join("");
    expect(joined).toBe("你好，世界！");
  });

  it("preserves the raw input order character by character", async () => {
    const input = "今天天氣很好。Hello!";
    const segments = await processText(input);
    const joined = segments
      .map((s) => (s.type === "word" ? s.word.characters : s.text))
      .join("");
    expect(joined).toBe(input);
  });

  it("annotates 你好 with the expected pinyin (nǐhǎo)", async () => {
    const result = pinyinForWord("你好");
    expect(result).toBe("nǐhǎo");
  });
});
