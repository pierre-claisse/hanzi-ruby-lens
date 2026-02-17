# Data Model: Text Input UI

**Feature**: 015-text-input-ui
**Date**: 2026-02-17

## Existing Entities (unchanged)

### Text (aggregate root)

The Text entity already exists and requires no modifications for this feature.

**Rust** (`src-tauri/src/domain.rs`):
```rust
pub struct Text {
    pub raw_input: String,      // User-entered content
    pub segments: Vec<TextSegment>,  // LLM-generated segments (empty until 016)
}
```

**TypeScript** (`src/types/domain.ts`):
```typescript
interface Text {
    rawInput?: string;          // Optional in TS type (becomes required in practice)
    segments: TextSegment[];    // Empty array for newly saved text
}
```

**SQLite** (`texts` table):
```sql
CREATE TABLE texts (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton
    raw_input TEXT NOT NULL DEFAULT '',
    segments TEXT NOT NULL DEFAULT '[]'       -- JSON array of TextSegment
);
```

**Note**: The `rawInput` field in TypeScript is marked optional (`?`) but should always be present for saved texts. No schema change needed — the existing `raw_input` column stores user input.

## New Types (frontend only)

### AppView (union type)

Represents the current view state of the application. Not persisted — derived from data on load, then managed by user interaction.

```typescript
type AppView = "empty" | "input" | "saved" | "reading";
```

**State derivation on app load**:

| `load_text` result | `segments` | Derived `AppView` |
|---|---|---|
| `null` | N/A | `"empty"` |
| `Text` | `[]` (empty) | `"saved"` |
| `Text` | `[...]` (non-empty) | `"reading"` |

**Transitions**:

| From | Action | To |
|---|---|---|
| `empty` | User clicks "Enter text" CTA | `input` |
| `input` | User submits text | `saved` |
| `input` | User cancels (from empty) | `empty` |
| `input` | User cancels (from saved/reading) | `saved` or `reading` |
| `saved` | User clicks edit | `input` |
| `reading` | User clicks edit | `input` |

## Data Flow

```
User types in textarea
    ↓
Submit button clicked
    ↓
invoke("save_text", { text: { rawInput: inputValue, segments: [] } })
    ↓
Rust: DELETE FROM texts; INSERT INTO texts (raw_input='...', segments='[]')
    ↓
Frontend: setView("saved")
```

No new tables, columns, or Rust types.
