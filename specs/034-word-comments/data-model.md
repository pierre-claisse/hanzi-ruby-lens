# Data Model: Word Comments

**Feature Branch**: `034-word-comments` | **Date**: 2026-02-27

## Entity Changes

### Word (extended)

The Word entity gains an optional `comment` field. This is stored inline in the segments JSON blob.

**Rust struct**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Word {
    pub characters: String,
    pub pinyin: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,
}
```

**TypeScript interface**:
```typescript
export interface Word {
  characters: string;
  pinyin: string;
  comment?: string;
}
```

**Constraints**:
- `comment` is optional (most Words will not have one)
- Maximum 5000 characters when present
- Empty string is treated as no comment (normalized to `None`/`undefined`)
- Plain text only, no markup

### TextSegment (unchanged)

```typescript
export type TextSegment =
  | { type: "word"; word: Word }
  | { type: "plain"; text: string };
```

The `plain` variant does not support comments (only Word segments do).

### Text (unchanged schema)

No database schema changes. The `segments TEXT` column already stores the full JSON array. Adding an optional field to Word is backward-compatible — existing rows without `comment` fields deserialize correctly (`comment` defaults to `None`/`undefined`).

## Storage Format

### Before (existing Word in segments JSON):
```json
{"type": "word", "word": {"characters": "你好", "pinyin": "nǐhǎo"}}
```

### After (Word with comment):
```json
{"type": "word", "word": {"characters": "你好", "pinyin": "nǐhǎo", "comment": "Common greeting"}}
```

### After (Word without comment — identical to before):
```json
{"type": "word", "word": {"characters": "你好", "pinyin": "nǐhǎo"}}
```

The `skip_serializing_if = "Option::is_none"` annotation ensures no `comment` key is written for Words without comments, maintaining full backward compatibility.

## Invariants

1. A Word MUST have at most one comment.
2. A comment MUST be between 1 and 5000 characters (empty = no comment).
3. A Word with a comment MUST NOT be split.
4. A merge MUST NOT involve any Word that has a comment.
5. Only `type: "word"` segments can have comments; `type: "plain"` segments cannot.

## Export/Import

No changes to the export/import system. Since `ExportText.segments` is stored as a raw JSON `String`, comments are automatically included in exports and restored on imports. Importing a file without comments works seamlessly (the optional field defaults to absent).
