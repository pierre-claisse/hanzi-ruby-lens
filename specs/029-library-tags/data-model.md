# Data Model: Library Tags

**Feature Branch**: `029-library-tags`
**Created**: 2026-02-24

## Entities

### Tag

A label with a color, used to categorize Texts.

| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| label | String | Non-empty, unique (case-insensitive), max 50 characters |
| color | String | Non-empty, must be a valid key from the predefined color palette |

**Invariants**:
- Label uniqueness is enforced case-insensitively (e.g., "Fiction" and "fiction" are duplicates).
- Color is a key string (e.g., `"red"`, `"blue"`) referencing the frontend palette. The database stores the key, not hex values.
- A Tag exists independently — deleting all Texts assigned to it does not delete the Tag.

### Text–Tag Assignment (Junction)

The many-to-many relationship between Texts and Tags.

| Field | Type | Constraints |
|-------|------|-------------|
| text_id | Integer | Foreign key → texts.id, ON DELETE CASCADE |
| tag_id | Integer | Foreign key → tags.id, ON DELETE CASCADE |

**Invariants**:
- Primary key is the composite `(text_id, tag_id)` — prevents duplicates.
- `ON DELETE CASCADE` on both foreign keys: deleting a Text removes all its tag assignments; deleting a Tag removes all its text assignments.

### TextPreview (Extended)

The existing `TextPreview` type is extended to include assigned Tags for library display.

| Field | Type | Notes |
|-------|------|-------|
| id | Integer | Existing |
| title | String | Existing |
| createdAt | String (ISO 8601) | Existing |
| tags | Array of `{ id, label, color }` | NEW — Tags assigned to this Text |

## Relationships

```text
Text (1) ──── (*) text_tags (*) ──── (1) Tag
```

- A Text may have 0..N Tags.
- A Tag may be assigned to 0..N Texts.
- The junction table `text_tags` expresses this many-to-many relationship.

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS text_tags (
    text_id INTEGER NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (text_id, tag_id)
);
```

**Notes**:
- `COLLATE NOCASE` on `label` enforces case-insensitive uniqueness at the database level.
- Foreign keys require `PRAGMA foreign_keys = ON` (must be set per connection, after WAL mode).
- Added to the existing `initialize()` function in `database.rs` alongside the `texts` table creation.

## Rust Domain Types

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TagSummary {
    pub id: i64,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextPreviewWithTags {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub tags: Vec<TagSummary>,
}
```

## TypeScript Domain Types

```typescript
export interface Tag {
  id: number;
  label: string;
  color: string;
}

export interface TextPreview {
  id: number;
  title: string;
  createdAt: string;
  tags: Tag[];  // NEW field
}
```

## Frontend Tag Color Palette

```typescript
// src/data/tagColors.ts
export interface TagColor {
  key: string;
  label: string;
  bg: string;     // background (used as-is in both themes)
  text: string;   // text color for contrast
}

export const TAG_COLORS: readonly TagColor[] = [
  { key: "red",     label: "Red",     bg: "#EF4444", text: "#FFFFFF" },
  { key: "orange",  label: "Orange",  bg: "#F97316", text: "#FFFFFF" },
  { key: "amber",   label: "Amber",   bg: "#F59E0B", text: "#1A1A1A" },
  { key: "green",   label: "Green",   bg: "#22C55E", text: "#FFFFFF" },
  { key: "teal",    label: "Teal",    bg: "#14B8A6", text: "#FFFFFF" },
  { key: "blue",    label: "Blue",    bg: "#3B82F6", text: "#FFFFFF" },
  { key: "indigo",  label: "Indigo",  bg: "#6366F1", text: "#FFFFFF" },
  { key: "purple",  label: "Purple",  bg: "#A855F7", text: "#FFFFFF" },
  { key: "pink",    label: "Pink",    bg: "#EC4899", text: "#FFFFFF" },
  { key: "slate",   label: "Slate",   bg: "#64748B", text: "#FFFFFF" },
] as const;
```
