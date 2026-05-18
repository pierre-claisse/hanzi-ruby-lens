// Chinese text processing pipeline. Equivalent to the previous Rust
// `processing::process_text_native`: split the input into alternating
// Chinese runs and plain runs, segment each Chinese run with jieba, and
// annotate every segmented word with its pinyin via pinyin-pro.
//
// The Rust implementation also did a "paranoid" CC-CEDICT lookup with
// cross-validation; pinyin-pro already handles 多音字 disambiguation
// internally, so we don't replicate that layer here.
import { pinyin } from "pinyin-pro";
import type { TextSegment } from "../types/domain";
import { isChineseCharStr } from "./chineseChar";
import { segmentChinese } from "./jieba";

/** Return the pinyin for a single word (no spaces, tone-marked). */
export function pinyinForWord(word: string): string {
  // pinyin-pro returns a space-separated string by default. With
  // `type: "string"` we keep that; we then strip the spaces. `nonZh: "consecutive"`
  // keeps non-Chinese runs untouched. `toneType: "symbol"` produces the
  // diacritical marks (nǐhǎo) that the existing UI expects.
  const result = pinyin(word, {
    type: "string",
    toneType: "symbol",
    nonZh: "consecutive",
    v: false,
  });
  return result.replace(/\s+/g, "");
}

/**
 * Full processing pipeline. Asynchronous because jieba-wasm must be
 * lazily loaded the first time a text is created.
 */
export async function processText(input: string): Promise<TextSegment[]> {
  if (input.length === 0) return [];

  const segments: TextSegment[] = [];
  const chars = [...input];
  let i = 0;

  while (i < chars.length) {
    if (isChineseCharStr(chars[i])) {
      // Collect a Chinese run.
      let run = "";
      while (i < chars.length && isChineseCharStr(chars[i])) {
        run += chars[i];
        i++;
      }
      const words = await segmentChinese(run, true);
      for (const word of words) {
        segments.push({
          type: "word",
          word: { characters: word, pinyin: pinyinForWord(word) },
        });
      }
    } else {
      // Collect a non-Chinese run (punctuation, spaces, latin, …).
      let run = "";
      while (i < chars.length && !isChineseCharStr(chars[i])) {
        run += chars[i];
        i++;
      }
      segments.push({ type: "plain", text: run });
    }
  }

  return segments;
}

/** Guard for `create_text`-style flows: at least one Chinese character. */
export function containsChineseChar(input: string): boolean {
  for (const ch of input) {
    if (isChineseCharStr(ch)) return true;
  }
  return false;
}
