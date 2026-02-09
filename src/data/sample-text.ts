import type { Text } from "../types/domain";

/**
 * Hardcoded sample Text for visual testing.
 *
 * Covers all rendering paths:
 * (a) Standard multi-character Words
 * (b) Single-character Words
 * (c) Non-Word content (Chinese punctuation, spaces, numbers)
 * (d) Long-pinyin stress cases (adjacent for visual comparison)
 */
export const sampleText: Text = {
  segments: [
    // Opening sentence: mix of single + multi-character Words
    { type: "word", word: { characters: "我", pinyin: "wǒ" } },
    { type: "word", word: { characters: "現在", pinyin: "xiànzài" } },
    { type: "word", word: { characters: "覺得", pinyin: "juéde" } },
    { type: "word", word: { characters: "學習", pinyin: "xuéxí" } },
    { type: "word", word: { characters: "知識", pinyin: "zhīshì" } },
    { type: "word", word: { characters: "是", pinyin: "shì" } },
    { type: "word", word: { characters: "很", pinyin: "hěn" } },
    { type: "word", word: { characters: "重要", pinyin: "zhòngyào" } },
    { type: "word", word: { characters: "的", pinyin: "de" } },
    { type: "plain", text: "。" },

    // Second sentence with numbers and punctuation
    { type: "word", word: { characters: "每", pinyin: "měi" } },
    { type: "word", word: { characters: "天", pinyin: "tiān" } },
    { type: "word", word: { characters: "閱讀", pinyin: "yuèdú" } },
    { type: "plain", text: " 30 " },
    { type: "word", word: { characters: "分鐘", pinyin: "fēnzhōng" } },
    { type: "plain", text: "，" },
    { type: "word", word: { characters: "可以", pinyin: "kěyǐ" } },
    { type: "word", word: { characters: "增長", pinyin: "zēngzhǎng" } },
    { type: "word", word: { characters: "見識", pinyin: "jiànshì" } },
    { type: "plain", text: "！" },

    // Long-pinyin stress progression — adjacent for visual comparison
    { type: "word", word: { characters: "這些", pinyin: "zhèxiē" } },
    { type: "word", word: { characters: "裝飾", pinyin: "zhuāngshì" } },
    { type: "word", word: { characters: "和", pinyin: "hé" } },
    { type: "word", word: { characters: "裝飾品", pinyin: "zhuāngshìpǐn" } },
    { type: "word", word: { characters: "都", pinyin: "dōu" } },
    { type: "word", word: { characters: "很", pinyin: "hěn" } },
    { type: "word", word: { characters: "漂亮", pinyin: "piàoliang" } },
    { type: "plain", text: "。" },
    { type: "word", word: { characters: "他", pinyin: "tā" } },
    { type: "word", word: { characters: "喜歡", pinyin: "xǐhuān" } },
    { type: "word", word: { characters: "乘風破浪", pinyin: "chéngfēngpòlàng" } },
    { type: "plain", text: "，" },
    { type: "word", word: { characters: "勇往直前", pinyin: "yǒngwǎngzhíqián" } },
    { type: "plain", text: "。" },
  ],
};
