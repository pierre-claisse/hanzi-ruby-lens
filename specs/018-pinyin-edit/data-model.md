# Data Model: Pinyin Edit

**Feature**: 018-pinyin-edit
**Date**: 2026-02-18

## Entities

No new entities are introduced. This feature modifies an existing attribute on an existing entity.

### Word (existing, unchanged)

| Field | Type | Description |
|-------|------|-------------|
| characters | string | One or more Chinese characters |
| pinyin | string | Tone-marked romanization (editable by user) |

**Validation rules**:
- `characters`: Non-empty string (enforced by LLM segmentation)
- `pinyin`: Non-empty string (FR-007: system MUST reject empty pinyin input)

**State transitions**:
- `pinyin` starts with LLM-generated value
- User may edit `pinyin` to any non-empty free-form string (no format validation)
- On Text re-processing, all Word pinyin values are overwritten by new LLM output

### TextSegment (existing, unchanged)

Discriminated union: `{ type: "word", word: Word }` | `{ type: "plain", text: string }`

### Text (existing, unchanged)

| Field | Type | Description |
|-------|------|-------------|
| rawInput | string | Original user input |
| segments | TextSegment[] | Ordered array of words and plain text |

**Persistence**: Single row in `texts` table (id=1). `segments` stored as JSON blob.

## Data Flow for Pinyin Edit

```
1. User selects "Edit Pinyin" on Word at segment index I
2. Frontend reads text.segments[I].word.pinyin (pre-fill input)
3. User types new pinyin, confirms with Enter
4. Frontend: text.segments[I].word.pinyin = newPinyin
5. Frontend: invoke("save_text", { text: mutatedText })
6. Backend: DELETE + INSERT into texts table (full replace)
7. React state updated with new Text object
```

No schema migration needed. No new tables. No new columns.
