# Data Model: Ruby Text Display

**Feature**: 002-ruby-text-display
**Date**: 2026-02-09

## Overview

This feature uses hardcoded data with no persistence. The data model
defines TypeScript types that match the constitutional Domain Language
definitions for Text and Word. These types will be reused by future
features that add persistence and LLM integration.

## Entities

### Word

An ordered segment of a Text. Constitutional definition: one or more
Chinese characters and exactly one pinyin string as a single unit.

| Field       | Type     | Constraints                            |
|-------------|----------|----------------------------------------|
| `characters`| `string` | One or more Chinese characters. Non-empty. |
| `pinyin`    | `string` | Single pinyin unit for the whole Word (e.g., "xiànzài"). Non-empty. |

**Validation rules**:
- `characters` MUST contain at least one character.
- `pinyin` MUST contain at least one character.
- A Chinese character MUST NOT exist as an independent entity (per
  constitution). Characters are the string content of `characters`.

**TypeScript representation**:
```typescript
interface Word {
  characters: string;
  pinyin: string;
}
```

### Text

The complete body of Chinese content. Constitutional definition: the
aggregate root holding exactly one Text in the current release cycle.

For this feature, a Text is a sequence of **segments** — either Words
(with ruby annotations) or plain strings (punctuation, spaces, numbers
rendered without annotation).

| Field      | Type              | Constraints                         |
|------------|-------------------|-------------------------------------|
| `segments` | `TextSegment[]`   | Ordered sequence of Words and plain strings. |

A `TextSegment` is a discriminated union:
- `{ type: "word", word: Word }` — a Word with ruby annotation
- `{ type: "plain", text: string }` — non-Word content (punctuation
  including Chinese punctuation, spaces, numbers)

**TypeScript representation**:
```typescript
type TextSegment =
  | { type: "word"; word: Word }
  | { type: "plain"; text: string };

interface Text {
  segments: TextSegment[];
}
```

## Relationships

```
Text (1) ──contains──▶ TextSegment (N, ordered)
                          ├── Word (with ruby)
                          └── plain string (no ruby)
```

## State Transitions

None. This feature is read-only with hardcoded data. No mutations, no
events, no commands.

## Notes

- The `TextSegment` discriminated union cleanly separates Words (with
  ruby annotations) from non-Word content (punctuation — including Chinese
  punctuation like 。，！？ — spaces, numbers). This maps directly to
  FR-004. The distinction is Word vs non-Word, not Chinese vs non-Chinese.
- Future features may replace the hardcoded `Text` with a persistent
  entity backed by SQLite, but the `Word` and `Text` type shapes will
  remain stable.
- No `id` fields are needed in this feature (no persistence, no mutation).
  Future features will add identifiers as needed.
