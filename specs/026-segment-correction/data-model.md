# Data Model: Segment Correction

**Branch**: `026-segment-correction` | **Date**: 2026-02-24

## Overview

No new entities are introduced. This feature adds mutation operations to the existing `TextSegment` array within a `Text`. The data model remains unchanged; only the operations over it are extended.

## Existing Entities (unchanged)

### Word

```
Word {
  characters: String   // 1–12 Chinese characters
  pinyin: String        // Concatenated pinyin syllables (e.g., "fǎguórén")
}
```

**Invariants**:
- `characters.len()` (in Unicode graphemes) is between 1 and 12 inclusive.
- `pinyin` is non-empty.
- One pinyin syllable per Chinese character, concatenated without separator.

### TextSegment

```
TextSegment =
  | Word { word: Word }
  | Plain { text: String }
```

**Invariants**:
- The concatenation of all segment contents (characters for Word, text for Plain) equals `Text.raw_input`.
- Segment order is stable and determines reading order.

### Text

```
Text {
  id: i64
  title: String
  created_at: String
  raw_input: String      // Immutable raw Chinese content
  segments: [TextSegment] // Mutable segment boundaries
}
```

**Invariants**:
- `raw_input` is never modified after creation.
- `segments` character content always reconstructs `raw_input` exactly.

## Mutation Operations

### Split Segment

**Input**: `text_id`, `segment_index`, `split_after_char_index` (0-based, splits after this character)

**Preconditions**:
- `segment_index` references a `Word` segment.
- `split_after_char_index` is in range `[0, word.characters.len() - 2]` (at least 1 char on each side).
- Pinyin tokenization succeeds: the word's pinyin can be split into exactly `word.characters.len()` syllables.

**Postconditions**:
- The original segment is replaced by two `Word` segments at the same position.
- Left word: `characters[0..=split_after_char_index]`, pinyin = first `split_after_char_index + 1` syllables concatenated.
- Right word: `characters[split_after_char_index+1..]`, pinyin = remaining syllables concatenated.
- All other segments remain unchanged.
- Total segment count increases by 1.
- `raw_input` character content invariant holds.

**Example**:
```
Before: [Word("法國人", "fǎguórén")]
Split after index 0: [Word("法", "fǎ"), Word("國人", "guórén")]
Split after index 1: [Word("法國", "fǎguó"), Word("人", "rén")]
```

### Merge Segments

**Input**: `text_id`, `segment_index` (the left word to merge with its right neighbor)

**Preconditions**:
- `segment_index` references a `Word` segment.
- `segment_index + 1` exists and also references a `Word` segment (no intervening `Plain`).
- Combined character count ≤ 12.

**Postconditions**:
- The two `Word` segments are replaced by a single `Word` segment.
- Merged word: `characters = left.characters + right.characters`, `pinyin = left.pinyin + right.pinyin`.
- All other segments remain unchanged.
- Total segment count decreases by 1.
- `raw_input` character content invariant holds.

**Example**:
```
Before: [Word("法", "fǎ"), Word("國", "guó")]
Merge: [Word("法國", "fǎguó")]
```

## Storage

No schema changes. Segments continue to be stored as a JSON blob in the `texts.segments` column:

```sql
-- Existing schema, unchanged
CREATE TABLE texts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    created_at TEXT    NOT NULL,
    raw_input  TEXT    NOT NULL,
    segments   TEXT    NOT NULL DEFAULT '[]'
);
```

The JSON blob is loaded, deserialized to `Vec<TextSegment>`, mutated in memory, re-serialized, and written back — identical to the existing `update_segments` pattern for pinyin correction.

## Pinyin Syllable Tokenizer

A pure function used during split to partition concatenated pinyin:

```
tokenize_pinyin(pinyin: &str, expected_count: usize) -> Result<Vec<String>, Error>
```

**Input**: A concatenated pinyin string and the expected number of syllables.
**Output**: A vector of individual pinyin syllables preserving original tone marks.
**Algorithm**: Greedy longest-match against the valid pinyin syllable table, with tone mark normalization for matching.
**Failure**: Returns error if syllable count doesn't match `expected_count`.
