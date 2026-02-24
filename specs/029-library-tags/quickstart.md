# Quickstart: Library Tags

**Feature Branch**: `029-library-tags`
**Quick reference for implementation**

## Commands Summary

### Tag CRUD (Rust → Tauri IPC)

| Command | Parameters | Returns | FR |
|---------|-----------|---------|-----|
| `create_tag` | `label: String, color: String` | `Tag` | FR-001, FR-002, FR-003 |
| `update_tag` | `tag_id: i64, label: String, color: String` | `Tag` | FR-004, FR-005 |
| `delete_tag` | `tag_id: i64` | `()` | FR-006 |
| `list_tags` | — | `Vec<Tag>` | FR-013 |

### Tag Assignment (Rust → Tauri IPC)

| Command | Parameters | Returns | FR |
|---------|-----------|---------|-----|
| `assign_tag` | `text_ids: Vec<i64>, tag_id: i64` | `()` | FR-008, FR-010, FR-011 |
| `remove_tag` | `text_ids: Vec<i64>, tag_id: i64` | `()` | FR-009, FR-010 |

### Filtered Listing (Rust → Tauri IPC)

| Command | Parameters | Returns | FR |
|---------|-----------|---------|-----|
| `list_texts` | `tag_ids: Vec<i64>, sort_asc: bool` | `Vec<TextPreviewWithTags>` | FR-015, FR-018, FR-020 |

**Note**: `list_texts` replaces the current parameterless version. When `tag_ids` is empty, returns all texts (FR-016). `sort_asc` defaults to `false` (descending, FR-019).

## Database Operations

### Initialize (add to existing `initialize()`)

```sql
PRAGMA foreign_keys = ON;

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

### Filtered Query Pattern

```sql
-- When tag_ids is empty: all texts
SELECT t.id, t.title, t.created_at FROM texts t
ORDER BY t.created_at DESC;

-- When tag_ids is non-empty: filtered
SELECT DISTINCT t.id, t.title, t.created_at
FROM texts t
INNER JOIN text_tags tt ON t.id = tt.text_id
WHERE tt.tag_id IN (?, ?, ?)
ORDER BY t.created_at DESC;
```

Then for each text, fetch assigned tags:
```sql
SELECT tg.id, tg.label, tg.color
FROM tags tg
INNER JOIN text_tags tt ON tg.id = tt.tag_id
WHERE tt.text_id = ?;
```

## UI Components

### Title Bar (Library View)

```text
┌──────────────────────────────────────────────────────────────┐
│  [+] [🏷 Manage Tags]    [Filter ▾ tags...]  [↕]    [⚙...]  │
│   left section              center            right section   │
└──────────────────────────────────────────────────────────────┘
```

- **[+]**: Existing "add text" button
- **[🏷 Manage Tags]**: NEW button → opens ManageTagsDialog modal
- **[Filter ▾ tags...]**: NEW multiselect dropdown (TagFilterDropdown)
- **[↕]**: NEW sort toggle (ArrowUp ↔ ArrowDown)

### Library Card (with Tags)

```text
┌─────────────────────────┐
│  Title of the Text      │
│  Feb 24, 2026           │
│  [Fiction] [HSK4]       │  ← colored tag chips
└─────────────────────────┘
```

### Right-Click Context Menu

```text
┌─────────────────────────┐
│  Tags                 ▸ │  ← submenu
│  Delete                 │  ← existing
└─────────────────────────┘

    ┌─────────────────────┐
    │  ☑ Fiction          │  ← checked = assigned
    │  ☐ HSK4             │  ← unchecked = not assigned
    │  ☑ Favorites        │
    └─────────────────────┘
```

### Manage Tags Dialog

```text
┌──────── Manage Tags ─────────┐
│                               │
│  [● Red ] Fiction    [✏] [🗑] │
│  [● Blue] HSK4       [✏] [🗑] │
│  [● Teal] Favorites  [✏] [🗑] │
│                               │
│  [+ New tag...]               │
│                               │
│                     [Close]   │
└───────────────────────────────┘
```

## Key Integration Points

1. **`src-tauri/src/database.rs`**: Add tables in `initialize()`, add CRUD + query functions
2. **`src-tauri/src/domain.rs`**: Add `Tag`, `TagSummary`, `TextPreviewWithTags` structs
3. **`src-tauri/src/commands.rs`**: Add 7 new commands (see table above)
4. **`src-tauri/src/lib.rs`**: Register new commands in `generate_handler![]`
5. **`src/types/domain.ts`**: Add `Tag` interface, extend `TextPreview` with `tags`
6. **`src/hooks/useTextLoader.ts`**: Add tag state, filter/sort params to `refreshPreviews`
7. **`src/components/TitleBar.tsx`**: Add Manage Tags button, pass filter/sort callbacks
8. **`src/components/LibraryScreen.tsx`**: Extend context menu, add multi-select state
9. **`src/components/TextPreviewCard.tsx`**: Render tag chips
10. **`src/components/ManageTagsDialog.tsx`**: NEW modal component
11. **`src/components/TagFilterDropdown.tsx`**: NEW dropdown component
12. **`src/data/tagColors.ts`**: NEW predefined color palette
