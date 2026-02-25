# Data Model: Timestamps, Sort Persistence & System Theme

**Feature Branch**: `030-timestamps-sort-theme`
**Date**: 2026-02-25

## Entity Changes

### Text (modified)

| Field | Type | Nullable | Change |
|-------|------|----------|--------|
| id | INTEGER | No | Existing |
| title | TEXT | No | Existing |
| created_at | TEXT (ISO 8601) | No | Existing — already includes time |
| raw_input | TEXT | No | Existing |
| segments | TEXT (JSON) | No | Existing |
| modified_at | TEXT (ISO 8601) | Yes | **NEW** — NULL if never modified |

**Schema migration**: `ALTER TABLE texts ADD COLUMN modified_at TEXT` in `initialize()`.

**Invariants**:
- `modified_at` is NULL until the first correction operation (pinyin update, split, or merge).
- `modified_at` is updated to `Local::now().format("%Y-%m-%dT%H:%M:%S")` on each correction.
- `modified_at` is never reset to NULL once set.

### TextPreview / TextPreviewWithTags (modified)

**Rust struct** (`domain.rs`):
```rust
pub struct TextPreviewWithTags {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,  // NEW
    pub tags: Vec<TagSummary>,
}
```

**TypeScript interface** (`domain.ts`):
```typescript
export interface TextPreview {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string | null;  // NEW
  tags: Tag[];
}
```

### Sort Preference (new — localStorage only)

| Key | Storage | Type | Default |
|-----|---------|------|---------|
| `sortAsc` | localStorage | `"true"` / `"false"` string | `"false"` (descending) |

Not a database entity — UI preference only.

### Theme (removed from persistence)

The `"theme"` localStorage key is **removed**. Theme is determined at runtime from the OS via `window.matchMedia("(prefers-color-scheme: dark)")`.

## Database Operations Affected

### Reads
- `list_all_texts()`: SELECT must now include `modified_at` column.
- `load_text()`: Must include `modified_at` in the loaded `Text` struct.

### Writes (existing operations modified)
- `update_segments()`: After updating segments, SET `modified_at = current_timestamp`.
- `split_segment_db()`: After splitting, SET `modified_at = current_timestamp`.
- `merge_segments_db()`: After merging, SET `modified_at = current_timestamp`.

### No change
- `insert_text()`: New texts have `modified_at = NULL` (never modified yet).
- `delete_text()`: No timestamp concern on deletion.
- Tag operations: Do not affect `modified_at`.
