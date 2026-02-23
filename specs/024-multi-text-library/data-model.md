# Data Model: Multi-Text Library

**Feature**: 024-multi-text-library
**Date**: 2026-02-23

## Entities

### Text (Aggregate Root)

The complete body of Chinese content entered by the user. Immutable after creation except for pinyin corrections on its Words.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | Integer | Primary key, auto-increment | Stable identity, never reused after deletion |
| title | String | Non-empty, immutable after creation | User-provided display name |
| created_at | String (ISO 8601) | Non-empty, immutable | `YYYY-MM-DDTHH:MM:SS`, local time |
| raw_input | String | At least one Chinese character, immutable | Original user input |
| segments | TextSegment[] | Non-empty after processing | JSON-serialized in SQLite |

**Lifecycle**: Created (with segments populated atomically) → Read → Pinyin corrections → Deleted

**Identity**: `id` is the sole identity. Duplicate titles are allowed.

### TextPreview (Read Projection)

A lightweight view of a Text for library listing. Not a stored entity — a query projection.

| Field | Type | Source |
|-------|------|--------|
| id | Integer | texts.id |
| title | String | texts.title |
| created_at | String (ISO 8601) | texts.created_at |

### Word (Value Object)

An ordered segment of a Text, consisting of one or more Chinese characters and their pinyin.

| Field | Type | Constraints |
|-------|------|-------------|
| characters | String | One or more Chinese characters |
| pinyin | String | Single concatenated toned pinyin string |

**Mutability**: `pinyin` is correctable by the user. `characters` is immutable.

### TextSegment (Value Object)

A discriminated union representing either a Word or a plain text run within a Text.

| Variant | Fields | Notes |
|---------|--------|-------|
| word | word: Word | Chinese content with pinyin |
| plain | text: String | Non-Chinese content (punctuation, whitespace, Latin characters) |

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS texts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    created_at TEXT    NOT NULL,
    raw_input  TEXT    NOT NULL,
    segments   TEXT    NOT NULL DEFAULT '[]'
);
```

**Changes from current schema**:
- Removed `CHECK (id = 1)` singleton constraint
- Added `AUTOINCREMENT` to prevent ID reuse
- Added `title` column (TEXT NOT NULL)
- Added `created_at` column (TEXT NOT NULL, ISO 8601)

## Relationships

```
Text (1) ──contains──▶ (N) TextSegment
TextSegment::Word (1) ──contains──▶ (1) Word
TextPreview ──projects from──▶ Text (id, title, created_at only)
```

## Validation Rules

| Rule | Entity | Enforcement Layer |
|------|--------|-------------------|
| Title must be non-empty | Text | Frontend (input validation) + Backend (NOT NULL) |
| Raw input must contain ≥1 Chinese character | Text | Frontend (submit disabled) + Backend (command validation) |
| Segments must be populated at creation | Text | Backend (atomic process + insert) |
| ID must be positive integer | Text | Database (AUTOINCREMENT) |
| created_at must be valid ISO 8601 | Text | Backend (chrono formatting) |
| Pinyin must be non-empty string | Word | Backend (processing pipeline guarantees) |

## State Transitions

```
[Not Exists] ──create_text(title, raw_input)──▶ [Created]
[Created] ──update_pinyin(id, index, pinyin)──▶ [Created] (pinyin corrected, same state)
[Created] ──delete_text(id)──▶ [Not Exists]
```

There is no intermediate "draft" or "processing" state in the database. A Text either fully exists (with all segments) or does not exist.
