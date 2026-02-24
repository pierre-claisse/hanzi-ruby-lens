// Bidirectional pinyin tone conversion: diacritical ↔ numbered format.
// Storage format is always diacritical; numbered is UI-only (edit input).

/** Map from tone-marked vowel → [plain vowel, tone number] */
const DIACRITICAL_TO_PLAIN: Record<string, [string, number]> = {
  "ā": ["a", 1], "á": ["a", 2], "ǎ": ["a", 3], "à": ["a", 4],
  "ē": ["e", 1], "é": ["e", 2], "ě": ["e", 3], "è": ["e", 4],
  "ī": ["i", 1], "í": ["i", 2], "ǐ": ["i", 3], "ì": ["i", 4],
  "ō": ["o", 1], "ó": ["o", 2], "ǒ": ["o", 3], "ò": ["o", 4],
  "ū": ["u", 1], "ú": ["u", 2], "ǔ": ["u", 3], "ù": ["u", 4],
  "ǖ": ["ü", 1], "ǘ": ["ü", 2], "ǚ": ["ü", 3], "ǜ": ["ü", 4],
};

/** Map from plain vowel + tone number → tone-marked vowel */
const PLAIN_TO_DIACRITICAL: Record<string, Record<number, string>> = {
  a: { 1: "ā", 2: "á", 3: "ǎ", 4: "à" },
  e: { 1: "ē", 2: "é", 3: "ě", 4: "è" },
  i: { 1: "ī", 2: "í", 3: "ǐ", 4: "ì" },
  o: { 1: "ō", 2: "ó", 3: "ǒ", 4: "ò" },
  u: { 1: "ū", 2: "ú", 3: "ǔ", 4: "ù" },
  ü: { 1: "ǖ", 2: "ǘ", 3: "ǚ", 4: "ǜ" },
};

const TONE_MARK_REGEX = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;

/** Returns true if the string contains any Unicode tone-marked vowels. */
export function hasToneMarks(pinyin: string): boolean {
  return TONE_MARK_REGEX.test(pinyin);
}

/**
 * Convert diacritical pinyin to numbered format.
 * "xǐhuān" → "xi3huan1"
 * Neutral tone syllables pass through without a digit.
 * ü → v in output.
 *
 * Strategy: First pass replaces each tone-marked vowel with its plain form
 * and records its position + tone. Second pass inserts tone digits at syllable
 * ends (after the vowel cluster and any coda consonants n/ng/r).
 */
export function diacriticalToNumbered(pinyin: string): string {
  if (!pinyin) return "";

  // First pass: strip tone marks, record positions
  const chars: string[] = [];
  const toneAt: Map<number, number> = new Map(); // index → tone number

  for (const ch of pinyin) {
    const mapping = DIACRITICAL_TO_PLAIN[ch];
    if (mapping) {
      const [plain, tone] = mapping;
      toneAt.set(chars.length, tone);
      chars.push(plain === "ü" ? "v" : plain);
    } else {
      chars.push(ch === "ü" ? "v" : ch);
    }
  }

  if (toneAt.size === 0) {
    // No tone marks at all — return the ü→v converted string
    return chars.join("");
  }

  // Second pass: for each tone mark, find the syllable end and insert the digit.
  // Syllable end = after the last char that's part of the same syllable's final.
  // Valid codas after the vowel cluster: n (if not followed by vowel), ng, r.
  // We process tones in reverse order to avoid index shifting.
  const tonePositions = [...toneAt.entries()].sort((a, b) => b[0] - a[0]);

  for (const [pos, tone] of tonePositions) {
    // Scan forward from the tone-marked vowel to find syllable end
    let end = pos + 1;
    const len = chars.length;

    // Continue through remaining vowels in the cluster
    while (end < len && isVowelChar(chars[end])) {
      end++;
    }

    // Check for coda consonants: n, ng, r
    if (end < len) {
      if (chars[end] === "r" && (end + 1 >= len || !isVowelChar(chars[end + 1]))) {
        end++;
      } else if (chars[end] === "n") {
        if (end + 1 < len && chars[end + 1] === "g") {
          // "ng" coda — but only if not followed by a vowel
          if (end + 2 >= len || !isVowelChar(chars[end + 2])) {
            end += 2;
          }
        } else if (end + 1 >= len || !isVowelChar(chars[end + 1])) {
          // "n" coda (not followed by vowel)
          end++;
        }
      }
    }

    // Insert tone digit at the syllable end
    chars.splice(end, 0, String(tone));
  }

  return chars.join("");
}

function isVowelChar(ch: string): boolean {
  return "aeiouüv".includes(ch.toLowerCase());
}

const VOWELS = "aeiouü";

/**
 * Find which vowel in a syllable should receive the tone mark.
 * Rules: (1) a or e always gets the mark; (2) in "ou", o gets it;
 * (3) otherwise the last vowel gets it.
 */
function findToneVowelIndex(syllable: string): number {
  const lower = syllable.toLowerCase();

  // Rule 1: a or e always takes the mark
  for (let i = 0; i < lower.length; i++) {
    if (lower[i] === "a" || lower[i] === "e") return i;
  }

  // Rule 2: in "ou", o takes the mark
  const ouIndex = lower.indexOf("ou");
  if (ouIndex !== -1) return ouIndex;

  // Rule 3: last vowel
  for (let i = lower.length - 1; i >= 0; i--) {
    if (VOWELS.includes(lower[i])) return i;
  }

  return -1;
}

/**
 * Apply a tone mark to a syllable string.
 */
function applyTone(syllable: string, tone: number): string {
  if (tone === 0 || tone === 5) return syllable;

  const idx = findToneVowelIndex(syllable);
  if (idx === -1) return syllable;

  const vowel = syllable[idx];
  const marked = PLAIN_TO_DIACRITICAL[vowel]?.[tone];
  if (!marked) return syllable;

  return syllable.slice(0, idx) + marked + syllable.slice(idx + 1);
}

/**
 * Convert numbered pinyin to diacritical format.
 * "xi3huan1" → "xǐhuān"
 * Already-diacritical input passes through unchanged (FR-010).
 * "v" → "ü" before tone application (FR-009).
 * Tone 5 or no digit = neutral tone (FR-011, FR-012).
 */
export function numberedToDiacritical(pinyin: string): string {
  if (!pinyin) return "";
  if (hasToneMarks(pinyin)) return pinyin;

  // Split on tone digits: each digit 1-5 terminates its syllable.
  // e.g. "zhong1guo2" → ["zhong", "1", "guo", "2"]
  const parts = pinyin.split(/([1-5])/);
  let result = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Check if this part is a tone digit
    if (/^[1-5]$/.test(part)) {
      // Already consumed by previous iteration
      continue;
    }

    // This is a syllable; check if the next part is a tone digit
    const tone = (i + 1 < parts.length && /^[1-5]$/.test(parts[i + 1]))
      ? parseInt(parts[i + 1], 10)
      : 0;

    if (tone > 0) {
      i++; // consume the digit part
    }

    // Replace v → ü before tone application
    const syllable = part.replace(/v/g, "ü");
    result += applyTone(syllable, tone);
  }

  return result;
}
