# Data Model: SQL Data Management

**Feature Branch**: `033-sql-data-management`
**Date**: 2026-02-27

## Existing Entities (unchanged)

### Text
| Field | Type | Constraints |
|-------|------|-------------|
| id | integer | primary key, auto-increment |
| title | text | not null |
| created_at | text | not null, ISO 8601 format |
| modified_at | text | nullable, ISO 8601 format |
| raw_input | text | not null |
| segments | text | not null, default '[]', JSON array |
| locked | integer | not null, default 0 (boolean) |

### Tag
| Field | Type | Constraints |
|-------|------|-------------|
| id | integer | primary key, auto-increment |
| label | text | not null, unique (case-insensitive) |
| color | text | not null |

### TextTag (junction)
| Field | Type | Constraints |
|-------|------|-------------|
| text_id | integer | not null, references Text(id) on delete cascade |
| tag_id | integer | not null, references Tag(id) on delete cascade |
| | | primary key (text_id, tag_id) |

## New Entity

### ExportPayload
A transient data structure (not persisted in the database) representing the complete serialized state of the library.

| Field | Type | Constraints |
|-------|------|-------------|
| version | integer | required, currently `1` |
| exported_at | text | required, ISO 8601 timestamp |
| texts | array of Text | all rows from texts table |
| tags | array of Tag | all rows from tags table |
| text_tags | array of TextTag | all rows from text_tags table |

**Validation Rules**:
- `version` must equal `1` (for current schema). Future versions may add migration logic.
- `texts[].id` values must be unique within the array.
- `tags[].id` values must be unique within the array.
- `tags[].label` values must be unique (case-insensitive) within the array.
- Each `text_tags[].text_id` must reference an existing `texts[].id`.
- Each `text_tags[].tag_id` must reference an existing `tags[].id`.
- No duplicate `(text_id, tag_id)` pairs in `text_tags`.

## State Transitions

### Export Flow
```
Library View → Click Export → Native Save Dialog → File Written → Success Message
                                                 → Write Error → Error Message
```

### Import Flow
```
Library View → Click Import → Native Open Dialog → File Selected → Confirm Dialog
  → Confirmed → Validate File → Valid → Transaction (Delete All + Insert All) → Refresh Library
                               → Invalid → Error Message (no data change)
  → Cancelled → No Change
```

### Reset Flow
```
Library View → Click Reset → Confirm Dialog
  → Confirmed → Transaction (Delete All) → Refresh Library (empty state)
  → Cancelled → No Change
```

## Relationships
- ExportPayload is a snapshot: it captures the full state at export time.
- Import replaces the entire database with the ExportPayload contents (total overwrite).
- Reset is equivalent to importing an empty ExportPayload.
