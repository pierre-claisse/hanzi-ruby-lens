# Data Model: Paranoid Pinyin Pipeline

**Feature**: 023-paranoid-pinyin-pipeline
**Date**: 2026-02-22

## Domain Entities (Unchanged)

No changes to the domain model. The existing entities remain exactly as defined in the constitution and previous feature:

### Word (Value Object)

| Field      | Type   | Description                                      |
|------------|--------|--------------------------------------------------|
| characters | String | One or more Chinese characters                   |
| pinyin     | String | Concatenated tone-marked pinyin, lowercase, no spaces |

### TextSegment (Enum)

| Variant | Fields      | Description                           |
|---------|-------------|---------------------------------------|
| Word    | word: Word  | Chinese characters with pinyin        |
| Plain   | text: String| Non-Chinese content (punctuation, numbers, Latin text) |

### Text (Aggregate Root)

| Field     | Type              | Description                     |
|-----------|-------------------|---------------------------------|
| raw_input | String            | Original user input, immutable  |
| segments  | Vec\<TextSegment\>| Processed segments              |

## Internal Processing Types (New)

These types are internal to the processing module and not exposed to the frontend.

### Validation Result (Conceptual)

The validation pipeline produces an accept/reject decision for each CC-CEDICT entry:

```
Entry validation = syllable_count_matches AND all_syllables_cross_validated
```

- **syllable_count_matches**: `pinyin_marks.split_whitespace().count() == word.chars().filter(is_chinese).count()`
- **all_syllables_cross_validated**: For each (char, syllable) pair, `syllable ∈ char.to_pinyin_multi()`

### Segmentation Score (Conceptual)

The dual segmentation produces a score for each candidate:

```
score = count of words where query_by_chinese(word) is non-empty
```

Higher score = more words recognized by the dictionary = preferred segmentation.

## Data Flow

```
Raw Input (String)
    │
    ├─→ is_chinese_char() filter → CJK runs / Plain runs
    │
    ├─→ segment_chinese_run(run)
    │   ├─→ jieba.cut(run, false) → words_precise → score
    │   ├─→ jieba.cut(run, true)  → words_hmm    → score
    │   └─→ pick higher score (prefer precise on tie)
    │
    ├─→ lookup_pinyin_paranoid(word) for each word
    │   ├─→ TIER 1: CC-CEDICT word-level (iterate all entries, validate each)
    │   ├─→ TIER 2: CC-CEDICT char-by-char (validate each char)
    │   ├─→ TIER 3: pinyin crate default reading
    │   └─→ TIER 4: identity fallback (char itself)
    │
    └─→ Vec<TextSegment>
```

## Invariants

1. **Syllable-character parity**: For every Word, the number of pinyin syllables MUST equal the number of CJK characters
2. **Lossless reconstruction**: Concatenating all segment text MUST equal original input
3. **Non-empty pinyin**: Every Word MUST have non-empty pinyin
4. **Lowercase output**: All pinyin MUST be lowercase with tone diacritics
