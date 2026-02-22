# Data Model: Native Pinyin Processing

**Feature Branch**: `023-native-pinyin-processing`
**Date**: 2026-02-22

## Domain Entities (Unchanged)

This feature does **not** modify any domain entities. The existing data model remains intact:

### Text (Aggregate Root)

| Field | Type | Description |
|-------|------|-------------|
| raw_input | String | The original Chinese text entered by the user |
| segments | Vec\<TextSegment\> | Ordered list of processed segments |

### TextSegment (Enum)

| Variant | Fields | Description |
|---------|--------|-------------|
| Word | word: Word | A Chinese word with pinyin annotation |
| Plain | text: String | Non-Chinese content (punctuation, numbers, Latin text) |

### Word (Value Object)

| Field | Type | Description |
|-------|------|-------------|
| characters | String | One or more Chinese characters forming a lexical unit |
| pinyin | String | Concatenated pinyin with tone marks (e.g., "xiànzài") |

## Processing Pipeline (New — replaces LLM pipeline)

The processing pipeline transforms a raw Chinese string into `Vec<TextSegment>`. The pipeline has three stages:

### Stage 1: Segmentation

**Input**: Raw Chinese text string
**Output**: Ordered list of token strings

The segmenter splits input into tokens, preserving order and every character:
- Chinese character sequences → passed to jieba-rs word segmentation
- Non-Chinese sequences (punctuation, whitespace, numbers, Latin text) → emitted as-is

### Stage 2: Pinyin Lookup

**Input**: A segmented Chinese word (one token from Stage 1)
**Output**: Concatenated pinyin string with tone marks

Two-layer lookup:
1. **CC-CEDICT word lookup** (primary): Look up the entire word. If found, use `pinyin_marks` with spaces stripped (e.g., "shuì jiào" → "shuìjiào").
2. **Character-level fallback**: If word not in CC-CEDICT, map each character individually via the `pinyin` crate's `ToPinyin` trait, concatenate results.

### Stage 3: Assembly

**Input**: Tokens from Stage 1, pinyin from Stage 2
**Output**: `Vec<TextSegment>`

For each token:
- If it contains Chinese characters → `TextSegment::Word { word: Word { characters, pinyin } }`
- If it contains only non-Chinese content → `TextSegment::Plain { text }`

## Serialization Format

No changes. The JSON serialization format over IPC remains identical:

```json
[
  { "type": "word", "word": { "characters": "今天", "pinyin": "jīntiān" } },
  { "type": "plain", "text": "，" },
  { "type": "word", "word": { "characters": "天氣", "pinyin": "tiānqì" } }
]
```

## Database Schema

No changes. The existing SQLite schema continues to store Text entities as before.
