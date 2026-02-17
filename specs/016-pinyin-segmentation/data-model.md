# Data Model: Pinyin Segmentation

## Entities

No new entities. This feature uses existing domain model entities from 002 and 013.

### Text (existing — unchanged)

The aggregate root. Single instance in the application.

| Field | Type | Notes |
|-------|------|-------|
| rawInput | String | User's original Chinese text |
| segments | TextSegment[] | Ordered list of Words and plain text |

**State transitions for this feature**:
- `{ rawInput: "...", segments: [] }` → saved but not yet processed
- `{ rawInput: "...", segments: [...] }` → processed, ready for reading

### Word (existing — unchanged)

A value object within TextSegment.

| Field | Type | Notes |
|-------|------|-------|
| characters | String | One or more Chinese characters (e.g., "今天") |
| pinyin | String | Concatenated pinyin for the word (e.g., "jīntiān") |

### TextSegment (existing — unchanged)

Tagged union / discriminated union.

| Variant | Fields | Notes |
|---------|--------|-------|
| word | word: Word | Chinese word with pinyin |
| plain | text: String | Punctuation, whitespace, non-Chinese |

## Schema

No database schema changes. Existing `texts` table stores segments as JSON.

```sql
-- Existing table (013-sqlite-foundation), unchanged
CREATE TABLE IF NOT EXISTS texts (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    raw_input TEXT NOT NULL DEFAULT '',
    segments TEXT NOT NULL DEFAULT '[]'
);
```

## AppView State Machine (modified)

**Before (015)**: `"empty" | "input" | "saved" | "reading"`
**After (016)**: `"empty" | "input" | "processing" | "reading"`

### State Derivation (on app load)

| DB State | Derived View |
|----------|-------------|
| No row (null) | "empty" |
| rawInput exists, segments = [] | "processing" |
| rawInput exists, segments.length > 0 | "reading" |

### State Transitions

```
empty ──[Enter Text]──→ input
input ──[Submit]──→ processing (saves rawInput, starts CLI)
input ──[Cancel]──→ previous view
processing ──[Success]──→ reading (saves segments)
processing ──[Error]──→ processing (shows error + retry)
processing ──[Edit]──→ input (pre-filled)
processing ──[Retry]──→ processing (re-invokes CLI)
reading ──[Edit]──→ input (pre-filled)
input ──[Submit after edit]──→ processing (re-saves rawInput, starts CLI)
```

## Claude CLI Response Structure

The `claude -p --output-format json` command returns:

```json
{
  "type": "result",
  "result": "...",
  "session_id": "...",
  "is_error": false,
  "duration_ms": 12345,
  "structured_output": [
    { "type": "word", "word": { "characters": "今天", "pinyin": "jīntiān" } },
    { "type": "plain", "text": "，" },
    { "type": "word", "word": { "characters": "天氣", "pinyin": "tiānqì" } },
    { "type": "word", "word": { "characters": "很好", "pinyin": "hěnhǎo" } },
    { "type": "plain", "text": "。" }
  ]
}
```

The `structured_output` field contains the validated `TextSegment[]` matching the `--json-schema` provided.

## JSON Schema for --json-schema Flag

```json
{
  "type": "array",
  "items": {
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "type": { "const": "word" },
          "word": {
            "type": "object",
            "properties": {
              "characters": { "type": "string" },
              "pinyin": { "type": "string" }
            },
            "required": ["characters", "pinyin"]
          }
        },
        "required": ["type", "word"]
      },
      {
        "type": "object",
        "properties": {
          "type": { "const": "plain" },
          "text": { "type": "string" }
        },
        "required": ["type", "text"]
      }
    ]
  }
}
```
