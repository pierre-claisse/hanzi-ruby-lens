# Data Model: Text Lock

## Schema Changes

### `texts` table — add `locked` column

```sql
ALTER TABLE texts ADD COLUMN locked INTEGER NOT NULL DEFAULT 0
```

Migration is idempotent (try ALTER, ignore "duplicate column" error) — same pattern as `modified_at`.

| Column   | Type    | Default | Constraint | Description                    |
|----------|---------|---------|------------|--------------------------------|
| locked   | INTEGER | 0       | NOT NULL   | 0 = unlocked, 1 = locked      |

## Rust Domain Structs

### `Text` (existing — add field)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Text {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,
    pub raw_input: String,
    pub segments: Vec<TextSegment>,
    pub locked: bool,              // NEW
}
```

### `TextPreviewWithTags` (existing — add field)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextPreviewWithTags {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub modified_at: Option<String>,
    pub tags: Vec<TagSummary>,
    pub locked: bool,              // NEW
}
```

## TypeScript Domain Interfaces

### `Text` (existing — add field)

```typescript
export interface Text {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string | null;
  rawInput: string;
  segments: TextSegment[];
  locked: boolean;               // NEW
}
```

### `TextPreview` (existing — add field)

```typescript
export interface TextPreview {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string | null;
  tags: Tag[];
  locked: boolean;               // NEW
}
```

## Tauri Command Contract

### `toggle_lock` (NEW)

```
Command: toggle_lock
Input:   { text_id: i64 }
Output:  Result<bool, AppError>   // returns new locked state
Effect:  UPDATE texts SET locked = NOT locked WHERE id = ?
```

### Modified queries

- `list_all_texts()`: SELECT adds `locked` column, populates `TextPreviewWithTags.locked`
- `load_text_by_id()`: SELECT adds `locked` column, populates `Text.locked`
- `insert_text()`: New texts default to `locked: false` (column default handles it)

## Invariants

- Lock state defaults to `false` (unlocked) for all existing and newly created texts.
- Toggling lock does NOT update `modified_at` — lock is metadata, not a content correction.
- Lock state is purely advisory — it disables UI correction actions but does not add backend enforcement.
