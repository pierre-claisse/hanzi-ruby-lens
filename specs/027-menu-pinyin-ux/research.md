# Research: Adaptive Menu Positioning & Numbered Pinyin Input

**Feature**: 027-menu-pinyin-ux
**Date**: 2026-02-24

## Decision 1: Pinyin Tone Conversion Approach

**Decision**: Implement two pure TypeScript utility functions (`diacriticalToNumbered` and `numberedToDiacritical`) operating on the full concatenated pinyin string of a Word.

**Rationale**: The existing `tokenize_pinyin` in Rust already solves syllable tokenization with a greedy longest-match against ~400 valid syllables. The TypeScript conversion needs the same tokenization approach for concatenated numbered input (e.g., "zhong1guo2"). For diacritical-to-numbered, no tokenization is needed — iterate characters, detect tone marks, and append the tone number at the end of each syllable boundary.

**Alternatives considered**:
- Per-syllable conversion (requires tokenizing first, then converting each): Rejected — adds complexity; the conversion can work character-by-character for diacritical→numbered, and with a simple regex split for numbered→diacritical (digits 1-5 are natural syllable terminators).
- Rust backend conversion: Rejected per clarification — keeps IPC contract unchanged, avoids new Tauri commands.

## Decision 2: Numbered Pinyin Tokenization Strategy

**Decision**: For numbered→diacritical conversion on concatenated input, split on tone digits (1-5) as syllable boundaries. Each digit terminates its syllable.

**Rationale**: In numbered format, tone digits are unambiguous syllable terminators (e.g., "zhong1guo2" splits at "1" and "2"). No greedy longest-match needed. Trailing text after the last digit (if any) is a neutral-tone syllable.

**Alternatives considered**:
- Port the Rust PINYIN_SYLLABLES table to TypeScript: Rejected — unnecessary complexity; digit-based splitting is simpler and correct for numbered input.
- Use space-separated input only: Rejected — user types concatenated numbered pinyin (standard practice).

## Decision 3: Diacritical-to-Numbered Conversion Strategy

**Decision**: Iterate character-by-character. When a tone-marked vowel is found, record its tone number and replace with the plain vowel. Emit the tone number at the next consonant boundary or end-of-string.

**Rationale**: Diacritical pinyin has exactly one tone mark per syllable (or none for neutral tone). The tone mark's position uniquely identifies both the vowel and the tone. No syllable table lookup needed.

**Alternatives considered**:
- Regex-based approach: Viable but less readable for the boundary detection logic.

## Decision 4: Menu Positioning Logic

**Decision**: Compare word's vertical center (`getBoundingClientRect().top + height/2`) against viewport midpoint (`window.innerHeight / 2`). If word center > viewport midpoint, position menu above; otherwise below.

**Rationale**: Uses live viewport dimensions (handles resize). The word's bounding rect is already available from `wordRefs`. The existing `getMenuPosition` callback in TextDisplay.tsx is the single place to modify.

**Alternatives considered**:
- Check available space below vs menu height: Requires knowing menu height before rendering (needs ref measurement or hardcoded height). Rejected — viewport midpoint heuristic is simpler and sufficient.
- Intersection Observer: Over-engineered for a simple position check.

## Decision 5: "v" ↔ "ü" Normalization

**Decision**: In numbered→diacritical conversion, replace "v" with "ü" before applying tone marks. In diacritical→numbered conversion, replace "ü" with "v" in the output.

**Rationale**: Standard keyboard pinyin input convention. The app's existing Rust code maps ǖǘǚǜ → "v" in `strip_tone_marks`, confirming "v" is the ASCII representation used internally.

## Decision 6: Detecting Already-Diacritical Input (FR-010)

**Decision**: Before numbered→diacritical conversion, check if the input contains any Unicode tone mark characters (ā á ǎ à etc.). If yes, skip conversion and pass through as-is.

**Rationale**: Prevents double-conversion when users paste diacritical pinyin. Simple regex check: `/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/`.
