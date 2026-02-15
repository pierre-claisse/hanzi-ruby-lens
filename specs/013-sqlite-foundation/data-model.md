# Data Model: SQLite Foundation

**Feature**: 013-sqlite-foundation | **Date**: 2026-02-15

## Domain Types (Rust — mirrors TypeScript)

### Word

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Word {
    pub characters: String,
    pub pinyin: String,
}
```

### TextSegment

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TextSegment {
    #[serde(rename = "word")]
    Word { word: Word },
    #[serde(rename = "plain")]
    Plain { text: String },
}
```

Uses serde's internally tagged enum representation to match the TypeScript discriminated union (`{ type: "word", word: {...} }` / `{ type: "plain", text: "..." }`).

### Text

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Text {
    pub raw_input: String,
    pub segments: Vec<TextSegment>,
}
```

`rename_all = "camelCase"` ensures the JSON wire format uses `rawInput` (matching TypeScript convention) while Rust code uses `raw_input`.

## TypeScript Type Update

```typescript
export interface Text {
  rawInput?: string;    // NEW — optional for backward compatibility
  segments: TextSegment[];
}
```

`rawInput` is optional so existing test fixtures and the sample text don't need changes. The Rust backend always includes it (empty string for sample fallback).

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS texts (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    raw_input TEXT NOT NULL DEFAULT '',
    segments TEXT NOT NULL DEFAULT '[]'
);
```

### Design Decisions

| Column | Type | Notes |
|--------|------|-------|
| `id` | `INTEGER PRIMARY KEY` | Always 1. `CHECK (id = 1)` enforces single-Text invariant at DB level. |
| `raw_input` | `TEXT NOT NULL` | The original Chinese text as entered by the user. Empty string for sample/fallback. |
| `segments` | `TEXT NOT NULL` | JSON array of TextSegment objects. Serde serializes the tagged union naturally. |

### Invariants

- **Single-row constraint**: Only one row can exist (`CHECK (id = 1)`). Attempting to insert a second row with a different id fails at the DB level.
- **Atomic replacement**: Save operations use `DELETE + INSERT` inside a transaction. Either the full new Text is stored, or the old one remains.
- **No NULLs**: Both `raw_input` and `segments` have NOT NULL + DEFAULT. The database never contains ambiguous state.

### JSON Wire Format (segments column)

```json
[
  { "type": "word", "word": { "characters": "你好", "pinyin": "nǐhǎo" } },
  { "type": "plain", "text": "，" },
  { "type": "word", "word": { "characters": "世界", "pinyin": "shìjiè" } }
]
```

This is the exact format produced by `serde_json::to_string(&segments)` for `Vec<TextSegment>` and consumed by `serde_json::from_str` on load. It matches the TypeScript `TextSegment[]` shape.

## Entity Relationships

```
Text (aggregate root)
├── raw_input: String
└── segments: Vec<TextSegment>
    ├── Word { word: Word }
    │   ├── characters: String
    │   └── pinyin: String
    └── Plain { text: String }
```

Single aggregate, no relationships to other entities. Text is the only persisted entity in this feature.

## State Transitions

```
[No Database] → first launch → [Database Created, Empty Table]
[Empty Table] → load → returns None → [App shows sampleText]
[Empty Table] → save(text) → [Table has 1 row]
[Has Row] → load → returns Some(text)
[Has Row] → save(new_text) → [Row replaced atomically]
[Corrupted DB] → load fails → [App shows sampleText, logs error]
```
